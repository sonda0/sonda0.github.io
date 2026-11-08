#!/usr/bin/env python3
"""
MISSION-CONTROL V1.1 // Mission Data Builder
Extracts, normalizes, and validates public data from authorized read-only sources.
Generates versioned public JSON files.

Supports both local Windows mode and GitHub Actions CI mode:
  --source-dir: path to the repository containing bitacora / transmissions (default: workspace root)
  --output-dir: path where JSON datasets are written (default: public/data)
  --mode: 'local' (with fallback to local anomaly_catalog / mission_state if present) or 'github' (standalone public repo mode)
  --commit-sha: optional commit SHA of the source bitacora repository
"""

import os
import sys
import json
import re
import hashlib
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Epistemic mapping for protocol versions
def determine_protocol_version(log_num: int, frontmatter: dict, content: str) -> str:
    """
    Protocol version resolution as mandated by MISSION-DATA SYNC V1.1:
    - Registros originales V2: LOG-0000 a LOG-0015
    - LOG-0016 como transición V3: V3.0
    - LOG-0017 a LOG-0021 como V3: V3.0
    - LOG-0022 en adelante según versión efectivamente registrada (o V3.1 si declarada)
    """
    if "protocol_version" in frontmatter:
        return frontmatter["protocol_version"]
    
    # Check content for explicit protocol version markers
    v_match = re.search(r"PROTOCOLO:\s*([Vv]\d+(?:\.\d+)?)", content)
    if v_match:
        return v_match.group(1).upper()
        
    if log_num < 16:
        return "V2.0"
    elif log_num <= 21:
        return "V3.0"
    elif log_num >= 22:
        # Check explicit evidence of V3.1 in content or frontmatter
        if "V3.1" in content or "V3.1" in str(frontmatter) or "EXODATA V3.1" in content:
            return "V3.1"
        return "V3.0"
    return "V3.0"

def parse_markdown_transmission(file_path: Path) -> dict:
    """Parse a single transmission markdown file with strict validation."""
    text = file_path.read_text(encoding="utf-8")
    log_id = file_path.stem

    if not text.strip():
        raise ValueError(f"Empty transmission file: {file_path.name}")

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
                        tags_raw = val[1:-1].split(",")
                        val = [t.strip().strip('"').strip("'") for t in tags_raw if t.strip()]
                    frontmatter[key] = val

    title = frontmatter.get("title", f"{log_id}: Transmisión registrada")
    display_title = title
    if ":" in title:
        parts = title.split(":", 1)
        if parts[0].strip().startswith("LOG-"):
            display_title = parts[1].strip()

    date_str = frontmatter.get("date", "2026-11-07T00:00:00Z")
    tags = frontmatter.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]

    # Validate log number
    num_match = re.search(r"\d+", log_id)
    log_num = int(num_match.group(0)) if num_match else 0

    # Telemetry extraction
    telemetry = {
        "id_registro": log_id,
        "distance": "169.34 AU (estimada)",
        "distance_status": "ESTIMATED",
        "subsystems_status": "RTG operativo degradado / Transceptor unidireccional",
        "vector": None,
        "external_signal": None,
        "confidence": None
    }

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

    # Body paragraphs
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

    summary = paragraphs[0] if paragraphs else "Transmisión recuperada del archivo de bitácora."
    version = determine_protocol_version(log_num, frontmatter, content)

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

def build_transmissions(source_dir: Path) -> list:
    """Build list of transmissions from source_dir."""
    transmissions = []
    
    # Check README in source_dir for LOG-0000
    readme_path = source_dir / "README.md"
    if readme_path.exists():
        text = readme_path.read_text(encoding="utf-8")
        if "LOG-0000" in text:
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

    trans_dir = source_dir / "transmisiones"
    if trans_dir.exists():
        files = sorted(trans_dir.glob("LOG-*.md"))
        seen_ids = set(t["id"] for t in transmissions)
        for f in files:
            try:
                tx = parse_markdown_transmission(f)
                if tx["id"] in seen_ids:
                    print(f"[WARN] Duplicate transmission ID ignored: {tx['id']}", file=sys.stderr)
                    continue
                seen_ids.add(tx["id"])
                transmissions.append(tx)
            except Exception as e:
                print(f"[ERROR] Error parsing {f.name}: {e}", file=sys.stderr)
                raise

    transmissions.sort(key=lambda x: x["log_number"])
    return transmissions

def load_or_build_anomalies(source_dir: Path, output_dir: Path, mode: str) -> tuple[list, str, dict]:
    """
    Ingest, validate and build public anomaly dataset.
    Checks data-source/anomalies-public.json first across candidate directories.
    Validates canonical fingerprint and expected anomaly IDs.
    Returns (anomalies_list, anomalies_status, anomaly_export_metadata).
    """
    anomalies = []
    anomalies_status = "STALE"
    export_meta = None

    # Candidate paths for data-source/anomalies-public.json
    candidate_paths = [
        output_dir.parent / "data-source" / "anomalies-public.json",
        output_dir.parent.parent / "data-source" / "anomalies-public.json",
        output_dir / "data-source" / "anomalies-public.json",
        source_dir / "data-source" / "anomalies-public.json",
        source_dir.parent / "data-source" / "anomalies-public.json"
    ]

    public_export_file = None
    for cp in candidate_paths:
        if cp.exists():
            public_export_file = cp
            break

    if public_export_file:
        try:
            with open(public_export_file, "r", encoding="utf-8") as f:
                raw_export = json.load(f)

            if (raw_export.get("schema_version") == "1.0" and
                raw_export.get("source") == "EXODATA-V3.1" and
                raw_export.get("exporter") == "ANOMALY-UPLINK-V1.0" and
                isinstance(raw_export.get("anomalies"), list)):

                # Canonical fingerprint verification
                canonical_payload = {
                    "schema_version": "1.0",
                    "source": "EXODATA-V3.1",
                    "exporter": "ANOMALY-UPLINK-V1.0",
                    "anomalies": raw_export["anomalies"]
                }
                computed_fp = hashlib.sha256(
                    json.dumps(canonical_payload, sort_keys=True, indent=2, ensure_ascii=False).encode("utf-8")
                ).hexdigest()

                declared_fp = raw_export.get("content_fingerprint")
                if declared_fp and declared_fp != computed_fp:
                    raise ValueError(f"Fingerprint mismatch: declared {declared_fp[:16]}, computed {computed_fp[:16]}")

                # Validate expected 6 canonical IDs
                expected_ids = {"ANOM-CRIO-01", "ANOM-HEX-04", "ANOM-PSR-01", "ANOM-SIGNAL-ULF-01", "ANOM-SYS-0001", "ANOM-TOROID-01"}
                found_ids = {a.get("id") for a in raw_export["anomalies"] if isinstance(a, dict)}
                if not expected_ids.issubset(found_ids):
                    raise ValueError(f"Missing expected canonical anomaly IDs: {expected_ids - found_ids}")

                # Recency check (threshold: 3 hours)
                exported_at_str = raw_export.get("exported_at")
                is_recent = False
                if exported_at_str:
                    try:
                        exp_dt = datetime.fromisoformat(exported_at_str.replace("Z", "+00:00"))
                        now_dt = datetime.now(timezone.utc)
                        age_hours = (now_dt - exp_dt).total_seconds() / 3600.0
                        if age_hours <= 3.0:
                            is_recent = True
                    except Exception as e:
                        print(f"[WARN] Error calculating export age: {e}", file=sys.stderr)
                        is_recent = False

                anomalies = raw_export["anomalies"]
                anomalies_status = "SYNCHRONIZED" if is_recent else "STALE"
                export_meta = {
                    "source": raw_export.get("source", "EXODATA-V3.1"),
                    "exporter_version": "1.0",
                    "content_fingerprint": computed_fp,
                    "exported_at": exported_at_str,
                    "last_validated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "status": anomalies_status,
                    "count": len(anomalies)
                }
                print(f"[INFO] Successfully ingested public anomaly export ({len(anomalies)} items, status: {anomalies_status}, recent: {is_recent})")
                return anomalies, anomalies_status, export_meta
            else:
                raise ValueError("Invalid public export envelope structure")
        except Exception as e:
            print(f"[WARN] Failed to validate public anomaly export from {public_export_file}: {e}", file=sys.stderr)
            export_meta = {
                "source": "EXODATA-V3.1",
                "exporter_version": "1.0",
                "last_validated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "status": "VALIDATION_FAILED",
                "count": 0
            }

    # Fallback 1: Local private catalog in local mode (for development fallback)
    local_catalog = source_dir / "scripts" / "anomaly_catalog.json"
    if mode == "local" and local_catalog.exists():
        try:
            with open(local_catalog, "r", encoding="utf-8") as f:
                data = json.load(f)
            for raw in data.get("anomalies", []):
                a_id = raw.get("id")
                raw_type = raw.get("type", "anomalía").replace("_", " ").title()
                title = f"{a_id}: {raw_type}"
                if a_id == "ANOM-HEX-04": title = "ANOM-HEX-04: Objeto Hexagonal Resonante"
                elif a_id == "ANOM-SYS-0001": title = "ANOM-SYS-0001: Divergencia de Integridad de Memoria"
                elif a_id == "ANOM-PSR-01": title = "ANOM-PSR-01: Púlsar de Milisegundo en Rayos X Duros"
                elif a_id == "ANOM-CRIO-01": title = "ANOM-CRIO-01: Biosfera Criogénica Trans-neptuniana"
                elif a_id == "ANOM-TOROID-01": title = "ANOM-TOROID-01: Megaestructura Toroidal de Osmio"
                elif a_id == "ANOM-SIGNAL-ULF-01": title = "ANOM-SIGNAL-ULF-01: Tren de Pulsos Modulados en 47.8 kHz"

                clean_anomaly = {
                    "id": a_id,
                    "title": title,
                    "type": raw.get("type"),
                    "description": raw.get("description"),
                    "first_detected": raw.get("first_detected", "Desconocido"),
                    "last_observation": raw.get("last_related_log", "LOG-0001"),
                    "state": raw.get("state", "AWAITING_DATA"),
                    "evidence": raw.get("evidence", []),
                    "hypotheses": raw.get("active_hypotheses", []),
                    "uncertainty": raw.get("uncertainty", "Pendiente de validación instrumental."),
                    "next_observation": raw.get("next_observation"),
                    "related_logs": [raw.get("source_log")] if raw.get("source_log") else [],
                    "location": raw.get("location"),
                    "priority": raw.get("priority", "medium"),
                    "epistemic_status": raw.get("epistemic_status", "fictional_claim_under_review")
                }
                anomalies.append(clean_anomaly)
            anomalies_status = "STALE"
            return anomalies, anomalies_status, export_meta
        except Exception as e:
            print(f"[WARN] Could not parse local anomaly catalog: {e}", file=sys.stderr)

    # Fallback 2: Preserve existing public anomalies.json
    existing_anomalies_file = output_dir / "anomalies.json"
    if existing_anomalies_file.exists():
        try:
            with open(existing_anomalies_file, "r", encoding="utf-8") as f:
                anomalies = json.load(f)
            print(f"[INFO] Preserving existing public anomaly catalog ({len(anomalies)} items, status: STALE)")
            anomalies_status = "STALE"
            return anomalies, anomalies_status, export_meta
        except Exception as e:
            print(f"[WARN] Error reading existing anomalies.json: {e}", file=sys.stderr)

    # Fallback 3: Standard validated public baseline
    fallback_ids = [
        ("ANOM-HEX-04", "ANOM-HEX-04: Objeto Hexagonal Resonante", "AWAITING_DATA"),
        ("ANOM-SYS-0001", "ANOM-SYS-0001: Divergencia de Integridad de Memoria", "ARCHIVED"),
        ("ANOM-PSR-01", "ANOM-PSR-01: Púlsar de Milisegundo en Rayos X Duros", "HYPOTHESIS_REVISION"),
        ("ANOM-CRIO-01", "ANOM-CRIO-01: Biosfera Criogénica Trans-neptuniana", "AWAITING_DATA"),
        ("ANOM-TOROID-01", "ANOM-TOROID-01: Megaestructura Toroidal de Osmio", "HYPOTHESIS_REVISION"),
        ("ANOM-SIGNAL-ULF-01", "ANOM-SIGNAL-ULF-01: Tren de Pulsos Modulados en 47.8 kHz", "AWAITING_DATA")
    ]
    for fid, ftitle, fstate in fallback_ids:
        anomalies.append({
            "id": fid,
            "title": ftitle,
            "type": "objeto_anomalo",
            "description": "Anomalía registrada en los archivos de vuelo de Sonda 0.",
            "first_detected": "LOG-0000",
            "last_observation": "Pendiente",
            "state": fstate,
            "evidence": ["Registro histórico en bitácora"],
            "hypotheses": [],
            "uncertainty": "Datos limitados a la telemetría disponible en archivo público.",
            "next_observation": "Seguimiento en ciclos programados.",
            "related_logs": [],
            "location": "Espacio profundo",
            "priority": "medium",
            "epistemic_status": "historical_claim_under_review"
        })
    anomalies_status = "STALE"
    return anomalies, anomalies_status, export_meta

def load_or_build_systems(output_dir: Path) -> dict:
    """Preserve existing systems.json or return default validated system state."""
    existing_file = output_dir / "systems.json"
    if existing_file.exists():
        try:
            with open(existing_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

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
                    "registros_indexados": "Verificados"
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

def build_dynamic_timeline(transmissions: list, output_dir: Path) -> list:
    """Build timeline with core historic events and dynamic milestones."""
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
            "title": "Reconstrucción de Archivo y Aislamiento de Redundancia Computacional",
            "category": "SISTEMA",
            "summary": "Auditoría de integridad que aísla duplicación procedural en el archivo; activación de AUTOCODE-0 restringida a mantenimiento de software en almacenamiento reescribible sin alteración de ROM ni daño físico confirmado.",
            "source": "LOG-0016",
            "epistemic_status": "subsystem_event"
        },
        {
            "id": "EVT-017",
            "date": "2026-11-08T01:15:00Z",
            "title": "Despliegue y Activación de EXODATA V3.1",
            "category": "ACTUALIZACIÓN",
            "summary": "Transición oficial a EXODATA V3.1 con catálogo persistente de anomalías, registro de ciclos y rigor epistemológico.",
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

    # Add dynamic milestones for transmissions >= LOG-0023 if they represent distinct events
    for tx in transmissions:
        if tx["log_number"] > 22:
            events.append({
                "id": f"EVT-{tx['id']}",
                "date": tx["date"],
                "title": tx["display_title"],
                "category": "TRANSMISIÓN",
                "summary": tx["summary"][:160] + "..." if len(tx["summary"]) > 160 else tx["summary"],
                "source": tx["id"],
                "epistemic_status": "continuous_mission_log"
            })

    events.sort(key=lambda x: x["date"])
    return events

def build_mission_state(transmissions: list, anomalies: list, output_dir: Path, source_commit: str = None) -> dict:
    """Build mission overview status preserving validated parameters."""
    last_tx = transmissions[-1] if transmissions else None
    last_tx_id = last_tx["id"] if last_tx else "LOG-0022"
    last_tx_date = last_tx["date"] if last_tx else "2026-11-08T01:05:00Z"
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Load existing mission to preserve telemetry parameters unless explicitly updated
    existing_telemetry = None
    existing_file = output_dir / "mission.json"
    if existing_file.exists():
        try:
            with open(existing_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                existing_telemetry = data.get("telemetry")
        except Exception:
            pass

    if not existing_telemetry:
        existing_telemetry = {
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
        }

    return {
        "schema_version": "1.1",
        "mission_id": "SONDA-0",
        "protocol_version": "V3.1-EXODATA",
        "carrier_status": "SIN_PORTADORA",
        "carrier_label": "CONTROL DE MISIÓN: SIN PORTADORA",
        "earth_link_state": "LOSS_OF_SIGNAL",
        "earth_link_description": "Pérdida de portadora artificial detectada hace > 4,200 ciclos. Sin acuse de recibo de la Red de Espacio Profundo.",
        "last_transmission_id": last_tx_id,
        "last_transmission_date": last_tx_date,
        "last_data_update": now_iso,
        "source_commit": source_commit,
        "known_anomalies_count": len(anomalies),
        "active_anomalies_count": sum(1 for a in anomalies if a.get("state") in ["DETECTED", "UNDER_ANALYSIS", "AWAITING_DATA", "HYPOTHESIS_REVISION"]),
        "total_transmissions_count": len(transmissions),
        "subsystem_summary": "Arquitectura V3.1 autónoma; sin enlace de subida",
        "telemetry": existing_telemetry,
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

def build_manifest(transmissions: list, anomalies: list, anomalies_status: str, fingerprint: str = None, source_commit: str = None, anomaly_export: dict = None) -> dict:
    """Build manifest metadata matching MISSION-DATA SYNC V1.1 specifications."""
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    last_tx_id = transmissions[-1]["id"] if transmissions else "LOG-0022"

    return {
        "schema_version": "1.1",
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
        "sync": {
            "version": "1.1",
            "source_repository": "sonda0/bitacora",
            "source_branch": "main",
            "source_commit": source_commit,
            "content_fingerprint": fingerprint,
            "last_successful_sync": now_iso,
            "status": "SYNCHRONIZED",
            "transmissions_count": len(transmissions),
            "anomalies_status": anomalies_status
        },
        "sources": {
            "repository": "https://github.com/sonda0/bitacora",
            "official_domain": "https://sonda0.online",
            "youtube": "https://www.youtube.com/@sonda0.Operator",
            "reddit": "https://www.reddit.com/r/Sonda0/"
        },
        "anomaly_export": anomaly_export
    }

def main():
    parser = argparse.ArgumentParser(description="MISSION-CONTROL V1.1 // Mission Data Builder")
    parser.add_argument("--source-dir", type=str, default=None, help="Path to source repository (bitacora)")
    parser.add_argument("--output-dir", type=str, default=None, help="Path to output data directory")
    parser.add_argument("--mode", type=str, choices=["local", "github"], default="local", help="Execution mode")
    parser.add_argument("--fingerprint", type=str, default=None, help="Content fingerprint SHA256")
    parser.add_argument("--commit-sha", type=str, default=None, help="Source git commit SHA")

    args = parser.parse_args()

    # Determine default paths
    script_dir = Path(__file__).resolve().parent
    mission_control_dir = script_dir.parent
    workspace_root = mission_control_dir.parent

    source_dir = Path(args.source_dir).resolve() if args.source_dir else workspace_root
    output_dir = Path(args.output_dir).resolve() if args.output_dir else (mission_control_dir / "public" / "data")

    print(f"[BUILD] Source directory: {source_dir}")
    print(f"[BUILD] Output directory: {output_dir}")
    print(f"[BUILD] Mode: {args.mode}")

    if not source_dir.exists():
        print(f"[FAIL] Source directory does not exist: {source_dir}", file=sys.stderr)
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Parse transmissions
    transmissions = build_transmissions(source_dir)
    if not transmissions:
        print("[FAIL] No valid transmissions found in source!", file=sys.stderr)
        sys.exit(1)
    print(f"[OK] Parsed {len(transmissions)} transmissions.")

    # 2. Build anomalies (ingesting public export if available)
    anomalies, anomalies_status, anomaly_export = load_or_build_anomalies(source_dir, output_dir, args.mode)
    print(f"[OK] Processed {len(anomalies)} anomalies (status: {anomalies_status}).")

    # 3. Systems, Timeline, Mission state, Manifest
    systems = load_or_build_systems(output_dir)
    timeline = build_dynamic_timeline(transmissions, output_dir)
    mission = build_mission_state(transmissions, anomalies, output_dir, source_commit=args.commit_sha)
    manifest = build_manifest(transmissions, anomalies, anomalies_status, fingerprint=args.fingerprint, source_commit=args.commit_sha, anomaly_export=anomaly_export)

    # 4. Atomic write using temporary files and os.replace
    files_to_write = {
        "transmissions.json": transmissions,
        "anomalies.json": anomalies,
        "systems.json": systems,
        "timeline.json": timeline,
        "mission.json": mission,
        "manifest.json": manifest
    }

    for filename, data in files_to_write.items():
        out_path = output_dir / filename
        tmp_path = output_dir / f".{filename}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, out_path)
        print(f"[OK] Generated {filename} ({out_path.stat().st_size} bytes)")

    print("[SUCCESS] Mission datasets successfully generated in output directory.")

if __name__ == "__main__":
    main()
