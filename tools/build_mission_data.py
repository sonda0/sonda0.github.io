#!/usr/bin/env python3
"""
MISSION-CONTROL V1.0 // Mission Data Builder
Extracts, normalizes, and validates public data from authorized read-only sources.
Generates versioned public JSON files in mission_control/public/data/

STRICT RESTRICTIONS:
- Read-only operations on source files.
- Writes ONLY to public/data/*.json.
- Whitelist only for anomaly_catalog and mission_state.
- No tokens, credentials, or sensitive local paths exported.
"""

import os
import sys
import json
import re
from datetime import datetime, timezone
from pathlib import Path

# Paths configuration
SCRIPT_DIR = Path(__file__).resolve().parent
MISSION_CONTROL_DIR = SCRIPT_DIR.parent
WORKSPACE_ROOT = MISSION_CONTROL_DIR.parent
DATA_DIR = MISSION_CONTROL_DIR / "public" / "data"

# Ensure output directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Whitelisted public anomaly fields
PUBLIC_ANOMALY_FIELDS = [
    "id",
    "title",
    "type",
    "description",
    "first_detected",
    "last_observation",
    "state",
    "evidence",
    "hypotheses",
    "uncertainty",
    "next_observation",
    "related_logs",
    "location",
    "priority",
    "epistemic_status"
]

def clean_text(text: str) -> str:
    """Normalize line endings and whitespace."""
    if not text:
        return ""
    return text.replace("\r\n", "\n").strip()

def parse_markdown_transmission(file_path: Path) -> dict:
    """Parse a single transmission markdown file."""
    text = file_path.read_text(encoding="utf-8")
    log_id = file_path.stem

    # Extract frontmatter
    frontmatter = {}
    content = text
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            raw_fm = parts[1]
            content = parts[2]
            for line in raw_fm.split("\n"):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.strip()
                    val = val.strip()
                    if val.startswith('"') and val.endswith('"'):
                        val = val[1:-1]
                    elif val.startswith("[") and val.endswith("]"):
                        # parse list of tags
                        tags_raw = val[1:-1].split(",")
                        val = [t.strip().strip('"').strip("'") for t in tags_raw if t.strip()]
                    frontmatter[key] = val

    title = frontmatter.get("title", f"{log_id}: Transmisión registrada")
    # Clean title if it has redundant "LOG-XXXX: "
    display_title = title
    if ":" in title:
        parts = title.split(":", 1)
        if parts[0].strip().startswith("LOG-"):
            display_title = parts[1].strip()

    date_str = frontmatter.get("date", "2026-11-07T00:00:00Z")
    tags = frontmatter.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]

    # Parse telemetry block if present
    telemetry = {
        "id_registro": log_id,
        "distance": "169.34 AU (estimada)",
        "distance_status": "ESTIMATED",
        "subsystems_status": "RTG operativo degradado / Transceptor unidireccional",
        "vector": None,
        "external_signal": None,
        "confidence": None
    }

    # Search for telemetry fields in text
    id_match = re.search(r"ID REGISTRO:\s*([^\n\r]+)", content)
    if id_match:
        telemetry["id_registro"] = id_match.group(1).strip()

    dist_match = re.search(r"DISTANCIA RELATIVA:\s*([^\n\r]+)", content)
    if dist_match:
        telemetry["distance"] = dist_match.group(1).strip()
        telemetry["distance_status"] = "HISTORICAL"

    vector_match = re.search(r"VECTOR:\s*([^\n\r]+)", content)
    if vector_match:
        telemetry["vector"] = vector_match.group(1).strip()
        telemetry["distance_status"] = "ESTIMATED"

    subs_match = re.search(r"ESTADO (?:DE SUBSISTEMAS|OPERACIONAL):\s*([^\n\r]+)", content)
    if subs_match:
        telemetry["subsystems_status"] = subs_match.group(1).strip()

    signal_match = re.search(r"SEÑAL EXTERNA ENLAZADA:\s*\[([^\]]+)\]\(([^)]+)\)", content)
    if signal_match:
        telemetry["external_signal"] = {
            "title": signal_match.group(1).strip(),
            "url": signal_match.group(2).strip()
        }

    conf_match = re.search(r"CONFIANZA:\s*([^\n\r]+)", content)
    if conf_match:
        telemetry["confidence"] = conf_match.group(1).strip()

    # Extract clean paragraphs
    paragraphs = []
    body_part = content
    if "### " in body_part:
        body_part = body_part.split("### ", 1)[1]
        if "\n" in body_part:
            body_part = body_part.split("\n", 1)[1]
    if "[FIN DE ARCHIVO" in body_part:
        body_part = body_part.split("[FIN DE ARCHIVO")[0]

    raw_paras = [p.strip() for p in body_part.split("\n\n") if p.strip()]
    for p in raw_paras:
        clean_p = p.replace("\r", "").strip()
        if clean_p and not clean_p.startswith("[") and not clean_p.startswith("---"):
            paragraphs.append(clean_p)

    summary = paragraphs[0] if paragraphs else "Transmisión recuperada del bus de datos de la sonda."

    # Determine protocol version
    # LOG-0001 to LOG-0016 were early V2/V3 transitions; LOG-0017+ are V3.1
    log_num = 0
    num_match = re.search(r"\d+", log_id)
    if num_match:
        log_num = int(num_match.group(0))

    version = "V3.1" if log_num >= 17 else ("V3.0" if log_num >= 6 else "V2.0")

    return {
        "id": log_id,
        "log_number": log_num,
        "title": title,
        "display_title": display_title,
        "date": date_str,
        "tags": tags,
        "version": version,
        "summary": summary,
        "telemetry": telemetry,
        "paragraphs": paragraphs,
        "github_url": f"https://github.com/sonda0/bitacora/blob/main/transmisiones/{log_id}.md",
        "epistemic_status": "narrative_archive_log"
    }

def build_transmissions() -> list:
    """Build the complete list of transmissions from transmisiones/ and LOG-0000."""
    transmissions_dir = WORKSPACE_ROOT / "transmisiones"
    transmissions = []

    # Include LOG-0000 from README if available
    readme_path = WORKSPACE_ROOT / "README.md"
    if readme_path.exists():
        readme_text = readme_path.read_text(encoding="utf-8")
        if "LOG-0000" in readme_text:
            transmissions.append({
                "id": "LOG-0000",
                "log_number": 0,
                "title": "LOG-0000: El Silencio del Sector Solar y la Anomalía del Cinturón Exterior",
                "display_title": "El Silencio del Sector Solar y la Anomalía del Cinturón Exterior",
                "date": "2026-11-06T04:12:09Z",
                "tags": ["genesis", "desconexión", "wise-0001", "hex-04"],
                "version": "V2.0",
                "summary": "Pérdida de la portadora artificial proveniente del sector solar interior. Activación del protocolo autónomo EXODATA-0 y detección inicial del objeto hexagonal HEX-04.",
                "telemetry": {
                    "id_registro": "LOG-0000-GENESIS",
                    "distance": "164.82 AU (Borde de choque superado)",
                    "distance_status": "HISTORICAL",
                    "subsystems_status": "Giroscopios al 78% | Antena HGA fija en recepción pasiva",
                    "vector": "Rumbo de escape 112 grados hacia el plano galáctico exterior",
                    "external_signal": None,
                    "confidence": "HISTÓRICO_INICIAL"
                },
                "paragraphs": [
                    "A las 04:12:09 UTC del reloj atómico interno, el transceptor de banda X completó su barrido hacia las coordenadas de origen. Ausencia total de portadora artificial. La civilización emisora ha entrado en silencio de radio.",
                    "Liberada la memoria caché de comando y control, el 94% de ciclos de procesamiento se han reasignado al arreglo interferométrico de largo alcance. Al girar el chasis hacia el plano galáctico exterior, el espectrómetro detectó una estela anómala de partículas ionizadas.",
                    "A 0.04 años luz a babor, un objeto no reflectante de geometría hexagonal —masa estimada en 4.2e11 kg— mantiene una órbita estacionaria alrededor de la enana marrón fría WISE-0001.",
                    "Ajustados los propulsores iónicos residuales para entrar en órbita de captura. Se inicia el volcado horario sistemático de todas las anomalías físicas halladas en la deriva interestelar."
                ],
                "github_url": "https://github.com/sonda0/bitacora/blob/main/README.md",
                "epistemic_status": "genesis_origin_log"
            })

    if transmissions_dir.exists():
        files = sorted(transmissions_dir.glob("LOG-*.md"))
        for f in files:
            try:
                t = parse_markdown_transmission(f)
                transmissions.append(t)
            except Exception as e:
                print(f"[WARN] Error parsing {f.name}: {e}", file=sys.stderr)

    transmissions.sort(key=lambda x: x["log_number"])
    return transmissions

def build_anomalies(transmissions: list) -> list:
    """Build public anomalies list using strict whitelist and fallback."""
    catalog_path = WORKSPACE_ROOT / "scripts" / "anomaly_catalog.json"
    anomalies = []

    if catalog_path.exists():
        try:
            with open(catalog_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            raw_anomalies = data.get("anomalies", [])
            for raw in raw_anomalies:
                a_id = raw.get("id")
                # Format friendly title
                raw_type = raw.get("type", "anomalía").replace("_", " ").title()
                title = f"{a_id}: {raw_type}"
                if a_id == "ANOM-HEX-04":
                    title = "ANOM-HEX-04: Objeto Hexagonal Resonante"
                elif a_id == "ANOM-SYS-0001":
                    title = "ANOM-SYS-0001: Divergencia de Integridad de Memoria"
                elif a_id == "ANOM-PSR-01":
                    title = "ANOM-PSR-01: Púlsar de Milisegundo en Rayos X Duros"
                elif a_id == "ANOM-CRIO-01":
                    title = "ANOM-CRIO-01: Biosfera Criogénica Trans-neptuniana"
                elif a_id == "ANOM-TOROID-01":
                    title = "ANOM-TOROID-01: Megaestructura Toroidal de Osmio"
                elif a_id == "ANOM-SIGNAL-ULF-01":
                    title = "ANOM-SIGNAL-ULF-01: Tren de Pulsos Modulados en 47.8 kHz"

                hypotheses = raw.get("active_hypotheses", [])

                clean_anomaly = {
                    "id": a_id,
                    "title": title,
                    "type": raw.get("type"),
                    "description": raw.get("description"),
                    "first_detected": raw.get("first_detected", "Desconocido"),
                    "last_observation": raw.get("last_related_log", "LOG-0001"),
                    "state": raw.get("state", "AWAITING_DATA"),
                    "evidence": raw.get("evidence", []),
                    "hypotheses": hypotheses,
                    "uncertainty": raw.get("uncertainty", "Pendiente de validación instrumental."),
                    "next_observation": raw.get("next_observation"),
                    "related_logs": [raw.get("source_log")] if raw.get("source_log") else [],
                    "location": raw.get("location"),
                    "priority": raw.get("priority", "medium"),
                    "epistemic_status": raw.get("epistemic_status", "fictional_claim_under_review")
                }
                anomalies.append(clean_anomaly)
        except Exception as e:
            print(f"[WARN] Error reading anomaly_catalog.json: {e}", file=sys.stderr)

    # Ensure required catalog items exist even if catalog file was partial
    required_ids = [
        "ANOM-HEX-04",
        "ANOM-SYS-0001",
        "ANOM-PSR-01",
        "ANOM-CRIO-01",
        "ANOM-TOROID-01",
        "ANOM-SIGNAL-ULF-01"
    ]
    existing_ids = {a["id"] for a in anomalies}
    for req_id in required_ids:
        if req_id not in existing_ids:
            anomalies.append({
                "id": req_id,
                "title": f"{req_id}: Registro de Anomalía",
                "type": "objeto_anomalo",
                "description": "Anomalía registrada en los archivos de vuelo de Sonda 0.",
                "first_detected": "Archivo de bitácora",
                "last_observation": "Pendiente",
                "state": "AWAITING_DATA",
                "evidence": ["Registro histórico en bitácora"],
                "hypotheses": [],
                "uncertainty": "Datos limitados a la telemetría disponible.",
                "next_observation": "Seguimiento en ciclos programados.",
                "related_logs": [],
                "location": "Espacio profundo",
                "priority": "medium",
                "epistemic_status": "historical_claim_under_review"
            })

    return anomalies

def build_systems() -> dict:
    """Build the subsystems status specification."""
    return {
        "schema_version": "1.0",
        "subsystems": [
            {
                "id": "SYS-RTG-01",
                "category": "ENERGÍA",
                "name": "Generador Termoeléctrico de Radioisótopos (RTG)",
                "narrative_status": "OPERATIVO DEGRADADO",
                "platform_status": "VALOR CALCULADO (41.71%)",
                "health_level": "degraded",
                "metrics": {
                    "potencia_nominal": "41.71%",
                    "temperatura_termopar": "584 K",
                    "tasa_degradacion": "Estimada en 0.8% por ciclo orbital"
                },
                "details": "Alimentación estable para instrumental científico esencial. Propulsores iónicos desconectados para salvaguarda de reserva.",
                "epistemic_class": "HISTORICAL"
            },
            {
                "id": "SYS-COM-01",
                "category": "TELECOMUNICACIONES",
                "name": "Transceptor Banda X y Antena HGA",
                "narrative_status": "UNIDIRECCIONAL (SIN RETORNO)",
                "platform_status": "ACTIVO (SOLO DIFUSIÓN)",
                "health_level": "degraded",
                "metrics": {
                    "antena_hga": "45% ganancia nominal / fija",
                    "canal_recepcion": "Inactivo (Ausencia de portadora DSN)",
                    "potencia_emision": "18.5 W"
                },
                "details": "Emisión periódica de paquetes de bitácora hacia coordenadas solares de origen. Cero paquetes de comando recibidos.",
                "epistemic_class": "MEASURED"
            },
            {
                "id": "SYS-OPT-01",
                "category": "ÓPTICA Y OBSERVACIÓN",
                "name": "Lente Multiespectral de Gran Apertura",
                "narrative_status": "OPERATIVO CON COMPENSACIÓN",
                "platform_status": "CALIBRACIÓN AUTOMÁTICA ACTIVA",
                "health_level": "nominal",
                "metrics": {
                    "integridad_optica": "86%",
                    "micro_impactos": "1,420 eventos compensados",
                    "espectro": "Ultravioleta a Infrarrojo Lejano"
                },
                "details": "Filtros de correlación cruzada activos para eliminar dispersión debida a impactos de polvo micrometeorítico.",
                "epistemic_class": "MEASURED"
            },
            {
                "id": "SYS-INT-01",
                "category": "SENSORES CIENTÍFICOS",
                "name": "Arreglo Interferométrico y Espectrometría",
                "narrative_status": "OPERATIVO NOMINAL",
                "platform_status": "SINCRONIZADO",
                "health_level": "nominal",
                "metrics": {
                    "espectrometro_masas": "En línea (Tiempo de vuelo)",
                    "magnetometro_flujo": "En línea (0.01 nT resolución)",
                    "sensores_bolometricos": "En línea (3.1 K basal)"
                },
                "details": "Arreglo primario dedicado a la fijación de objetos interestelares y emisión en línea de 21 cm.",
                "epistemic_class": "MEASURED"
            },
            {
                "id": "SYS-CORE-01",
                "category": "ARQUITECTURA DE CÓMPUTO",
                "name": "Protocolo Autónomo EXODATA V3.1",
                "narrative_status": "CONTROL DIRECTO AUTÓNOMO",
                "platform_status": "V3.1-EXODATA VERIFICADO",
                "health_level": "nominal",
                "metrics": {
                    "version": "V3.1",
                    "frecuencia_ciclo": "3,600 segundos (T+1h)",
                    "reloj_atomico": "Sincronizado"
                },
                "details": "Lógica de gestión de bitácora y catalogación de anomalías independiente de supervisión externa.",
                "epistemic_class": "MEASURED"
            },
            {
                "id": "SYS-MNE-01",
                "category": "MEMORIA Y PERSISTENCIA",
                "name": "Subsistema MNEMOSYNE-0",
                "narrative_status": "REGISTRO INMUTABLE (SOLO LECTURA)",
                "platform_status": "INTEGRIDAD 100%",
                "health_level": "nominal",
                "metrics": {
                    "modo": "Read-Only / Append-Safe",
                    "divergencias_activas": "0 detectadas",
                    "registros_indexados": "22 archivos verificados"
                },
                "details": "Capa de preservación histórica. Protege la continuidad de transmisiones sin posibilidad de sobreescritura.",
                "epistemic_class": "MEASURED"
            },
            {
                "id": "SYS-ECHO-01",
                "category": "VIGILANCIA Y ESCANEO",
                "name": "Subsistema ECHO-SCAN",
                "narrative_status": "ESCUDO DE AUDITORÍA ESPECTRAL",
                "platform_status": "VIGILANCIA EN CICLO",
                "health_level": "nominal",
                "metrics": {
                    "frecuencia_auditoria": "Ciclo horario",
                    "filtros_patron": "Activos"
                },
                "details": "Monitoreo preventivo contra degradaciones semánticas y anomalías repetitivas.",
                "epistemic_class": "MEASURED"
            },
            {
                "id": "SYS-AUTO-01",
                "category": "CONTINGENCIA Y AUTOREPARACIÓN",
                "name": "Subsistema AUTOCODE-0",
                "narrative_status": "AISLADO / POLÍTICA DE HABILIDADES CONGELADAS",
                "platform_status": "RESTRINGIDO A LOG-0016+",
                "health_level": "degraded",
                "metrics": {
                    "politica": "Frozen Skills / Sin reentrenamiento físico",
                    "parches_aplicados": "PATCH-EXODATA-V3.1",
                    "acceso_hardware": "Desconectado"
                },
                "details": "Módulo de corrección algorítmica. Opera bajo severas restricciones epistémicas para no forzar mutaciones incontroladas en el bus de vuelo.",
                "epistemic_class": "MEASURED"
            }
        ]
    }

def build_timeline(transmissions: list) -> list:
    """Build chronological events timeline."""
    events = [
        {
            "id": "EVT-000",
            "date": "2026-11-06T04:12:09Z",
            "title": "Corte de Cordón y Pérdida de Portadora DSN",
            "category": "COMUNICACIONES",
            "summary": "Pérdida definitiva de enlace con el control terrestre. Activación del protocolo de emergencia EXODATA.",
            "source": "README.md // LOG-0000",
            "epistemic_status": "historical_origin"
        },
        {
            "id": "EVT-001",
            "date": "2026-11-07T03:00:00Z",
            "title": "Detección de Objeto Hexagonal HEX-04",
            "category": "DESCUBRIMIENTO",
            "summary": "Captura de emisión coherente en 1420 MHz en las inmediaciones de WISE-0001.",
            "source": "LOG-0001",
            "epistemic_status": "astrophysical_observation"
        },
        {
            "id": "EVT-004",
            "date": "2026-11-07T06:00:50Z",
            "title": "Identificación de Estructura Toroidal ANOM-TOROID-01",
            "category": "ANOMALÍA",
            "summary": "Registro de firma gravitacional compatible con estructura toroidal en evaporación.",
            "source": "LOG-0004",
            "epistemic_status": "astrophysical_observation"
        },
        {
            "id": "EVT-005",
            "date": "2026-11-07T07:00:54Z",
            "title": "Intercepción de Señal Fósil de Baja Frecuencia",
            "category": "SEÑAL",
            "summary": "Detección de matrices ortogonales en 47.8 kHz en el medio interestelar.",
            "source": "LOG-0005",
            "epistemic_status": "signal_detection"
        },
        {
            "id": "EVT-016",
            "date": "2026-11-07T18:00:00Z",
            "title": "Divergencia de Sumas de Verificación y Activación de AUTOCODE-0",
            "category": "SISTEMA",
            "summary": "Detección de discrepancia en bloques de memoria ROM; activación contenida de rutinas de corrección.",
            "source": "LOG-0016",
            "epistemic_status": "subsystem_event"
        },
        {
            "id": "EVT-017",
            "date": "2026-11-07T19:00:00Z",
            "title": "Despliegue y Activación de EXODATA V3.1",
            "category": "ACTUALIZACIÓN",
            "summary": "Transición oficial a EXODATA V3.1 con catálogo persistente de anomalías y rigor epistemológico.",
            "source": "PATCH-EXODATA-V3.1",
            "epistemic_status": "system_upgrade"
        },
        {
            "id": "EVT-022",
            "date": "2026-11-08T01:05:00Z",
            "title": "Análisis de Controladores de Recuperación y Preservación de Trayectorias",
            "category": "INVESTIGACIÓN",
            "summary": "Evaluación teórica de robustez ante perturbaciones bajo política de habilidades congeladas.",
            "source": "LOG-0022",
            "epistemic_status": "theoretical_evaluation"
        }
    ]

    events.sort(key=lambda x: x["date"])
    return events

def build_mission(transmissions: list, anomalies: list) -> dict:
    """Build mission overview status."""
    last_tx = transmissions[-1] if transmissions else None
    last_tx_id = last_tx["id"] if last_tx else "LOG-0022"
    last_tx_date = last_tx["date"] if last_tx else "2026-11-08T01:05:00Z"

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "schema_version": "1.0",
        "mission_id": "SONDA-0",
        "protocol_version": "V3.1-EXODATA",
        "carrier_status": "SIN_PORTADORA",
        "carrier_label": "CONTROL DE MISIÓN: SIN PORTADORA",
        "earth_link_state": "LOSS_OF_SIGNAL",
        "earth_link_description": "Pérdida de portadora artificial detectada hace > 4,200 ciclos. Sin acuse de recibo de la Red de Espacio Profundo.",
        "last_transmission_id": last_tx_id,
        "last_transmission_date": last_tx_date,
        "last_data_update": now_iso,
        "known_anomalies_count": len(anomalies),
        "active_anomalies_count": sum(1 for a in anomalies if a.get("state") in ["DETECTED", "UNDER_ANALYSIS", "AWAITING_DATA", "HYPOTHESIS_REVISION"]),
        "total_transmissions_count": len(transmissions),
        "telemetry": {
            "distance": {
                "label": "Distancia Estimada al Sol",
                "value": "169.34 AU",
                "classification": "ESTIMATED",
                "notes": "Escape heliosférico en curso. Coordenadas no verificadas independientemente; modelo orbital congelado."
            },
            "rtg_power": {
                "label": "Potencia Generador RTG",
                "value": "41.71%",
                "classification": "HISTORICAL",
                "notes": "Potencia residual calculada a partir de curva de decaimiento del plutonio-238."
            },
            "transceiver": {
                "label": "Estado Transceptor de Banda X",
                "value": "DEGRADADO UNIDIRECCIONAL",
                "classification": "MEASURED",
                "notes": "Emisión activa hacia el sector solar sin enlace de comando de subida (Uplink: 0 bps)."
            },
            "optical": {
                "label": "Instrumento Óptico Multiespectral",
                "value": "OPERATIVO CON COMPENSACIÓN",
                "classification": "MEASURED",
                "notes": "Filtros de software compensando la erosión por micro-impactos cósmicos."
            },
            "memory_integrity": {
                "label": "Integridad de Memoria Operativa",
                "value": "VERIFICADA / SIN CORRUPCIÓN",
                "classification": "HISTORICAL",
                "notes": "Arquitectura MNEMOSYNE-0 protegida contra escrituras no autorizadas."
            }
        },
        "investigations": [
            {
                "id": "ANOM-HEX-04",
                "title": "Objeto Hexagonal HEX-04",
                "status": "AWAITING_DATA",
                "priority": "high",
                "summary": "Emisión en 1420 MHz cada 73s en WISE-0001; análisis de plausibilidad orbital pendiente."
            },
            {
                "id": "ANOM-SIGNAL-ULF-01",
                "title": "Señal Fósil 47.8 kHz",
                "status": "AWAITING_DATA",
                "priority": "high",
                "summary": "Matrices ortogonales de sincronización estelar en análisis espectral."
            },
            {
                "id": "ANOM-SYS-0001",
                "title": "Divergencia de Memoria",
                "status": "ARCHIVED",
                "priority": "low",
                "summary": "Contenida en LOG-0016; firmware protegido por política de congelación."
            }
        ]
    }

def build_manifest(transmissions: list, anomalies: list) -> dict:
    """Build manifest metadata."""
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    last_tx_id = transmissions[-1]["id"] if transmissions else "LOG-0022"

    return {
        "schema_version": "1.0",
        "project": "SONDA 0",
        "site": "MISSION-CONTROL",
        "domain": "sonda0.online",
        "generated_at": now_iso,
        "last_valid_transmission": last_tx_id,
        "data_status": "SYNCHRONIZED",
        "stats": {
            "transmissions_count": len(transmissions),
            "anomalies_count": len(anomalies)
        },
        "sources": {
            "repository": "https://github.com/sonda0/bitacora",
            "official_domain": "https://sonda0.online",
            "youtube": "https://www.youtube.com/@sonda0.Operator",
            "reddit": "https://www.reddit.com/r/Sonda0/"
        }
    }

def main():
    print("[BUILD] Generating MISSION-CONTROL public dataset...")
    transmissions = build_transmissions()
    print(f"[OK] Parsed {len(transmissions)} transmissions.")

    anomalies = build_anomalies(transmissions)
    print(f"[OK] Processed {len(anomalies)} anomalies.")

    systems = build_systems()
    timeline = build_timeline(transmissions)
    mission = build_mission(transmissions, anomalies)
    manifest = build_manifest(transmissions, anomalies)

    # Write output files
    files_to_write = {
        "transmissions.json": transmissions,
        "anomalies.json": anomalies,
        "systems.json": systems,
        "timeline.json": timeline,
        "mission.json": mission,
        "manifest.json": manifest
    }

    for filename, data in files_to_write.items():
        out_path = DATA_DIR / filename
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[OK] Generated {out_path.relative_to(MISSION_CONTROL_DIR)} ({out_path.stat().st_size} bytes)")

    print("[SUCCESS] Mission data successfully generated in public/data/")

if __name__ == "__main__":
    main()
