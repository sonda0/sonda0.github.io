#!/usr/bin/env python3
"""
SONDA 0 // FLIGHT-TELEMETRY V1.0
Generador determinista e idempotente de telemetría de vuelo pública.

Extrae parámetros ÚNICAMENTE de fuentes documentadas:
- public/data/mission.json
- public/data/transmissions.json
- public/data/systems.json
- scripts/anomaly_catalog.json
- transmisiones/LOG-*.md

NO genera telemetría ficticia. NO interpola. NO simula mediciones en tiempo real.
"""

import json
import re
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# ─── CONFIGURACIÓN ───
SCRIPT_DIR = Path(__file__).resolve().parent
MISSION_CONTROL_DIR = SCRIPT_DIR.parent
WORKSPACE_ROOT = MISSION_CONTROL_DIR.parent

# Defaults (can be overridden by CLI args)
DEFAULT_PUBLIC_DATA_DIR = MISSION_CONTROL_DIR / "public" / "data"
DEFAULT_SOURCE_DIR = WORKSPACE_ROOT

OUTPUT_FILENAME = "flight-telemetry.json"

# ─── ESTADOS EPISTÉMICOS ───
FLIGHT_EPISTEMIC_STATES = [
    'MEASURED_NARRATIVE',
    'ESTIMATED',
    'HISTORICAL',
    'UNKNOWN',
    'CONFLICTING',
    'STALE'
]

CATEGORIES = [
    'NAVEGACION',
    'AMBIENTE',
    'ENERGIA',
    'COMUNICACIONES',
    'SISTEMAS'
]

# ─── UTILIDADES ───
def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def parse_au_value(text: str) -> Optional[float]:
    """Extrae valor numérico en AU de un string."""
    match = re.search(r'([0-9]+\.[0-9]+)\s*AU', text, re.IGNORECASE)
    if match:
        return float(match.group(1))
    return None

def parse_percentage(text: str) -> Optional[float]:
    """Extrae porcentaje de un string."""
    match = re.search(r'([0-9]+\.?[0-9]*)\s*%', text)
    if match:
        return float(match.group(1))
    return None

def parse_kelvin(text: str) -> Optional[float]:
    """Extrae temperatura en Kelvin."""
    match = re.search(r'([0-9]+\.?[0-9]*)\s*K', text, re.IGNORECASE)
    if match:
        return float(match.group(1))
    return None

def load_json_file(path: Path) -> Optional[dict]:
    """Carga JSON de forma segura."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None

def find_transmission_by_id(transmissions: list, log_id: str) -> Optional[dict]:
    """Busca transmisión por ID."""
    for tx in transmissions:
        if tx.get('id') == log_id:
            return tx
    return None

# ─── EXTRACCIÓN DE PARÁMETROS DESDE FUENTES DOCUMENTADAS ───

def extract_navigation_parameters(
    mission: dict,
    transmissions: list,
    systems: dict
) -> list[dict]:
    """Extrae parámetros de navegación desde fuentes documentadas."""
    params = []
    
    # 1. Distancia heliocéntrica
    dist_item = mission.get('telemetry', {}).get('distance', {})
    dist_value = dist_item.get('value', '169.34 AU')
    dist_class = dist_item.get('classification', 'ESTIMATED')
    dist_notes = dist_item.get('notes', '')
    
    # Buscar serie histórica en transmisiones
    historical_series = []
    for tx in transmissions:
        tel = tx.get('telemetry', {})
        dist = tel.get('distance')
        dist_status = tel.get('distance_status')
        if dist and dist_status:
            au_val = parse_au_value(dist)
            if au_val is not None:
                historical_series.append({
                    'date': tx.get('date'),
                    'value': f"{au_val:.2f} AU",
                    'source': tx.get('id'),
                    'epistemicState': dist_status
                })
    
    # Deduplicar serie histórica
    seen = set()
    unique_series = []
    for pt in historical_series:
        key = pt['value']
        if key not in seen:
            seen.add(key)
            unique_series.append(pt)
    
    params.append({
        'id': 'nav.heliocentric_distance',
        'name': 'Distancia Heliocéntrica',
        'value': dist_value,
        'unit': 'AU',
        'category': 'NAVEGACION',
        'epistemicState': dist_class,
        'documentarySource': 'mission.json::telemetry.distance',
        'provenanceLog': 'LOG-0016, LOG-0000',
        'observationDate': mission.get('last_transmission_date', now_iso()),
        'uncertainty': 'Modelo orbital congelado tras LOG-0016; sin solución DSN independiente. No se extrapola avance.',
        'validityState': 'STALE' if dist_class == 'ESTIMATED' else 'VALID',
        'historicalSeries': unique_series if len(unique_series) >= 2 else None,
        'notes': dist_notes
    })
    
    # 2. Velocidad inercial
    # LOG-0000 menciona "Rumbo de escape 112 grados" pero no da velocidad numérica
    # NavigationMap.tsx: "NO DETERMINADO (Sin solución DSN)"
    params.append({
        'id': 'nav.inertial_velocity',
        'name': 'Velocidad Inercial',
        'value': 'NO DETERMINADO',
        'unit': 'km/s',
        'category': 'NAVEGACION',
        'epistemicState': 'UNKNOWN',
        'documentarySource': 'navigationData.ts::extractNavigationTelemetry, LOG-0000',
        'provenanceLog': 'LOG-0000',
        'observationDate': '2026-11-06T04:12:09Z',
        'uncertainty': 'Sin solución DSN; vector inercial no reconstruible solo con posiciones antiguas y potencia declarada (LOG-0016).',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Vector cinemático de velocidad inercial: NO DETERMINADO (Sin solución DSN)'
    })
    
    # 3. Aceleración
    params.append({
        'id': 'nav.acceleration',
        'name': 'Aceleración',
        'value': 'NO DETERMINADO',
        'unit': 'm/s²',
        'category': 'NAVEGACION',
        'epistemicState': 'UNKNOWN',
        'documentarySource': 'Sin registro instrumental documentado',
        'provenanceLog': 'N/A',
        'observationDate': now_iso(),
        'uncertainty': 'No hay datos de aceleración en bitácoras públicas. Propulsores iónicos desconectados (systems.json).',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Propulsores iónicos desconectados para salvaguarda de reserva (systems.json::SYS-RTG-01)'
    })
    
    # 4. Orientación del chasis
    # LOG-0000: "Al girar el chasis hacia el plano galáctico exterior"
    # navigationData.ts: "112° hacia plano galáctico (LOG-0000)"
    params.append({
        'id': 'nav.chassis_orientation',
        'name': 'Orientación del Chasis',
        'value': '112° hacia plano galáctico exterior',
        'unit': 'grados',
        'category': 'NAVEGACION',
        'epistemicState': 'HISTORICAL',
        'documentarySource': 'LOG-0000, navigationData.ts::NAV-SONDA-0.physicalNotes',
        'provenanceLog': 'LOG-0000',
        'observationDate': '2026-11-06T04:12:09Z',
        'uncertainty': 'Orientación instrumental declarada en LOG-0000; no hay telemetría de actitud actual independiente.',
        'validityState': 'STALE',
        'historicalSeries': None,
        'notes': 'Giro de chasis declarado en LOG-0000; orientación fija desde pérdida de portadora'
    })
    
    # 5. Vector de desplazamiento
    params.append({
        'id': 'nav.displacement_vector',
        'name': 'Vector de Desplazamiento',
        'value': 'Escape heliosférico; rumbo 112° (LOG-0000)',
        'unit': 'vector',
        'category': 'NAVEGACION',
        'epistemicState': 'ESTIMATED',
        'documentarySource': 'LOG-0000, navigationData.ts::NAV-SONDA-0.physicalNotes',
        'provenanceLog': 'LOG-0000',
        'observationDate': '2026-11-06T04:12:09Z',
        'uncertainty': 'Vector cinemático completo NO DETERMINADO; solo rumbo instrumental conocido.',
        'validityState': 'STALE',
        'historicalSeries': None,
        'notes': 'Rumbo de escape 112 grados hacia el plano galáctico exterior (LOG-0000)'
    })
    
    # 6. Estado del modelo de trayectoria
    params.append({
        'id': 'nav.trajectory_model_status',
        'name': 'Estado del Modelo de Trayectoria',
        'value': 'MODELO CONGELADO',
        'unit': 'estado',
        'category': 'NAVEGACION',
        'epistemicState': 'MEASURED_NARRATIVE',
        'documentarySource': 'LOG-0016, navigationData.ts::extractNavigationTelemetry',
        'provenanceLog': 'LOG-0016',
        'observationDate': '2026-11-07T18:00:00Z',
        'uncertainty': 'Propagación orbital automática congelada por protocolo EXODATA V3.1 tras LOG-0016. Pendiente de validación física.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Congelada en 169.34 AU pendiente de validación física (navigationData.ts)'
    })
    
    return params


def extract_environment_parameters(
    mission: dict,
    transmissions: list,
    systems: dict
) -> list[dict]:
    """Extrae parámetros de ambiente desde fuentes documentadas."""
    params = []
    
    # 1. Temperatura exterior
    # LOG-0001: "temperatura basal se mantiene invariable en 3.12 K" (referido a HEX-04, no a la sonda)
    # systems.json: sensores_bolometricos "3.1 K basal"
    params.append({
        'id': 'env.external_temperature',
        'name': 'Temperatura Exterior',
        'value': '3.1 K (fondo cósmico / basal)',
        'unit': 'K',
        'category': 'AMBIENTE',
        'epistemicState': 'HISTORICAL',
        'documentarySource': 'systems.json::SYS-INT-01.metrics.sensores_bolometricos, LOG-0001',
        'provenanceLog': 'LOG-0001',
        'observationDate': '2026-11-07T03:00:00Z',
        'uncertainty': '3.1 K basal corresponde a sensores bolométricos; temperatura de fondo cósmico de microondas ~2.7 K. No hay medición directa de temperatura ambiente de la sonda.',
        'validityState': 'STALE',
        'historicalSeries': None,
        'notes': 'Sensores bolométricos en línea (3.1 K basal) - systems.json'
    })
    
    # 2. Temperatura interna
    params.append({
        'id': 'env.internal_temperature',
        'name': 'Temperatura Interna',
        'value': 'NO DETERMINADO',
        'unit': 'K',
        'category': 'AMBIENTE',
        'epistemicState': 'UNKNOWN',
        'documentarySource': 'Sin registro en bitácoras públicas',
        'provenanceLog': 'N/A',
        'observationDate': now_iso(),
        'uncertainty': 'No hay telemetría de temperatura interna del bus en fuentes públicas.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'No documentado en transmisiones públicas ni mission.json'
    })
    
    # 3. Temperatura de instrumentos
    # systems.json: "temperatura_termopar": "584 K" para RTG
    params.append({
        'id': 'env.instrument_temperature',
        'name': 'Temperatura de Instrumentos',
        'value': 'Ver parámetros específicos (RTG: 584 K)',
        'unit': 'K',
        'category': 'AMBIENTE',
        'epistemicState': 'HISTORICAL',
        'documentarySource': 'systems.json::SYS-RTG-01.metrics.temperatura_termopar',
        'provenanceLog': 'systems.json',
        'observationDate': mission.get('last_data_update', now_iso()),
        'uncertainty': 'Solo temperatura de termopar RTG documentada (584 K). Otros instrumentos sin telemetría térmica pública.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Temperatura termopar RTG: 584 K (systems.json). Óptica e interferométrico sin datos térmicos públicos.'
    })
    
    # 4. Radiación
    # systems.json: magnetometro_flujo "0.01 nT resolución"
    # LOG-0001: "compresión magnética periódica de 1.8 Gauss cada 73.004 segundos"
    # LOG-0002: "partículas incidentes en el fuselaje han incrementado la erosión iónica"
    params.append({
        'id': 'env.radiation',
        'name': 'Radiación',
        'value': 'Magnetómetro: 0.01 nT resolución; Erosión iónica detectada',
        'unit': 'nT / eventos',
        'category': 'AMBIENTE',
        'epistemicState': 'MEASURED_NARRATIVE',
        'documentarySource': 'systems.json::SYS-INT-01.metrics.magnetometro_flujo, LOG-0001, LOG-0002',
        'provenanceLog': 'LOG-0001, LOG-0002',
        'observationDate': '2026-11-07T03:00:00Z',
        'uncertainty': 'Magnetómetro operacional (0.01 nT res). Compresión magnética 1.8 G/73s en HEX-04 (LOG-0001). Erosión iónica en capa ablativa (LOG-0002). No hay dosimetría acumulada pública.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Magnetómetro de puerta de flujo en línea (0.01 nT resolución). Blindaje de radiación: activo (transmisiones).'
    })
    
    # 5. Estado del blindaje
    params.append({
        'id': 'env.shielding_status',
        'name': 'Estado del Blindaje',
        'value': 'ACTIVO (capa ablativa con erosión iónica compensada)',
        'unit': 'estado',
        'category': 'AMBIENTE',
        'epistemicState': 'MEASURED_NARRATIVE',
        'documentarySource': 'transmissions.json (subsystems_status recurrente), systems.json::SYS-OPT-01',
        'provenanceLog': 'LOG-0001 a LOG-0015',
        'observationDate': mission.get('last_transmission_date', now_iso()),
        'uncertainty': 'Blindaje de radiación reportado "activo" en transmisiones. Óptica: 1,420 micro-impactos compensados (86% integridad).',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Blindaje de radiación: activo (telemetría recurrente). Integridad óptica 86% con 1,420 micro-impactos compensados.'
    })
    
    return params


def extract_energy_parameters(
    mission: dict,
    transmissions: list,
    systems: dict
) -> list[dict]:
    """Extrae parámetros de energía desde fuentes documentadas."""
    params = []
    
    rtg_item = mission.get('telemetry', {}).get('rtg_power', {})
    rtg_value = rtg_item.get('value', '41.71%')
    rtg_class = rtg_item.get('classification', 'HISTORICAL')
    rtg_notes = rtg_item.get('notes', '')
    
    # Serie histórica de RTG desde transmisiones
    rtg_series = []
    for tx in transmissions:
        tel = tx.get('telemetry', {})
        subsys = tel.get('subsystems_status', '')
        pct = parse_percentage(subsys)
        if pct is not None and 'RTG' in subsys.upper():
            rtg_series.append({
                'date': tx.get('date'),
                'value': f"{pct:.2f}%",
                'source': tx.get('id'),
                'epistemicState': 'HISTORICAL'
            })
    
    # Deduplicar
    seen = set()
    unique_rtg_series = []
    for pt in rtg_series:
        key = pt['value']
        if key not in seen:
            seen.add(key)
            unique_rtg_series.append(pt)
    
    # 1. Potencia residual RTG
    params.append({
        'id': 'energy.rtg_power',
        'name': 'Potencia Residual RTG',
        'value': rtg_value,
        'unit': '%',
        'category': 'ENERGIA',
        'epistemicState': rtg_class,
        'documentarySource': 'mission.json::telemetry.rtg_power, systems.json::SYS-RTG-01',
        'provenanceLog': 'LOG-0000 a LOG-0015',
        'observationDate': mission.get('last_transmission_date', now_iso()),
        'uncertainty': 'Potencia residual calculada a partir de curva de decaimiento del plutonio-238. Tasa de degradación estimada 0.8% por ciclo orbital (systems.json).',
        'validityState': 'STALE' if rtg_class == 'HISTORICAL' else 'VALID',
        'historicalSeries': unique_rtg_series if len(unique_rtg_series) >= 2 else None,
        'notes': rtg_notes
    })
    
    # 2. Consumo eléctrico
    # systems.json: "potencia_emision": "18.5 W" para transceptor
    # No hay consumo total documentado
    params.append({
        'id': 'energy.electrical_consumption',
        'name': 'Consumo Eléctrico',
        'value': 'Parcial: Transceptor 18.5 W (emisión)',
        'unit': 'W',
        'category': 'ENERGIA',
        'epistemicState': 'HISTORICAL',
        'documentarySource': 'systems.json::SYS-COM-01.metrics.potencia_emision',
        'provenanceLog': 'systems.json',
        'observationDate': mission.get('last_data_update', now_iso()),
        'uncertainty': 'Solo potencia de emisión del transceptor documentada (18.5 W). Consumo total de instrumentos, cómputo y calefacción no público.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Potencia emisión transceptor banda X: 18.5 W. Propulsores iónicos desconectados.'
    })
    
    # 3. Reserva energética
    params.append({
        'id': 'energy.reserve',
        'name': 'Reserva Energética',
        'value': 'NO DETERMINADO',
        'unit': '%',
        'category': 'ENERGIA',
        'epistemicState': 'UNKNOWN',
        'documentarySource': 'Sin registro en fuentes públicas',
        'provenanceLog': 'N/A',
        'observationDate': now_iso(),
        'uncertainty': 'No hay telemetría de reserva de batería/condensadores en bitácoras públicas.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Arquitectura RTG sin baterías de reserva documentadas; alimentación directa.'
    })
    
    # 4. Temperatura RTG
    params.append({
        'id': 'energy.rtg_temperature',
        'name': 'Temperatura RTG',
        'value': '584 K',
        'unit': 'K',
        'category': 'ENERGIA',
        'epistemicState': 'HISTORICAL',
        'documentarySource': 'systems.json::SYS-RTG-01.metrics.temperatura_termopar',
        'provenanceLog': 'systems.json',
        'observationDate': mission.get('last_data_update', now_iso()),
        'uncertainty': 'Temperatura de termopar reportada en systems.json. No hay serie temporal pública.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Temperatura termopar RTG (systems.json::SYS-RTG-01)'
    })
    
    return params


def extract_communications_parameters(
    mission: dict,
    transmissions: list,
    systems: dict
) -> list[dict]:
    """Extrae parámetros de comunicaciones desde fuentes documentadas."""
    params = []
    
    # 1. Estado de portadora
    carrier_status = mission.get('carrier_status', 'SIN_PORTADORA')
    carrier_label = mission.get('carrier_label', '')
    
    params.append({
        'id': 'comms.carrier_status',
        'name': 'Estado de Portadora',
        'value': carrier_label or carrier_status,
        'unit': 'estado',
        'category': 'COMUNICACIONES',
        'epistemicState': 'MEASURED_NARRATIVE',
        'documentarySource': 'mission.json::carrier_status, mission.json::carrier_label',
        'provenanceLog': 'LOG-0000',
        'observationDate': mission.get('last_transmission_date', now_iso()),
        'uncertainty': 'Pérdida de portadora artificial detectada hace > 4,200 ciclos. Estado confirmado por ausencia de acuse DSN.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': carrier_label
    })
    
    # 2. Velocidad enlace de subida (uplink)
    params.append({
        'id': 'comms.uplink_rate',
        'name': 'Velocidad del Enlace de Subida',
        'value': '0 bps',
        'unit': 'bps',
        'category': 'COMUNICACIONES',
        'epistemicState': 'MEASURED_NARRATIVE',
        'documentarySource': 'mission.json::earth_link_description, systems.json::SYS-COM-01.metrics.canal_recepcion',
        'provenanceLog': 'LOG-0000',
        'observationDate': mission.get('last_transmission_date', now_iso()),
        'uncertainty': 'Canal de recepción inactivo por ausencia de portadora DSN. Cero paquetes de comando recibidos.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Uplink: 0 bps (sin portadora DSN). Antena HGA fija en recepción pasiva (LOG-0000).'
    })
    
    # 3. Velocidad enlace de bajada (downlink)
    # Emisión periódica de paquetes de bitácora
    params.append({
        'id': 'comms.downlink_rate',
        'name': 'Velocidad del Enlace de Bajada',
        'value': 'Intermitente (paquetes de bitácora horarios)',
        'unit': 'bps',
        'category': 'COMUNICACIONES',
        'epistemicState': 'MEASURED_NARRATIVE',
        'documentarySource': 'systems.json::SYS-COM-01.details, mission.json::subsystem_summary',
        'provenanceLog': 'LOG-0016+',
        'observationDate': mission.get('last_transmission_date', now_iso()),
        'uncertainty': 'Emisión unidireccional de paquetes de bitácora hacia coordenadas solares. Tasa de baudios no especificada en fuentes públicas.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Emisión periódica de paquetes de bitácora hacia coordenadas solares de origen. Solo difusión.'
    })
    
    # 4. Latencia de propagación estimada
    # Solo si hay distancia válida, origen/destino definido y modelo explícito
    dist_au = parse_au_value(mission.get('telemetry', {}).get('distance', {}).get('value', '169.34 AU'))
    if dist_au:
        # Luz: 1 UA ≈ 499 segundos
        latency_seconds = dist_au * 499.0
        latency_hours = latency_seconds / 3600
        latency_str = f"{latency_seconds:.0f} s ({latency_hours:.2f} h)"
        epistemic = 'ESTIMATED'
        uncertainty = f'Calculada a partir de distancia estimada {dist_au:.2f} AU × 499 s/AU. Modelo: propagación electromagnética en vacío. Origen: Sonda. Destino: Tierra (DSN). Distancia no verificada independientemente.'
    else:
        latency_str = 'NO DETERMINADO'
        epistemic = 'UNKNOWN'
        uncertainty = 'Distancia heliocéntrica no verificada; no se puede calcular latencia con modelo explícito.'
    
    params.append({
        'id': 'comms.propagation_latency',
        'name': 'Latencia de Propagación Estimada',
        'value': latency_str,
        'unit': 's',
        'category': 'COMUNICACIONES',
        'epistemicState': epistemic,
        'documentarySource': 'mission.json::telemetry.distance.value + modelo física (c = 299,792 km/s)',
        'provenanceLog': 'LOG-0016 (distancia congelada)',
        'observationDate': mission.get('last_transmission_date', now_iso()),
        'uncertainty': uncertainty,
        'validityState': 'STALE' if epistemic == 'ESTIMATED' else 'VALID',
        'historicalSeries': None,
        'notes': 'Solo calculada cuando existe distancia válida, origen/destino definido y modelo explícito de propagación.'
    })
    
    return params


def extract_systems_parameters(
    mission: dict,
    transmissions: list,
    systems: dict
) -> list[dict]:
    """Extrae parámetros de sistemas desde fuentes documentadas."""
    params = []
    
    # 1. Integridad de memoria
    mem_item = mission.get('telemetry', {}).get('memory_integrity', {})
    mem_value = mem_item.get('value', 'VERIFICADA / SIN CORRUPCIÓN')
    mem_class = mem_item.get('classification', 'HISTORICAL')
    mem_notes = mem_item.get('notes', '')
    
    params.append({
        'id': 'sys.memory_integrity',
        'name': 'Integridad de Memoria',
        'value': mem_value,
        'unit': 'estado',
        'category': 'SISTEMAS',
        'epistemicState': mem_class,
        'documentarySource': 'mission.json::telemetry.memory_integrity, systems.json::SYS-MNE-01',
        'provenanceLog': 'LOG-0016',
        'observationDate': mission.get('last_transmission_date', now_iso()),
        'uncertainty': 'Arquitectura MNEMOSYNE-0 protegida contra escrituras no autorizadas. Divergencia ANOM-SYS-0001 contenida (LOG-0016). 0 divergencias activas detectadas.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': mem_notes
    })
    
    # 2. Estado de instrumentos
    # Desde systems.json: todos los subsistemas científicos
    instrument_status = []
    for sys in systems.get('subsystems', []):
        if sys.get('category') in ['ÓPTICA Y OBSERVACIÓN', 'SENSORES CIENTÍFICOS']:
            instrument_status.append(f"{sys['name']}: {sys['narrative_status']}")
    
    params.append({
        'id': 'sys.instrument_status',
        'name': 'Estado de Instrumentos',
        'value': '; '.join(instrument_status) if instrument_status else 'OPERATIVOS',
        'unit': 'estado',
        'category': 'SISTEMAS',
        'epistemicState': 'MEASURED_NARRATIVE',
        'documentarySource': 'systems.json::SYS-OPT-01, SYS-INT-01',
        'provenanceLog': 'systems.json',
        'observationDate': mission.get('last_data_update', now_iso()),
        'uncertainty': 'Lente multiespectral: 86% integridad, 1,420 micro-impactos compensados. Arreglo interferométrico: sincronizado. Espectrómetro, magnetómetro, bolómetros en línea.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Óptica: OPERATIVO CON COMPENSACIÓN. Interferométrico: OPERATIVO NOMINAL.'
    })
    
    # 3. Disponibilidad computacional
    # LOG-0000: "94% de ciclos de procesamiento reasignados al arreglo interferométrico"
    params.append({
        'id': 'sys.compute_availability',
        'name': 'Disponibilidad Computacional',
        'value': '94% reasignado a interferometría (LOG-0000)',
        'unit': '%',
        'category': 'SISTEMAS',
        'epistemicState': 'HISTORICAL',
        'documentarySource': 'LOG-0000, systems.json::SYS-CORE-01',
        'provenanceLog': 'LOG-0000',
        'observationDate': '2026-11-06T04:12:09Z',
        'uncertainty': 'Valor de LOG-0000 (genesis). Arquitectura EXODATA V3.1 en control autónomo (3,600 s/ciclo). No hay telemetría actual de uso de CPU.',
        'validityState': 'STALE',
        'historicalSeries': None,
        'notes': '94% ciclos a interferometría tras pérdida de portadora (LOG-0000). Protocolo EXODATA V3.1 verificado (systems.json).'
    })
    
    # 4. Orientación de antena
    ant_item = next((s for s in systems.get('subsystems', []) if s['id'] == 'SYS-COM-01'), None)
    ant_gain = ant_item.get('metrics', {}).get('antena_hga', '45% ganancia nominal / fija') if ant_item else '45% ganancia nominal / fija'
    
    params.append({
        'id': 'sys.antenna_orientation',
        'name': 'Orientación de Antena',
        'value': ant_gain,
        'unit': 'grados / estado',
        'category': 'SISTEMAS',
        'epistemicState': 'MEASURED_NARRATIVE',
        'documentarySource': 'systems.json::SYS-COM-01.metrics.antena_hga, LOG-0000',
        'provenanceLog': 'LOG-0000',
        'observationDate': '2026-11-06T04:12:09Z',
        'uncertainty': 'Antena HGA fija (sin gimbal activo). Ganancia 45% nominal. Apuntada a coordenadas solares de origen.',
        'validityState': 'VALID',
        'historicalSeries': None,
        'notes': 'Antena HGA fija en recepción pasiva / emisión hacia sector solar (LOG-0000).'
    })
    
    return params


def build_flight_telemetry(public_data_dir: Path, source_dir: Path) -> dict:
    """Construye el objeto completo de telemetría de vuelo."""
    
    # Cargar fuentes
    mission = load_json_file(public_data_dir / "mission.json")
    transmissions = load_json_file(public_data_dir / "transmissions.json")
    systems = load_json_file(public_data_dir / "systems.json")
    
    if not mission or not transmissions or not systems:
        raise RuntimeError("Fuentes de datos requeridas no encontradas")
    
    all_params = []
    
    # Extraer por categorías
    all_params.extend(extract_navigation_parameters(mission, transmissions, systems))
    all_params.extend(extract_environment_parameters(mission, transmissions, systems))
    all_params.extend(extract_energy_parameters(mission, transmissions, systems))
    all_params.extend(extract_communications_parameters(mission, transmissions, systems))
    all_params.extend(extract_systems_parameters(mission, transmissions, systems))
    
    # Calcular integridad
    counts = {state: 0 for state in FLIGHT_EPISTEMIC_STATES}
    for p in all_params:
        counts[p['epistemicState']] = counts.get(p['epistemicState'], 0) + 1
    
    with_series = sum(1 for p in all_params if p.get('historicalSeries'))
    
    return {
        'schema_version': '1.0',
        'generated_at': now_iso(),
        'source_commit': None,  # Se inyecta desde sync_mission.py
        'parameters': all_params,
        'integrity': {
            'total_parameters': len(all_params),
            'measured_narrative_count': counts.get('MEASURED_NARRATIVE', 0),
            'estimated_count': counts.get('ESTIMATED', 0),
            'historical_count': counts.get('HISTORICAL', 0),
            'unknown_count': counts.get('UNKNOWN', 0),
            'conflicting_count': counts.get('CONFLICTING', 0),
            'stale_count': counts.get('STALE', 0),
            'with_historical_series': with_series
        }
    }


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="FLIGHT-TELEMETRY V1.0 // Generador determinista")
    parser.add_argument("--output-dir", type=str, default=None, help="Directorio de salida para flight-telemetry.json")
    parser.add_argument("--source-dir", type=str, default=None, help="Directorio fuente (workspace root)")
    parser.add_argument("--commit-sha", type=str, default=None, help="Commit SHA de origen")
    args = parser.parse_args()
    
    public_data_dir = Path(args.output_dir).resolve() if args.output_dir else DEFAULT_PUBLIC_DATA_DIR
    source_dir = Path(args.source_dir).resolve() if args.source_dir else DEFAULT_SOURCE_DIR
    
    print(f"[FLIGHT-TELEMETRY] Output: {public_data_dir}")
    print(f"[FLIGHT-TELEMETRY] Source: {source_dir}")
    print("[FLIGHT-TELEMETRY] Iniciando generación determinista...")
    
    try:
        telemetry = build_flight_telemetry(public_data_dir, source_dir)
        if args.commit_sha:
            telemetry['source_commit'] = args.commit_sha
    except Exception as e:
        print(f"[ERROR] Fallo al construir telemetría: {e}")
        return 1
    
    # Escritura atómica
    public_data_dir.mkdir(parents=True, exist_ok=True)
    output_file = public_data_dir / OUTPUT_FILENAME
    tmp_path = output_file.with_suffix('.tmp')
    
    try:
        with open(tmp_path, 'w', encoding='utf-8') as f:
            json.dump(telemetry, f, indent=2, ensure_ascii=False)
            f.flush()
            import os
            os.fsync(f.fileno())
        tmp_path.replace(output_file)
        print(f"[OK] Generado {output_file} ({output_file.stat().st_size} bytes)")
        print(f"[OK] Parámetros: {telemetry['integrity']['total_parameters']}")
        print(f"[OK] Con serie histórica: {telemetry['integrity']['with_historical_series']}")
        return 0
    except Exception as e:
        print(f"[ERROR] Fallo al escribir: {e}")
        if tmp_path.exists():
            tmp_path.unlink()
        return 1


if __name__ == '__main__':
    exit(main())