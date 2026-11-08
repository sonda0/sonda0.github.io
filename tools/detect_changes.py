#!/usr/bin/env python3
"""
MISSION-CONTROL V1.1 // Change Detector
Computes a deterministic SHA-256 fingerprint from the canonical bitacora source files:
- README.md
- transmisiones/LOG-*.md (sorted by name)

Compares against the fingerprint stored in manifest.json.
Exits 0 and outputs SYNC_STATUS=CHANGES_DETECTED or SYNC_STATUS=NO_CHANGES.
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

def main():
    parser = argparse.ArgumentParser(description="MISSION-DATA SYNC // Change Detector")
    parser.add_argument("--source-dir", type=str, required=True, help="Path to bitacora source repository")
    parser.add_argument("--manifest-path", type=str, default=None, help="Path to existing manifest.json")
    parser.add_argument("--output-json", action="store_true", help="Print output as JSON")
    args = parser.parse_args()

    source_dir = Path(args.source_dir).resolve()
    if not source_dir.exists():
        print(f"[ERROR] Source directory does not exist: {source_dir}", file=sys.stderr)
        sys.exit(1)

    fingerprint, count = compute_source_fingerprint(source_dir)
    print(f"[DETECT] Computed source fingerprint: {fingerprint} ({count} files)")

    # Read existing manifest
    manifest_fingerprint = None
    if args.manifest_path:
        mpath = Path(args.manifest_path).resolve()
        if mpath.exists():
            try:
                with open(mpath, "r", encoding="utf-8") as f:
                    mdata = json.load(f)
                    manifest_fingerprint = mdata.get("sync", {}).get("content_fingerprint")
            except Exception as e:
                print(f"[WARN] Error reading manifest: {e}", file=sys.stderr)

    changes_detected = (manifest_fingerprint != fingerprint)
    status_str = "CHANGES_DETECTED" if changes_detected else "NO_CHANGES"

    if args.output_json:
        result = {
            "status": status_str,
            "fingerprint": fingerprint,
            "previous_fingerprint": manifest_fingerprint,
            "files_counted": count
        }
        print(json.dumps(result, indent=2))
    else:
        print(f"SYNC_STATUS={status_str}")
        print(f"CONTENT_FINGERPRINT={fingerprint}")

    # Exit code: 0 always, output indicates status
    sys.exit(0)

if __name__ == "__main__":
    main()
