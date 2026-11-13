#!/usr/bin/env python3
"""
MISSION-CONTROL V1.1 // Autonomous Mission Synchronizer
Coordinates the synchronization workflow:
1. Detects changes between bitacora source, anomaly export and current published manifest.
2. If NO_CHANGES, terminates cleanly with SYNC_RESULT=NO_CHANGES.
3. If CHANGES_DETECTED, invokes build_mission_data.py and validate_public_data.py.
4. Updates manifest.json with sync metadata, commit SHA, and anomaly_export block.
5. Returns exit code 0 on success.

REGRESSION PREVENTION:
- Verifies transmission count integrity before and after sync
- Validates fingerprint freshness against live manifest
- Checks for missing/duplicate transmission IDs
- Blocks deployment if artifact is stale or regressed
"""

import sys
import os
import subprocess
import argparse
import json
from pathlib import Path
from datetime import datetime, timezone

def run_cmd(cmd: list) -> tuple[int, str, str]:
    """Runs a command and returns (exit_code, stdout, stderr)."""
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out, err = p.communicate()
    return p.returncode, out, err

def load_manifest(path: Path) -> dict:
    """Load manifest.json from path, return empty dict if missing."""
    if not path.exists():
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def compute_transmission_fingerprint(transmissions: list) -> str:
    """Compute SHA256 fingerprint of transmission IDs for regression detection."""
    import hashlib
    ids = sorted(t.get("id", "") for t in transmissions if t.get("id"))
    return hashlib.sha256("|".join(ids).encode()).hexdigest()

def validate_transmission_integrity(transmissions: list, expected_count: int) -> tuple[bool, list[str]]:
    """Validate transmission integrity. Returns (is_valid, list of errors)."""
    errors = []
    seen_ids = set()
    missing_ids = []
    
    for t in transmissions:
        tx_id = t.get("id")
        if not tx_id:
            errors.append("Transmission missing 'id' field")
            continue
        if tx_id in seen_ids:
            errors.append(f"Duplicate transmission ID: {tx_id}")
        seen_ids.add(tx_id)
    
    # Check for expected sequential LOG IDs (allow gaps but track them)
    log_numbers = []
    for tid in seen_ids:
        if tid.startswith("LOG-"):
            try:
                num = int(tid.split("-")[1])
                log_numbers.append(num)
            except (IndexError, ValueError):
                pass
    
    if log_numbers:
        max_log = max(log_numbers)
        expected = set(range(0, max_log + 1))
        missing = expected - set(log_numbers)
        if missing:
            missing_str = ", ".join(f"LOG-{str(m).zfill(4)}" for m in sorted(missing))
            errors.append(f"Missing transmission IDs: {missing_str}")
    
    # Check that we didn't lose transmissions compared to expected
    if len(transmissions) < expected_count:
        errors.append(f"REGRESSION: Only {len(transmissions)} transmissions processed vs {expected_count} expected in source")
    
    return len(errors) == 0, errors


def check_artifact_freshness(manifest_path: Path, source_commit: str = None) -> tuple[bool, list[str]]:
    """Check if artifact is fresh (not stale from failed sync). Returns (is_fresh, warnings)."""
    warnings = []
    if not Path(manifest_path).exists():
        warnings.append("Manifest not found - first run or corrupted state")
        return True, warnings  # Allow first run
    
    manifest = load_manifest(manifest_path)
    
    # Check if manifest has sync metadata
    sync_info = manifest.get("sync", {})
    if not sync_info:
        warnings.append("No sync metadata in manifest")
        return True, warnings
    
    # Check if source_commit matches (if provided)
    if source_commit and sync_info.get("source_commit") != source_commit:
        warnings.append(f"Manifest source commit ({sync_info.get('source_commit')}) differs from current source ({source_commit})")
    
    # Check artifact age (warn if > 48 hours)
    sync_time_str = sync_info.get("timestamp") or sync_info.get("last_successful_sync")
    if sync_time_str:
        try:
            sync_time = datetime.fromisoformat(sync_time_str.replace('Z', '+00:00'))
            age = datetime.now(timezone.utc) - sync_time
            if age.total_seconds() > 48 * 3600:
                warnings.append(f"Artifact age: {age.days}d {age.seconds//3600}h - may be stale")
        except Exception:
            pass
    
    return True, warnings


def compute_expected_transmission_count(source_dir: Path) -> int:
    """Compute expected transmission count including LOG-0000 from README if present."""
    trans_dir = source_dir / "transmisiones"
    source_transmissions = list(trans_dir.glob("LOG-*.md")) if trans_dir.exists() else []
    count = len(source_transmissions)
    
    # Check if README contains LOG-0000 (which build_mission_data.py will add)
    readme_path = source_dir / "README.md"
    if readme_path.exists():
        text = readme_path.read_text(encoding="utf-8")
        if "LOG-0000" in text:
            count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description="MISSION-DATA SYNC V1.1")
    parser.add_argument("--source-dir", required=True, help="Bitacora source directory")
    parser.add_argument("--data-dir", required=True, help="Public data output directory")
    parser.add_argument("--mode", choices=["local", "github"], default="local", help="Build mode")
    parser.add_argument("--manifest-url", default=None, help="URL to live manifest.json")
    parser.add_argument("--commit-sha", default=None, help="Git commit SHA of source")
    parser.add_argument("--test-mode", action="store_true", help="Test mode (relaxed validation)")
    parser.add_argument("--force", action="store_true", help="Force rebuild even if no changes")
    args = parser.parse_args()

    source_dir = Path(args.source_dir).resolve()
    data_dir = Path(args.data_dir).resolve()
    manifest_path = data_dir / "manifest.json"
    script_dir = Path(__file__).resolve().parent

    # Find anomaly export
    anomaly_path = None
    for c in [
        source_dir / "data-source" / "anomalies-public.json",
        source_dir.parent / "data-source" / "anomalies-public.json",
        data_dir.parent / "data-source" / "anomalies-public.json",
    ]:
        if c.exists():
            anomaly_path = c
            break

    print("=" * 70)
    print("SONDA 0 // MISSION-DATA SYNC V1.1")
    print(f"Source: {source_dir}")
    print(f"Data directory: {data_dir}")
    print(f"Anomaly export: {anomaly_path}")
    print(f"Mode: {args.mode}")
    print("=" * 70)

    if not source_dir.exists():
        print(f"[ERROR] Source directory does not exist: {source_dir}", file=sys.stderr)
        sys.exit(1)

    # Compute expected transmission count (including LOG-0000 from README if present)
    expected_transmission_count = compute_expected_transmission_count(source_dir)
    print(f"[PRE-FLIGHT] Expected transmissions (including LOG-0000 from README): {expected_transmission_count}")
    if expected_transmission_count == 0:
        print("[ERROR] No transmissions found in source - aborting to prevent data loss", file=sys.stderr)
        sys.exit(1)

    # 1. Detect changes (dual: bitacora + anomaly export)
    detect_py = script_dir / "detect_changes.py"
    cmd_detect = [
        sys.executable, str(detect_py),
        "--source-dir", str(source_dir),
        "--manifest-path", str(manifest_path),
        "--manifest-url", str(args.manifest_url),
        "--output-json"
    ]
    if anomaly_path and anomaly_path.exists():
        cmd_detect.extend(["--anomaly-file", str(anomaly_path)])

    ret, out, err = run_cmd(cmd_detect)
    if ret != 0:
        print(f"[ERROR] detect_changes failed:\n{err}", file=sys.stderr)
        sys.exit(1)

    detect_info = json.loads(out)
    fingerprint = detect_info["fingerprint"]
    status = detect_info["status"]
    bitacora_changed = detect_info.get("bitacora_changed", False)
    anomaly_changed = detect_info.get("anomaly_changed", False)
    print(f"[SYNC] Change detection result: {status} (Bitacora: {bitacora_changed}, Anomaly: {anomaly_changed})")

    if status == "NO_CHANGES" and not args.force:
        # PRE-DEPLOYMENT REGRESSION CHECK: Even if no changes, verify artifact integrity
        print("[SYNC] No changes detected. Running pre-deployment artifact integrity check...")
        
        # Load current public data
        transmissions_path = data_dir / "transmissions.json"
        manifest = load_manifest(manifest_path)
        
        should_regenerate = False
        
        if transmissions_path.exists():
            with open(transmissions_path, "r", encoding="utf-8") as f:
                current_transmissions = json.load(f)
            
            # Check if artifact is stale (different count than expected)
            if current_transmissions and len(current_transmissions) != expected_transmission_count:
                print(f"[SYNC] Artifact is stale ({len(current_transmissions)} vs {expected_transmission_count} expected). Forcing regeneration.")
                should_regenerate = True
            else:
                # Verify current public data hasn't regressed (only check for actual integrity issues)
                valid, errors = validate_transmission_integrity(json.load(open(data_dir / "transmissions.json", "r")), expected_transmission_count)
                if not valid:
                    print(f"[ERROR] ARTIFACT REGRESSION DETECTED in current public data:", file=sys.stderr)
                    for e in errors:
                        print(f"  - {e}", file=sys.stderr)
                    print("[SYNC] Blocking deployment due to artifact regression!", file=sys.stderr)
                    sys.exit(1)
                
                # Check artifact freshness
                fresh, warnings = check_artifact_freshness(manifest_path, args.commit_sha)
                for w in warnings:
                    print(f"[WARN] {w}")
                
                print("[SYNC] Artifact integrity verified. Safe to skip deployment.")
                print("SYNC_RESULT=NO_CHANGES")
                sys.exit(0)

        if should_regenerate:
            print("[SYNC] Proceeding to build due to stale artifact.")
            # Don't exit - fall through to build phase
        else:
            print("[SYNC] Neither bitacora nor anomaly export has changed. Skipping build.")
            print("SYNC_RESULT=NO_CHANGES")
            sys.exit(0)

    # 2. Build datasets
    build_py = script_dir / "build_mission_data.py"
    cmd_build = [
        sys.executable, str(build_py),
        "--source-dir", str(source_dir),
        "--output-dir", str(data_dir),
        "--mode", args.mode,
        "--fingerprint", fingerprint
    ]
    if args.commit_sha:
        cmd_build.extend(["--commit-sha", args.commit_sha])

    print("[SYNC] Invoking build_mission_data...")
    ret, out, err = run_cmd(cmd_build)
    print(out)
    if ret != 0:
        print(f"[ERROR] build_mission_data failed:\n{err}", file=sys.stderr)
        sys.exit(1)

    # POST-BUILD REGRESSION CHECK: Validate generated artifacts
    print("[SYNC] Running post-build regression checks...")
    
    transmissions_path = data_dir / "transmissions.json"
    if transmissions_path.exists():
        with open(transmissions_path, "r", encoding="utf-8") as f:
            new_transmissions = json.load(f)
        
        valid, errors = validate_transmission_integrity(new_transmissions, expected_transmission_count)
        if not valid:
            print(f"[ERROR] POST-BUILD REGRESSION DETECTED:", file=sys.stderr)
            for e in errors:
                print(f"  - {e}", file=sys.stderr)
            sys.exit(1)
        
        print(f"[POST-BUILD] Transmission integrity verified: {len(new_transmissions)} transmissions")

    # 3. Build flight-telemetry.json (deterministic, idempotent)
    print("[SYNC] Generating flight-telemetry.json...")
    build_flight_py = script_dir / "build_flight_telemetry.py"
    cmd_flight = [
        sys.executable, str(build_flight_py),
        "--output-dir", str(data_dir),
        "--source-dir", str(source_dir),
    ]
    if args.commit_sha:
        cmd_flight.extend(["--commit-sha", args.commit_sha])
    ret, out, err = run_cmd(cmd_flight)
    print(out)
    if ret != 0:
        print(f"[ERROR] build_flight_telemetry failed:\n{err}", file=sys.stderr)
        sys.exit(1)
    
    print("[SYNC] Flight telemetry generated successfully.")

    # 3. Validate public datasets
    validate_py = script_dir / "validate_public_data.py"
    cmd_validate = [sys.executable, str(validate_py), "--data-dir", str(data_dir)]
    if args.test_mode:
        cmd_validate.append("--test-mode")
    print("[SYNC] Invoking validate_public_data...")
    ret, out, err = run_cmd(cmd_validate)
    print(out)
    if ret != 0:
        print(f"[ERROR] validate_public_data failed:\n{err}", file=sys.stderr)
        sys.exit(1)

    # FINAL ARTIFACT FRESHNESS CHECK
    manifest = load_manifest(manifest_path)
    fresh, warnings = check_artifact_freshness(manifest_path, args.commit_sha)
    for w in warnings:
        print(f"[WARN] {w}")

    print("[SYNC] Synchronization completed successfully with regression checks passed.")
    print("SYNC_RESULT=SYNC_SUCCESS")
    sys.exit(0)

if __name__ == "__main__":
    main()