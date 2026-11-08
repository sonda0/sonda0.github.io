#!/usr/bin/env python3
"""
MISSION-CONTROL V1.1 // Change Detector
Computes a deterministic SHA-256 fingerprint from the canonical bitacora source files:
- README.md
- transmisiones/LOG-*.md (sorted by name)

Compares against the fingerprint stored in manifest.json.
Gracefully handles unavailable public manifests with robust local fallback.
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
    parser.add_argument("--manifest-url", type=str, default=None, help="URL to live published manifest.json")
    parser.add_argument("--output-json", action="store_true", help="Print output as JSON")
    args = parser.parse_args()

    source_dir = Path(args.source_dir).resolve()
    if not source_dir.exists():
        print(f"[ERROR] Source directory does not exist: {source_dir}", file=sys.stderr)
        sys.exit(1)

    fingerprint, count = compute_source_fingerprint(source_dir)

    manifest_fingerprint = None
    manifest_source = "none"
    public_url_error = None

    # 1. Attempt reading from public URL if provided
    if args.manifest_url:
        try:
            import urllib.request
            req = urllib.request.Request(args.manifest_url, headers={"User-Agent": "Sonda0-Sync"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                mdata = json.load(resp)
                manifest_fingerprint = mdata.get("sync", {}).get("content_fingerprint")
                if manifest_fingerprint:
                    manifest_source = "public_url"
        except Exception as e:
            public_url_error = str(e)
            print(f"[WARN] Public manifest URL unreachable ({e}); falling back to local manifest.", file=sys.stderr)

    # 2. Robust fallback to local manifest_path
    if not manifest_fingerprint and args.manifest_path:
        mpath = Path(args.manifest_path).resolve()
        if mpath.exists():
            try:
                with open(mpath, "r", encoding="utf-8") as f:
                    mdata = json.load(f)
                    manifest_fingerprint = mdata.get("sync", {}).get("content_fingerprint")
                    if manifest_fingerprint:
                        manifest_source = "local_manifest"
            except Exception as e:
                print(f"[WARN] Error reading local manifest at {mpath}: {e}", file=sys.stderr)

    changes_detected = (manifest_fingerprint != fingerprint)
    status_str = "CHANGES_DETECTED" if changes_detected else "NO_CHANGES"

    if args.output_json:
        result = {
            "status": status_str,
            "fingerprint": fingerprint,
            "previous_fingerprint": manifest_fingerprint,
            "manifest_source": manifest_source,
            "public_url_error": public_url_error,
            "files_counted": count
        }
        print(json.dumps(result, indent=2))
    else:
        print(f"[DETECT] Computed source fingerprint: {fingerprint} ({count} files)")
        print(f"[DETECT] Manifest source: {manifest_source}")
        print(f"SYNC_STATUS={status_str}")
        print(f"CONTENT_FINGERPRINT={fingerprint}")

    sys.exit(0)

if __name__ == "__main__":
    main()
