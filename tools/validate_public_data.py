#!/usr/bin/env python3
"""
MISSION-CONTROL V1.0 // Public Data Validator
Validates integrity, schemas, ISO dates, epistemic tags, and security invariants
for all generated public datasets.
"""

import sys
import json
import re
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
MISSION_CONTROL_DIR = SCRIPT_DIR.parent
DATA_DIR = MISSION_CONTROL_DIR / "public" / "data"

FORBIDDEN_PATTERNS = [
    r"ghp_[A-Za-z0-9_]{30,}",
    r"github_pat_[A-Za-z0-9_]{30,}",
    r"Bearer\s+[A-Za-z0-9_\-\.]{20,}",
    r"C:\\Users\\",
    r"/Users/",
    r"/home/",
    r"password",
    r"client_secret",
    r"\.env"
]

def check_security(text: str, filename: str) -> list:
    """Scan text for leaks, tokens or private paths."""
    errors = []
    for pat in FORBIDDEN_PATTERNS:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            errors.append(f"Security violation in {filename}: matches forbidden pattern '{pat}'")
    return errors

def validate_iso_date(date_str: str) -> bool:
    """Check if string is a valid ISO 8601 date."""
    if not isinstance(date_str, str):
        return False
    try:
        # Expecting YYYY-MM-DDTHH:MM:SSZ or similar
        datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return True
    except Exception:
        return False

def validate_manifest(data: dict) -> list:
    errors = []
    if data.get("schema_version") not in ["1.0", "1.1"]:
        errors.append("manifest: schema_version must be '1.0' or '1.1'")
    if data.get("project") != "SONDA 0":
        errors.append("manifest: project must be 'SONDA 0'")
    if data.get("domain") != "sonda0.online":
        errors.append("manifest: domain must be 'sonda0.online'")
    if not validate_iso_date(data.get("generated_at", "")):
        errors.append("manifest: generated_at is not a valid ISO date")
    sources = data.get("sources", {})
    if not sources.get("repository", "").startswith("https://github.com/"):
        errors.append("manifest: sources.repository must be a valid GitHub URL")
    return errors

def validate_mission(data: dict) -> list:
    errors = []
    if data.get("mission_id") != "SONDA-0":
        errors.append("mission: mission_id must be 'SONDA-0'")
    if data.get("protocol_version") != "V3.1-EXODATA":
        errors.append("mission: protocol_version must be 'V3.1-EXODATA'")
    if data.get("carrier_status") != "SIN_PORTADORA":
        errors.append("mission: carrier_status must be 'SIN_PORTADORA'")

    telemetry = data.get("telemetry", {})
    allowed_classes = {"MEASURED", "ESTIMATED", "HISTORICAL", "UNKNOWN"}
    for key, item in telemetry.items():
        if not isinstance(item, dict):
            errors.append(f"mission: telemetry.{key} must be an object")
            continue
        c = item.get("classification")
        if c not in allowed_classes:
            errors.append(f"mission: telemetry.{key}.classification '{c}' not in {allowed_classes}")
        if not item.get("value"):
            errors.append(f"mission: telemetry.{key}.value cannot be empty")
    return errors

def validate_transmissions(data: list, test_mode: bool = False) -> list:
    errors = []
    if not isinstance(data, list):
        errors.append(f"transmissions: expected list, got {type(data)}")
        return errors
    
    if not test_mode and len(data) < 20:
        errors.append(f"transmissions: expected list of >=20 items, got {len(data) if isinstance(data, list) else type(data)}")
        return errors

    seen_ids = set()
    for idx, tx in enumerate(data):
        tx_id = tx.get("id")
        if not tx_id:
            errors.append(f"transmissions[{idx}]: missing id")
            continue
        if tx_id in seen_ids:
            errors.append(f"transmissions: duplicate id '{tx_id}'")
        seen_ids.add(tx_id)

        if not tx.get("title"):
            errors.append(f"transmissions[{tx_id}]: missing title")
        if not validate_iso_date(tx.get("date", "")):
            errors.append(f"transmissions[{tx_id}]: invalid ISO date '{tx.get('date')}'")
        if not isinstance(tx.get("tags"), list):
            errors.append(f"transmissions[{tx_id}]: tags must be a list")
        if not tx.get("github_url", "").startswith("https://github.com/"):
            errors.append(f"transmissions[{tx_id}]: invalid github_url")

        v = tx.get("version")
        if v not in ["V2.0", "V3.0", "V3.1"]:
            errors.append(f"transmissions[{tx_id}]: unknown protocol version '{v}'")

    return errors

def validate_anomalies(data: list, test_mode: bool = False) -> list:
    errors = []
    if not isinstance(data, list) or (not test_mode and len(data) < 6):
        errors.append(f"anomalies: expected list with >=6 items, got {len(data) if isinstance(data, list) else type(data)}")
        return errors

    allowed_states = {
        "DETECTED", "UNDER_ANALYSIS", "AWAITING_DATA",
        "HYPOTHESIS_REVISION", "INCONCLUSIVE", "RESOLVED", "ARCHIVED"
    }
    seen_ids = set()
    for idx, a in enumerate(data):
        a_id = a.get("id")
        if not a_id:
            errors.append(f"anomalies[{idx}]: missing id")
            continue
        seen_ids.add(a_id)

        st = a.get("state")
        if st not in allowed_states:
            errors.append(f"anomalies[{a_id}]: invalid state '{st}', must be one of {allowed_states}")
        if not a.get("description"):
            errors.append(f"anomalies[{a_id}]: description cannot be empty")
        if not a.get("uncertainty"):
            errors.append(f"anomalies[{a_id}]: missing explicit uncertainty statement")
        if not isinstance(a.get("evidence"), list):
            errors.append(f"anomalies[{a_id}]: evidence must be a list")

    expected_ids = {"ANOM-HEX-04", "ANOM-SYS-0001", "ANOM-PSR-01", "ANOM-CRIO-01", "ANOM-TOROID-01", "ANOM-SIGNAL-ULF-01"}
    missing = expected_ids - seen_ids
    if missing:
        errors.append(f"anomalies: missing required anomalies {missing}")

    return errors

def validate_systems(data: dict, test_mode: bool = False) -> list:
    errors = []
    subsystems = data.get("subsystems")
    if not isinstance(subsystems, list) or (not test_mode and len(subsystems) < 5):
        errors.append("systems: 'subsystems' must be a list with at least 5 systems")
        return errors

    for s in subsystems:
        s_id = s.get("id")
        if not s.get("narrative_status"):
            errors.append(f"systems[{s_id}]: missing narrative_status")
        if not s.get("platform_status"):
            errors.append(f"systems[{s_id}]: missing platform_status")
        if not s.get("category"):
            errors.append(f"systems[{s_id}]: missing category")
        if not s.get("details"):
            errors.append(f"systems[{s_id}]: missing details")

    return errors

def validate_timeline(data: list, test_mode: bool = False) -> list:
    errors = []
    if not isinstance(data, list) or (not test_mode and len(data) < 3):
        errors.append("timeline: expected at least 3 events")
        return errors

    for idx, evt in enumerate(data):
        if not evt.get("id"):
            errors.append(f"timeline[{idx}]: missing id")
        if not validate_iso_date(evt.get("date", "")):
            errors.append(f"timeline[{idx}]: invalid date '{evt.get('date')}'")
        if not evt.get("title"):
            errors.append(f"timeline[{idx}]: missing title")
        if not evt.get("source"):
            errors.append(f"timeline[{idx}]: missing provenance source")

    return errors


def validate_flight_telemetry(data: dict) -> list:
    errors = []
    if data.get("schema_version") != "1.0":
        errors.append("flight-telemetry: schema_version must be '1.0'")
    if not validate_iso_date(data.get("generated_at", "")):
        errors.append("flight-telemetry: generated_at is not a valid ISO date")
    
    params = data.get("parameters", [])
    if not isinstance(params, list) or len(params) < 10:
        errors.append(f"flight-telemetry: expected list of >=10 parameters, got {len(params) if isinstance(params, list) else type(params)}")
        return errors
    
    allowed_categories = {"NAVEGACION", "AMBIENTE", "ENERGIA", "COMUNICACIONES", "SISTEMAS"}
    allowed_states = {"MEASURED_NARRATIVE", "ESTIMATED", "HISTORICAL", "UNKNOWN", "CONFLICTING", "STALE"}
    allowed_validity = {"VALID", "STALE", "SUPERSEDED", "CONFLICTING"}
    
    seen_ids = set()
    for idx, p in enumerate(params):
        p_id = p.get("id")
        if not p_id:
            errors.append(f"flight-telemetry.parameters[{idx}]: missing id")
            continue
        if p_id in seen_ids:
            errors.append(f"flight-telemetry: duplicate parameter id '{p_id}'")
        seen_ids.add(p_id)
        
        if not p.get("name"):
            errors.append(f"flight-telemetry[{p_id}]: missing name")
        if p.get("category") not in allowed_categories:
            errors.append(f"flight-telemetry[{p_id}]: invalid category '{p.get('category')}'")
        if p.get("epistemicState") not in allowed_states:
            errors.append(f"flight-telemetry[{p_id}]: invalid epistemicState '{p.get('epistemicState')}'")
        if p.get("validityState") not in allowed_validity:
            errors.append(f"flight-telemetry[{p_id}]: invalid validityState '{p.get('validityState')}'")
        if not p.get("documentarySource"):
            errors.append(f"flight-telemetry[{p_id}]: missing documentarySource")
        if not p.get("provenanceLog"):
            errors.append(f"flight-telemetry[{p_id}]: missing provenanceLog")
        if not validate_iso_date(p.get("observationDate", "")):
            errors.append(f"flight-telemetry[{p_id}]: invalid observationDate '{p.get('observationDate')}'")
        if not p.get("uncertainty"):
            errors.append(f"flight-telemetry[{p_id}]: missing uncertainty statement")
        
        # Historical series validation
        hist = p.get("historicalSeries")
        if hist is not None:
            if not isinstance(hist, list):
                errors.append(f"flight-telemetry[{p_id}]: historicalSeries must be a list if present")
            else:
                for h_idx, hp in enumerate(hist):
                    if not validate_iso_date(hp.get("date", "")):
                        errors.append(f"flight-telemetry[{p_id}].historicalSeries[{h_idx}]: invalid date")
                    if not hp.get("source"):
                        errors.append(f"flight-telemetry[{p_id}].historicalSeries[{h_idx}]: missing source")
                    if hp.get("epistemicState") not in allowed_states:
                        errors.append(f"flight-telemetry[{p_id}].historicalSeries[{h_idx}]: invalid epistemicState")
    
    # Integrity block validation
    integrity = data.get("integrity", {})
    if not isinstance(integrity, dict):
        errors.append("flight-telemetry: integrity block missing or invalid")
    else:
        expected_keys = ["total_parameters", "measured_narrative_count", "estimated_count", 
                        "historical_count", "unknown_count", "conflicting_count", "stale_count", "with_historical_series"]
        for key in expected_keys:
            if key not in integrity:
                errors.append(f"flight-telemetry.integrity: missing key '{key}'")
    
    return errors

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Public Data Validator")
    parser.add_argument("--data-dir", type=str, default=str(DATA_DIR), help="Path to data directory")
    parser.add_argument("--test-mode", action="store_true", help="Run in test mode with relaxed validation")
    args = parser.parse_args()

    target_dir = Path(args.data_dir).resolve()
    test_mode = args.test_mode
    
    print(f"[VALIDATE] Auditing public datasets in {target_dir}...")
    all_errors = []

    required_files = [
        "manifest.json",
        "mission.json",
        "transmissions.json",
        "anomalies.json",
        "systems.json",
        "timeline.json",
        "flight-telemetry.json"
    ]

    for fname in required_files:
        fpath = target_dir / fname
        if not fpath.exists():
            all_errors.append(f"Missing required data file: {fname}")
            continue

        raw_text = fpath.read_text(encoding="utf-8")
        # Run security check
        all_errors.extend(check_security(raw_text, fname))

        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError as e:
            all_errors.append(f"JSON syntax error in {fname}: {e}")
            continue

        if fname == "manifest.json":
            all_errors.extend(validate_manifest(parsed))
        elif fname == "mission.json":
            all_errors.extend(validate_mission(parsed))
        elif fname == "transmissions.json":
            all_errors.extend(validate_transmissions(parsed, test_mode))
        elif fname == "anomalies.json":
            all_errors.extend(validate_anomalies(parsed, test_mode))
        elif fname == "systems.json":
            all_errors.extend(validate_systems(parsed, test_mode))
        elif fname == "timeline.json":
            all_errors.extend(validate_timeline(parsed, test_mode))
        elif fname == "flight-telemetry.json":
            all_errors.extend(validate_flight_telemetry(parsed))

    if all_errors:
        print(f"[FAIL] Found {len(all_errors)} validation errors:", file=sys.stderr)
        for err in all_errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)

    print("[SUCCESS] All public datasets passed schema, ISO date, provenance, and security validation.")
    sys.exit(0)

if __name__ == "__main__":
    main()
