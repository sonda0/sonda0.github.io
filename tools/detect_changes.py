#!/usr/bin/env python3
"""
MISSION-CONTROL V1.1 // Dual Change Detector
Computes deterministic SHA-256 fingerprints from:
1. Canonical bitacora source files (README.md and transmisiones/LOG-*.md)
2. Public anomaly export (data-source/anomalies-public.json)

Compares against the fingerprints stored in manifest.json.
Gracefully handles unavailable public manifests with robust local fallback.
Detects changes if EITHER bitacora OR anomaly export changes.
"""

import sys
import hashlib
import json
import argparse
from pathlib import Path

def compute_source_fingerprint(source_dir: Path) -> tuple[str, int]:
    """
    Computes a content hash of README.md and all valid transmisiones/LOG-*.md files.
    Returns (hex_sha256, count_of_files).
    """
    hasher = hashlib.sha256()
    file_count = 0

    readme = source_dir / "README.md"
    if readme.exists():
        hasher.update(b"=== README.md ===\n")
        hasher.update(readme.read_bytes())
        file_count += 1

    trans_dir = source_dir / "transmisiones"
    if trans_dir.exists():
        for p in sorted(trans_dir.glob("LOG-*.md")):
            hasher.update(f"=== {p.name} ===\n".encode("utf-8"))
            hasher.update(p.read_bytes())
            file_count += 1

    return hasher.hexdigest(), file_count

def compute_anomaly_export_fingerprint(anomaly_file: Path) -> str:
    """Reads content_fingerprint or computes SHA-256 over anomalies list."""
    if not anomaly_file.exists():
        return None
    try:
        with open(anomaly_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        if "content_fingerprint" in data and data["content_fingerprint"]:
            return data["content_fingerprint"]
        # Fallback canonical hash
        anomalies = data.get("anomalies", [])
        canonical = {
            "schema_version": data.get("schema_version", "1.0"),
            "source": data.get("source", "EXODATA-V3.1"),
            "exporter": data.get("exporter", "ANOMALY-UPLINK-V1.0"),
            "anomalies": anomalies
        }
        encoded = json.dumps(canonical, sort_keys=True, indent=2, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()
    except Exception:
        return None

def main():
    parser = argparse.ArgumentParser(description="MISSION-DATA SYNC // Change Detector")
    parser.add_argument("--source-dir", type=str, required=True, help="Path to bitacora source repository")
    parser.add_argument("--anomaly-file", type=str, default=None, help="Path to data-source/anomalies-public.json")
    parser.add_argument("--manifest-path", type=str, default=None, help="Path to existing manifest.json")
    parser.add_argument("--manifest-url", type=str, default=None, help="URL to live published manifest.json")
    parser.add_argument("--output-json", action="store_true", help="Print output as JSON")
    args = parser.parse_args()

    source_dir = Path(args.source_dir).resolve()
    if not source_dir.exists():
        print(f"[ERROR] Source directory does not exist: {source_dir}", file=sys.stderr)
        sys.exit(1)

    bitacora_fp, count = compute_source_fingerprint(source_dir)

    # Anomaly export fingerprint
    anomaly_fp = None
    if args.anomaly_file:
        anomaly_p = Path(args.anomaly_file).resolve()
        anomaly_fp = compute_anomaly_export_fingerprint(anomaly_p)

    manifest_bitacora_fp = None
    manifest_anomaly_fp = None
    manifest_source = "none"
    public_url_error = None

    # 1. Attempt reading from public URL if provided
    if args.manifest_url:
        try:
            import urllib.request
            req = urllib.request.Request(args.manifest_url, headers={"User-Agent": "Sonda0-Sync"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                mdata = json.load(resp)
                manifest_bitacora_fp = mdata.get("sync", {}).get("content_fingerprint")
                manifest_anomaly_fp = mdata.get("anomaly_export", {}).get("content_fingerprint")
                if manifest_bitacora_fp:
                    manifest_source = "public_url"
        except Exception as e:
            public_url_error = str(e)
            print(f"[WARN] Public manifest URL unreachable ({e}); falling back to local manifest.", file=sys.stderr)

    # 2. Robust fallback to local manifest_path
    if not manifest_bitacora_fp and args.manifest_path:
        mpath = Path(args.manifest_path).resolve()
        if mpath.exists():
            try:
                with open(mpath, "r", encoding="utf-8") as f:
                    mdata = json.load(f)
                    manifest_bitacora_fp = mdata.get("sync", {}).get("content_fingerprint")
                    manifest_anomaly_fp = mdata.get("anomaly_export", {}).get("content_fingerprint")
                    if manifest_bitacora_fp:
                        manifest_source = "local_manifest"
            except Exception as e:
                print(f"[WARN] Error reading local manifest at {mpath}: {e}", file=sys.stderr)

    bitacora_changed = (manifest_bitacora_fp != bitacora_fp)
    anomaly_changed = bool(anomaly_fp and manifest_anomaly_fp != anomaly_fp)

    changes_detected = bitacora_changed or anomaly_changed
    status_str = "CHANGES_DETECTED" if changes_detected else "NO_CHANGES"

    if args.output_json:
        result = {
            "status": status_str,
            "fingerprint": bitacora_fp,
            "anomaly_fingerprint": anomaly_fp,
            "previous_fingerprint": manifest_bitacora_fp,
            "previous_anomaly_fingerprint": manifest_anomaly_fp,
            "bitacora_changed": bitacora_changed,
            "anomaly_changed": anomaly_changed,
            "manifest_source": manifest_source,
            "public_url_error": public_url_error,
            "files_counted": count
        }
        print(json.dumps(result, indent=2))
    else:
        print(f"[DETECT] Computed source fingerprint: {bitacora_fp} ({count} files)")
        if anomaly_fp:
            print(f"[DETECT] Anomaly export fingerprint: {anomaly_fp}")
        print(f"[DETECT] Bitacora changed: {bitacora_changed}, Anomaly changed: {anomaly_changed}")
        print(f"[DETECT] Manifest source: {manifest_source}")
        print(f"SYNC_STATUS={status_str}")
        print(f"CONTENT_FINGERPRINT={bitacora_fp}")

    sys.exit(0)

if __name__ == "__main__":
    main()
