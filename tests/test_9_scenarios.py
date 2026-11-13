#!/usr/bin/env python3
"""
SYNC-RECOVERY 003 - 9 NO_CHANGES Scenario Integration Tests
"""
import sys
import json
import subprocess
import tempfile
import shutil
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tools"))

import build_mission_data
import detect_changes

TOOLS_DIR = Path(__file__).resolve().parent.parent / "tools"

class TestNineScenarios(unittest.TestCase):
    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp(prefix="sonda_sync_9scenarios_"))
        self.source_dir = self.test_dir / "source"
        self.output_dir = self.test_dir / "output"
        self.trans_dir = self.source_dir / "transmisiones"
        
        self.trans_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # README with LOG-0000
        (self.source_dir / "README.md").write_text(
            "# SONDA 0\n[LOG-0000](https://github.com/sonda0/bitacora/blob/main/README.md)\nLOG-0000: El Silencio",
            encoding="utf-8"
        )
        
        # LOG-0001
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

    def run_sync(self, extra_args=None):
        """Run sync_mission.py and return (returncode, stdout, stderr)"""
        cmd = [
            sys.executable,
            str(TOOLS_DIR / "sync_mission.py"),
            "--source-dir", str(self.source_dir),
            "--data-dir", str(self.output_dir),
            "--mode", "github",
            "--manifest-url", "http://127.0.0.1:9999/nonexistent.json",
            "--test-mode"
        ]
        if extra_args:
            cmd.extend(extra_args)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return result.returncode, result.stdout, result.stderr

    def write_transmissions(self, data):
        (self.output_dir / "transmissions.json").write_text(json.dumps(data), encoding="utf-8")

    def write_manifest(self, fingerprint):
        (self.output_dir / "manifest.json").write_text(
            json.dumps({"sync": {"content_fingerprint": fingerprint}}),
            encoding="utf-8"
        )

    def get_fingerprint(self):
        return detect_changes.compute_source_fingerprint(self.source_dir)[0]

    def test_01_missing_transmissions_json(self):
        """1. transmissions.json ausente -> regeneración (SYNC_SUCCESS)"""
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        # No transmissions.json file
        
        rc, stdout, stderr = self.run_sync()
        self.assertEqual(rc, 0, f"Expected exit 0, got {rc}\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}")
        self.assertIn("Artifact missing", stdout)
        self.assertIn("SYNC_RESULT=SYNC_SUCCESS", stdout)

    def test_02_empty_transmissions_json(self):
        """2. transmissions.json vacío ([]) -> regeneración"""
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        self.write_transmissions([])
        
        rc, stdout, stderr = self.run_sync()
        self.assertEqual(rc, 0, f"Expected exit 0, got {rc}\nSTDOUT:\n{stdout}")
        self.assertIn("Artifact is stale", stdout)
        self.assertIn("SYNC_RESULT=SYNC_SUCCESS", stdout)

    def test_03_count_less_than_expected(self):
        """3. Cantidad menor que esperada -> regeneración"""
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        # Only 1 transmission instead of 2 (LOG-0000 + LOG-0001)
        self.write_transmissions([{"id": "LOG-0001", "title": "Test", "date": "2026-11-07T03:00:00Z"}])
        
        rc, stdout, stderr = self.run_sync()
        self.assertEqual(rc, 0, f"Expected exit 0, got {rc}\nSTDOUT:\n{stdout}")
        self.assertIn("Artifact is stale", stdout)
        self.assertIn("SYNC_RESULT=SYNC_SUCCESS", stdout)

    def test_04_valid_artifact_correct_count(self):
        """4. Artefacto válido e idéntico a la fuente -> NO_CHANGES"""
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        valid_txs = build_mission_data.build_transmissions(self.source_dir)
        self.write_transmissions(valid_txs)
        
        rc, stdout, stderr = self.run_sync()
        self.assertEqual(rc, 0, f"Expected exit 0, got {rc}\nSTDOUT:\n{stdout}")
        self.assertIn("SYNC_RESULT=NO_CHANGES", stdout)
        self.assertIn("Artifact integrity verified", stdout)

    def test_05_duplicate_ids_rejected(self):
        """5. IDs duplicados -> no aceptar (exit 1)"""
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        # Create transmissions with duplicate IDs
        self.write_transmissions([
            {"id": "LOG-0001", "title": "Test 1", "date": "2026-11-07T03:00:00Z", "tags": [], "version": "V2.0", "summary": "Test", "telemetry": {"id_registro": "LOG-0001", "distance": "165.14 AU", "distance_status": "HISTORICAL", "subsystems_status": "Nominal"}, "paragraphs": [], "github_url": "https://github.com", "epistemic_status": "archive"},
            {"id": "LOG-0001", "title": "Test 1 Dup", "date": "2026-11-07T03:00:00Z", "tags": [], "version": "V2.0", "summary": "Test dup", "telemetry": {"id_registro": "LOG-0001", "distance": "165.14 AU", "distance_status": "HISTORICAL", "subsystems_status": "Nominal"}, "paragraphs": [], "github_url": "https://github.com", "epistemic_status": "archive"},
        ])
        
        rc, stdout, stderr = self.run_sync()
        self.assertNotEqual(rc, 0, f"Expected exit != 0 for duplicate IDs, got {rc}\nSTDOUT:\n{stdout}")
        self.assertIn("Duplicate transmission ID", stdout + stderr)

    def test_06_missing_ids_rejected(self):
        """6. IDs faltantes -> no aceptar (exit 1)"""
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        # Create LOG-0001 and LOG-0003 (missing LOG-0002)
        log3 = (
            "---\n"
            "title: 'LOG-0003: Test'\n"
            "date: '2026-11-07T05:00:00Z'\n"
            "---\n### Test\n\nPárrafo.\n\n[FIN DE ARCHIVO]\n"
        )
        (self.trans_dir / "LOG-0003.md").write_text(log3, encoding="utf-8")
        
        rc, stdout, stderr = self.run_sync(["--force", "--test-mode"])
        self.assertNotEqual(rc, 0, f"Expected exit != 0 for missing IDs, got {rc}\nSTDOUT:\n{stdout}")
        self.assertIn("Missing transmission IDs", stdout + stderr)

    def test_07_readme_absent_safe_behavior(self):
        """7. README ausente -> comportamiento seguro (solo LOG-*.md)"""
        # Remove README
        (self.source_dir / "README.md").unlink()
        
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        # Valid artifact with just LOG-0001 (no LOG-0000 since no README)
        valid_txs = build_mission_data.build_transmissions(self.source_dir)
        self.write_transmissions(valid_txs)
        
        rc, stdout, stderr = self.run_sync()
        self.assertEqual(rc, 0, f"Expected exit 0, got {rc}\nSTDOUT:\n{stdout}")
        self.assertIn("SYNC_RESULT=NO_CHANGES", stdout)
        
        # Restore README for other tests
        (self.source_dir / "README.md").write_text(
            "# SONDA 0\n[LOG-0000](https://github.com/sonda0/bitacora/blob/main/README.md)\nLOG-0000: El Silencio",
            encoding="utf-8"
        )

    def test_08_log0000_not_duplicated(self):
        """8. LOG-0000 en README y como archivo -> no duplicar"""
        # Add LOG-0000.md file (simulating duplicate source)
        log0000_file = (
            "---\n"
            "title: 'LOG-0000: Test'\n"
            "date: '2026-11-06T04:12:09Z'\n"
            "---\n### Test\n\nPárrafo.\n\n[FIN DE ARCHIVO]\n"
        )
        (self.trans_dir / "LOG-0000.md").write_text(log0000_file, encoding="utf-8")
        
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        valid_txs = build_mission_data.build_transmissions(self.source_dir)
        ids = [t["id"] for t in valid_txs]
        self.assertEqual(ids.count("LOG-0000"), 1, "LOG-0000 should appear exactly once")
        self.write_transmissions(valid_txs)
        
        rc, stdout, stderr = self.run_sync()
        self.assertEqual(rc, 0, f"Expected exit 0, got {rc}\nSTDOUT:\n{stdout}")
        self.assertIn("SYNC_RESULT=NO_CHANGES", stdout)
        
        # Clean up
        (self.trans_dir / "LOG-0000.md").unlink()

    def test_09_build_failure_preserves_artifact(self):
        """9. Fallo en regeneración -> preserva último artefacto válido"""
        # First, create a valid artifact
        fp = self.get_fingerprint()
        self.write_manifest(fp)
        valid_txs = build_mission_data.build_transmissions(self.source_dir)
        self.write_transmissions(valid_txs)
        
        # Corrupt source: empty LOG-0001.md will cause build failure
        (self.trans_dir / "LOG-0001.md").write_text("", encoding="utf-8")
        
        # Force rebuild (should fail)
        rc, stdout, stderr = self.run_sync(["--force"])
        self.assertNotEqual(rc, 0, "Build should fail with empty source file")
        
        # Verify original artifact is preserved
        preserved_txs = json.loads((self.output_dir / "transmissions.json").read_text(encoding="utf-8"))
        self.assertEqual(len(preserved_txs), 2, "Original artifact should be preserved")
        self.assertIn("LOG-0000", [t["id"] for t in preserved_txs])
        self.assertIn("LOG-0001", [t["id"] for t in preserved_txs])

if __name__ == "__main__":
    print("=" * 70)
    print("SYNC-RECOVERY 003 - 9 SCENARIO INTEGRATION TESTS")
    print("=" * 70)
    
    # Run these 9 scenarios
    suite = unittest.TestLoader().loadTestsFromTestCase(TestNineScenarios)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print(f"\n{'='*70}")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success: {result.wasSuccessful()}")
    
    if result.wasSuccessful():
        print("\n✅ ALL 9 SCENARIOS PASSED")
    else:
        print("\n❌ SOME SCENARIOS FAILED")
    
    sys.exit(0 if result.wasSuccessful() else 1)