import unittest
import os
import sys
import shutil
import tempfile
import json
from pathlib import Path

# Add mission_control/tools to path
CURRENT_DIR = Path(__file__).resolve().parent
MISSION_CONTROL = CURRENT_DIR.parent
TOOLS_DIR = MISSION_CONTROL / "tools"
sys.path.insert(0, str(TOOLS_DIR))

import build_mission_data
import detect_changes

class TestSyncMission(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="sonda_sync_test_")
        self.source_dir = Path(self.test_dir) / "source"
        self.output_dir = Path(self.test_dir) / "output"
        self.trans_dir = self.source_dir / "transmisiones"

        self.trans_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Create basic README
        (self.source_dir / "README.md").write_text(
            "# SONDA 0\n[LOG-0000](https://github.com/sonda0/bitacora/blob/main/README.md)\nLOG-0000: El Silencio",
            encoding="utf-8"
        )

        # Create LOG-0001
        log1 = (
            "---\n"
            "title: 'LOG-0001: Captura Interferométrica de HEX-04'\n"
            "date: '2026-11-07T03:00:00Z'\n"
            "tags: [astrofisica, hex-04]\n"
            "---\n\n"
            "[TELEMETRÍA DE SONDA 0]\n"
            "ID REGISTRO: LOG-0001-HEXA\n"
            "DISTANCIA RELATIVA: 165.14 AU\n\n"
            "### Detección espectrométrica\n\n"
            "Párrafo 1 de prueba de telemetría y observaciones.\n\n"
            "[FIN DE ARCHIVO // DATALINK TERMINADO]\n"
        )
        (self.trans_dir / "LOG-0001.md").write_text(log1, encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_new_record_simulation(self):
        """Simulate new transmission arrival (e.g. LOG-0023)."""
        log23 = (
            "---\n"
            "title: 'LOG-0023: Límites de verificación numérica'\n"
            "date: '2026-11-08T02:05:00Z'\n"
            "tags: [biofisica, verificacion]\n"
            "---\n\n"
            "[TELEMETRÍA DE SONDA 0]\n"
            "ID REGISTRO: LOG-0023\n"
            "VECTOR: Escape heliosférico en curso\n\n"
            "### Límites de verificación numérica\n\n"
            "El procesamiento del ciclo incorpora una reevaluación crítica.\n\n"
            "[FIN DE ARCHIVO // DATALINK TERMINADO]\n"
        )
        (self.trans_dir / "LOG-0023.md").write_text(log23, encoding="utf-8")

        txs = build_mission_data.build_transmissions(self.source_dir)
        ids = [t["id"] for t in txs]
        self.assertIn("LOG-0023", ids)
        self.assertIn("LOG-0001", ids)
        self.assertIn("LOG-0000", ids)

    def test_duplicate_records_rejected(self):
        """Simulate duplicate transmission ID in source."""
        # Create second file with LOG-0001 ID
        (self.trans_dir / "LOG-0001-copy.md").write_text(
            (self.trans_dir / "LOG-0001.md").read_text(encoding="utf-8"),
            encoding="utf-8"
        )
        # build_transmissions should not duplicate or should ignore
        txs = build_mission_data.build_transmissions(self.source_dir)
        ids = [t["id"] for t in txs]
        self.assertEqual(ids.count("LOG-0001"), 1)

    def test_change_detection_no_changes(self):
        """Two change detector runs without modifications must report NO_CHANGES."""
        fp1, count1 = detect_changes.compute_source_fingerprint(self.source_dir)

        # Write manifest with fp1
        manifest = {
            "sync": {
                "content_fingerprint": fp1
            }
        }
        manifest_path = self.output_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

        fp2, count2 = detect_changes.compute_source_fingerprint(self.source_dir)
        self.assertEqual(fp1, fp2)
        self.assertEqual(count1, count2)

    def test_change_detection_changes_detected(self):
        """Modifying or adding a transmission must change the fingerprint."""
        fp1, _ = detect_changes.compute_source_fingerprint(self.source_dir)

        # Add new transmission
        (self.trans_dir / "LOG-0002.md").write_text(
            "---\ntitle: 'LOG-0002'\ndate: '2026-11-07T04:00:00Z'\n---\n### Test\n\nPárrafo.\n\n[FIN DE ARCHIVO]\n",
            encoding="utf-8"
        )
        fp2, _ = detect_changes.compute_source_fingerprint(self.source_dir)
        self.assertNotEqual(fp1, fp2)

    def test_missing_local_anomaly_catalog_preserves_public_catalog(self):
        """Running in standalone mode without private anomaly catalog must preserve public catalog."""
        # Put an existing public anomalies.json in output_dir
        existing = [{"id": "ANOM-HEX-04", "title": "Preserved Anomaly", "state": "AWAITING_DATA"}]
        (self.output_dir / "anomalies.json").write_text(json.dumps(existing), encoding="utf-8")

        anomalies, status = build_mission_data.load_or_build_anomalies(self.source_dir, self.output_dir, mode="github")
        self.assertEqual(status, "STALE")
        self.assertEqual(len(anomalies), 1)
        self.assertEqual(anomalies[0]["title"], "Preserved Anomaly")

    def test_security_clean_public_output(self):
        """Ensure no sensitive patterns, tokens or private windows paths are emitted."""
        forbidden = ["ghp_", "Bearer ", "C:\\Users\\", "client_secret", ".env"]

        txs = build_mission_data.build_transmissions(self.source_dir)
        manifest = build_mission_data.build_manifest(txs, [], "STALE")
        manifest_str = json.dumps(manifest)

        for pat in forbidden:
            self.assertNotIn(pat, manifest_str)

if __name__ == "__main__":
    unittest.main()
