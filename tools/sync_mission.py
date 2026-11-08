#!/usr/bin/env python3
"""
MISSION-CONTROL V1.1 // Autonomous Mission Synchronizer
Coordinates the synchronization workflow:
1. Detects changes between bitacora source, anomaly export and current published manifest.
2. If NO_CHANGES, terminates cleanly with SYNC_RESULT=NO_CHANGES.
3. If CHANGES_DETECTED, invokes build_mission_data.py and validate_public_data.py.
4. Updates manifest.json with sync metadata, commit SHA, and anomaly_export block.
5. Returns exit code 0 on success.
"""

import sys
import os
import subprocess
import argparse
import json
from pathlib import Path

def run_cmd(cmd: list) -> tuple[int, str, str]:
    """Runs a command and returns (exit_code, stdout, stderr)."""
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out, err = p.communicate()
    return p.returncode, out, err

def main():
    parser = argparse.ArgumentParser(description="MISSION-DATA SYNC // Synchronizer")
    parser.add_argument("--source-dir", type=str, required=True, help="Path to bitacora source repository")
    parser.add_argument("--data-dir", type=str, required=True, help="Path to web public/data directory")
    parser.add_argument("--mode", type=str, choices=["local", "github"], default="github", help="Execution mode")
    parser.add_argument("--manifest-url", type=str, default="https://sonda0.github.io/data/manifest.json", help="URL to live published manifest.json")
    parser.add_argument("--anomaly-file", type=str, default=None, help="Path to data-source/anomalies-public.json")
    parser.add_argument("--commit-sha", type=str, default=None, help="Source git commit SHA")
    parser.add_argument("--force", action="store_true", help="Force sync even if fingerprint matches")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    source_dir = Path(args.source_dir).resolve()
    data_dir = Path(args.data_dir).resolve()
    manifest_path = data_dir / "manifest.json"

    # Default anomaly export path lookup
    anomaly_path = None
    if args.anomaly_file:
        anomaly_path = Path(args.anomaly_file).resolve()
    else:
        # Check standard locations
        candidates = [
            data_dir.parent / "data-source" / "anomalies-public.json",
            data_dir.parent.parent / "data-source" / "anomalies-public.json",
            script_dir.parent / "data-source" / "anomalies-public.json"
        ]
        for c in candidates:
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

    # 3. Validate public datasets
    validate_py = script_dir / "validate_public_data.py"
    cmd_validate = [sys.executable, str(validate_py), "--data-dir", str(data_dir)]
    print("[SYNC] Invoking validate_public_data...")
    ret, out, err = run_cmd(cmd_validate)
    print(out)
    if ret != 0:
        print(f"[ERROR] validate_public_data failed:\n{err}", file=sys.stderr)
        sys.exit(1)

    print("[SYNC] Synchronization completed successfully.")
    print("SYNC_RESULT=SYNC_SUCCESS")
    sys.exit(0)

if __name__ == "__main__":
    main()
