import unittest
import os
import sys
import shutil
import tempfile
import json
import subprocess
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
        (self.trans_dir / "LOG-0001-copy.md").write_text(
            (self.trans_dir / "LOG-0001.md").read_text(encoding="utf-8"),
            encoding="utf-8"
        )
        txs = build_mission_data.build_transmissions(self.source_dir)
        ids = [t["id"] for t in txs]
        self.assertEqual(ids.count("LOG-0001"), 1)

    def test_change_detection_no_changes(self):
        """Two change detector runs without modifications must report NO_CHANGES."""
        fp1, count1 = detect_changes.compute_source_fingerprint(self.source_dir)

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

        (self.trans_dir / "LOG-0002.md").write_text(
            "---\ntitle: 'LOG-0002'\ndate: '2026-11-07T04:00:00Z'\n---\n### Test\n\nPárrafo.\n\n[FIN DE ARCHIVO]\n",
            encoding="utf-8"
        )
        fp2, _ = detect_changes.compute_source_fingerprint(self.source_dir)
        self.assertNotEqual(fp1, fp2)

    def test_missing_local_anomaly_catalog_preserves_public_catalog(self):
        """Running in standalone mode without private anomaly catalog must preserve public catalog."""
        existing = [{"id": "ANOM-HEX-04", "title": "Preserved Anomaly", "state": "AWAITING_DATA"}]
        (self.output_dir / "anomalies.json").write_text(json.dumps(existing), encoding="utf-8")

        anomalies, status, _ = build_mission_data.load_or_build_anomalies(self.source_dir, self.output_dir, mode="github")
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

    # --- NUEVAS PRUEBAS: AUDIT-REMEDIATION 001 (Ámbito B) ---

    def test_sync_no_op_when_source_unchanged(self):
        """No-op deployment: when source fingerprint matches manifest, sync terminates cleanly with NO_CHANGES."""
        sync_script = TOOLS_DIR / "sync_mission.py"
        fp, _ = detect_changes.compute_source_fingerprint(self.source_dir)

        manifest = {"sync": {"content_fingerprint": fp}}
        (self.output_dir / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

        # Write valid transmissions matching the expected count (LOG-0000 + LOG-0001)
        txs = build_mission_data.build_transmissions(self.source_dir)
        (self.output_dir / "transmissions.json").write_text(
            json.dumps(txs), encoding="utf-8"
        )

        # Run sync_mission.py with matching fingerprint and no --force
        cmd = [
            sys.executable, str(sync_script),
            "--source-dir", str(self.source_dir),
            "--data-dir", str(self.output_dir),
            "--mode", "github",
            "--manifest-url", "http://127.0.0.1:9999/nonexistent.json"  # should fallback to local manifest
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("SYNC_RESULT=NO_CHANGES", res.stdout)

    def test_change_detection_public_manifest_unavailable_fallback(self):
        """When public manifest URL is unreachable (offline/404), detector falls back to local manifest cleanly."""
        fp, count = detect_changes.compute_source_fingerprint(self.source_dir)
        manifest = {"sync": {"content_fingerprint": fp}}
        manifest_path = self.output_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

        detect_script = TOOLS_DIR / "detect_changes.py"
        cmd = [
            sys.executable, str(detect_script),
            "--source-dir", str(self.source_dir),
            "--manifest-path", str(manifest_path),
            "--manifest-url", "https://invalid-nonexistent-domain-404.io/manifest.json",
            "--output-json"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        out = json.loads(res.stdout)
        self.assertEqual(out["status"], "NO_CHANGES")
        self.assertEqual(out["manifest_source"], "local_manifest")
        self.assertIsNotNone(out["public_url_error"])

    def test_preservation_of_last_valid_dataset_on_build_error(self):
        """When build or validation fails, previous valid public datasets remain completely intact and uncorrupted."""
        # 1. Populate output_dir with a valid dataset
        valid_transmissions = [{"id": "LOG-0001", "title": "Valid Log", "date": "2026-11-07T03:00:00Z"}]
        valid_mission = {"mission_id": "SONDA-0", "status": "NOMINAL"}
        (self.output_dir / "transmissions.json").write_text(json.dumps(valid_transmissions), encoding="utf-8")
        (self.output_dir / "mission.json").write_text(json.dumps(valid_mission), encoding="utf-8")

        # 2. Corrupt source directory by making it unreadable or empty invalid markdown
        (self.trans_dir / "LOG-0099.md").write_text("", encoding="utf-8") # Empty file raises ValueError

        # 3. Attempt to run build_mission_data
        build_script = TOOLS_DIR / "build_mission_data.py"
        cmd = [
            sys.executable, str(build_script),
            "--source-dir", str(self.source_dir),
            "--output-dir", str(self.output_dir),
            "--mode", "github",
            "--fingerprint", "dummy_fingerprint"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        self.assertNotEqual(res.returncode, 0)

        # 4. Verify that previous valid files were NOT overwritten or deleted
        tx_after = json.loads((self.output_dir / "transmissions.json").read_text(encoding="utf-8"))
        mission_after = json.loads((self.output_dir / "mission.json").read_text(encoding="utf-8"))
        self.assertEqual(tx_after, valid_transmissions)
        self.assertEqual(mission_after, valid_mission)

    def test_protocol_version_no_unsupported_v31_default(self):
        """Transmissions >= 22 without explicit V3.1 evidence must NOT default to V3.1."""
        # Case A: No V3.1 marker in content or frontmatter -> V3.0
        v_case_a = build_mission_data.determine_protocol_version(
            log_num=25,
            frontmatter={"title": "LOG-0025: Test"},
            content="### Test\n\nPárrafo estándar sin mención de versión."
        )
        self.assertEqual(v_case_a, "V3.0")

        # Case B: Explicit V3.1 in content -> V3.1
        v_case_b = build_mission_data.determine_protocol_version(
            log_num=25,
            frontmatter={"title": "LOG-0025: Test"},
            content="### Test\n\nOperando bajo EXODATA V3.1 con rigor epistemológico."
        )
        self.assertEqual(v_case_b, "V3.1")

    def test_anomaly_catalog_stale_status_in_all_modes(self):
        """Anomaly catalog status must remain STALE in both local and github modes until validated export."""
        # Even with local catalog existing in source
        local_cat_path = self.source_dir / "scripts" / "anomaly_catalog.json"
        local_cat_path.parent.mkdir(parents=True, exist_ok=True)
        local_cat_path.write_text(json.dumps({"anomalies": [{"id": "ANOM-HEX-04", "title": "Test"}]}), encoding="utf-8")

        _, status_local, _ = build_mission_data.load_or_build_anomalies(self.source_dir, self.output_dir, mode="local")
        self.assertEqual(status_local, "STALE")

        _, status_github, _ = build_mission_data.load_or_build_anomalies(self.source_dir, self.output_dir, mode="github")
        self.assertEqual(status_github, "STALE")

    def test_timeline_evt016_accurate_and_no_rom_corruption(self):
        """EVT-016 must reflect LOG-0016 accurately without claiming confirmed ROM corruption."""
        events = build_mission_data.build_dynamic_timeline([], self.output_dir)
        evt16 = next((e for e in events if e["id"] == "EVT-016"), None)
        self.assertIsNotNone(evt16)
        # Must not claim confirmed ROM corruption
        self.assertNotIn("discrepancia en bloques de memoria ROM", evt16["summary"].lower())
        self.assertIn("almacenamiento reescribible", evt16["summary"].lower())
        self.assertIn("sin alteración de rom", evt16["summary"].lower())

    def test_timeline_evt017_correct_date(self):
        """EVT-017 must reflect the actual V3.1 patch date (2026-11-08T01:15:00Z), not 2026-11-07."""
        events = build_mission_data.build_dynamic_timeline([], self.output_dir)
        evt17 = next((e for e in events if e["id"] == "EVT-017"), None)
        self.assertIsNotNone(evt17)
        self.assertEqual(evt17["date"], "2026-11-08T01:15:00Z")

    # --- REGRESSION PREVENTION TESTS (HOTFIX SYNC-INTEGRITY 002) ---

    def test_preflight_source_count_check(self):
        """Pre-flight check: must have at least one transmission in source."""
        # Valid case: has LOG-0001 and LOG-0000 via README
        txs = build_mission_data.build_transmissions(self.source_dir)
        self.assertGreaterEqual(len(txs), 2)

        # Empty source should return empty list (not crash)
        empty_source = Path(self.test_dir) / "empty_source"
        empty_trans = empty_source / "transmisiones"
        empty_trans.mkdir(parents=True, exist_ok=True)
        (empty_source / "README.md").write_text("# Empty", encoding="utf-8")

        # Empty source should return empty list, not crash
        txs = build_mission_data.build_transmissions(empty_source)
        self.assertEqual(len(txs), 0)

    def test_transmission_integrity_missing_ids(self):
        """Detect missing sequential LOG IDs."""
        # Create LOG-0001 and LOG-0003 (missing LOG-0002)
        log1 = (self.trans_dir / "LOG-0001.md").read_text(encoding="utf-8")
        log3 = (
            "---\n"
            "title: 'LOG-0003: Test'\n"
            "date: '2026-11-07T05:00:00Z'\n"
            "---\n### Test\n\nPárrafo.\n\n[FIN DE ARCHIVO]\n"
        )
        (self.trans_dir / "LOG-0003.md").write_text(log3, encoding="utf-8")

        # Test validation
        from build_mission_data import validate_transmission_integrity
        txs = build_mission_data.build_transmissions(self.source_dir)
        valid, errors = build_mission_data.validate_transmission_integrity(txs, len(txs))
        self.assertFalse(valid)
        self.assertTrue(any("Missing transmission IDs" in e for e in errors))

    def test_transmission_integrity_duplicate_ids(self):
        """Duplicate LOG IDs must be detected."""
        # Manually create a list with duplicate IDs to test validation directly
        txs_with_duplicates = [
            {"id": "LOG-0001", "title": "Test 1", "date": "2026-11-07T03:00:00Z", "tags": [], "version": "V2.0", "summary": "Test", "telemetry": {"id_registro": "LOG-0001", "distance": "165.14 AU", "distance_status": "HISTORICAL", "subsystems_status": "Nominal"}, "paragraphs": [], "github_url": "https://github.com", "epistemic_status": "archive"},
            {"id": "LOG-0001", "title": "Test 1 Duplicate", "date": "2026-11-07T03:00:00Z", "tags": [], "version": "V2.0", "summary": "Test dup", "telemetry": {"id_registro": "LOG-0001", "distance": "165.14 AU", "distance_status": "HISTORICAL", "subsystems_status": "Nominal"}, "paragraphs": [], "github_url": "https://github.com", "epistemic_status": "archive"},
        ]

        from build_mission_data import validate_transmission_integrity
        valid, errors = build_mission_data.validate_transmission_integrity(txs_with_duplicates, len(txs_with_duplicates))
        self.assertFalse(valid)
        self.assertTrue(any("Duplicate transmission ID" in e for e in errors))

    def test_transmission_count_regression(self):
        """Fewer transmissions in output than source must fail."""
        from build_mission_data import validate_transmission_integrity
        txs = build_mission_data.build_transmissions(self.source_dir)

        # Simulate regression: output has fewer transmissions than source
        valid, errors = build_mission_data.validate_transmission_integrity(
            [txs[0]],  # Only 1 transmission
            len(build_mission_data.build_transmissions(self.source_dir))  # Source has more
        )
        self.assertFalse(valid)
        self.assertTrue(any("REGRESSION" in e for e in errors))

    def test_no_changes_pre_deployment_artifact_check(self):
        """Pre-deployment artifact integrity check must run on NO_CHANGES.

        If artifact is stale (count mismatch), it should trigger regeneration (exit 0).
        If artifact is valid and matches expected count, it should skip build (exit 0, NO_CHANGES).
        """
        from sync_mission import check_artifact_freshness, validate_transmission_integrity, load_manifest

        # Setup: valid artifact (2 transmissions: LOG-0000 + LOG-0001)
        txs = build_mission_data.build_transmissions(self.source_dir)
        manifest = {"sync": {"content_fingerprint": "dummy_fp"}}
        (self.output_dir / "manifest.json").write_text(json.dumps(manifest))

        # Write valid transmissions
        (self.output_dir / "transmissions.json").write_text(
            json.dumps(build_mission_data.build_transmissions(self.source_dir)), encoding="utf-8"
        )

        # Test 1: Valid artifact with correct count -> should skip build (NO_CHANGES)
        sync_script = TOOLS_DIR / "sync_mission.py"
        fp, _ = detect_changes.compute_source_fingerprint(self.source_dir)
        manifest = {"sync": {"content_fingerprint": fp}}
        (self.output_dir / "manifest.json").write_text(json.dumps(manifest))

        cmd = [
            sys.executable, str(TOOLS_DIR / "sync_mission.py"),
            "--source-dir", str(self.source_dir),
            "--data-dir", str(self.output_dir),
            "--mode", "github",
            "--manifest-url", "http://127.0.0.1:9999/nonexistent.json",
            "--test-mode"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        # Valid artifact -> should skip build with NO_CHANGES
        self.assertEqual(res.returncode, 0)
        self.assertIn("SYNC_RESULT=NO_CHANGES", res.stdout)
        self.assertIn("Artifact integrity verified", res.stdout)

        # Test 2: Corrupt the transmissions file (stale count) -> should regenerate (exit 0)
        (self.output_dir / "transmissions.json").write_text(json.dumps([{"id": "LOG-0001"}]), encoding="utf-8")

        manifest = {"sync": {"content_fingerprint": fp}}
        (self.output_dir / "manifest.json").write_text(json.dumps(manifest))

        res = subprocess.run(cmd, capture_output=True, text=True)
        # Stale artifact -> should regenerate and succeed
        self.assertEqual(res.returncode, 0)
        self.assertIn("Artifact is stale", res.stdout)
        self.assertIn("Proceeding to build due to stale or missing artifact", res.stdout)
        self.assertIn("[POST-BUILD] Transmission integrity verified: 2 transmissions", res.stdout)
        self.assertIn("SYNC_RESULT=SYNC_SUCCESS", res.stdout)

    def test_post_build_regression_check(self):
        """Post-build regression check must catch missing transmissions."""
        # Add a new transmission
        log2 = (
            "---\n"
            'title: "LOG-0002: New Record"\n'
            'date: "2026-11-07T04:00:00Z"\n'
            "---\n### Test\n\nPárrafo.\n\n[FIN DE ARCHIVO]\n"
        )
        (self.trans_dir / "LOG-0002.md").write_text(log2, encoding="utf-8")

        # Run sync - should detect new content and build
        sync_script = TOOLS_DIR / "sync_mission.py"
        cmd = [
            sys.executable, str(TOOLS_DIR / "sync_mission.py"),
            "--source-dir", str(self.source_dir),
            "--data-dir", str(self.output_dir),
            "--mode", "github",
            "--force",
            "--test-mode"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0)
        self.assertIn("SYNC_RESULT=SYNC_SUCCESS", res.stdout)

        # Verify all transmissions in output
        txs = json.loads((self.output_dir / "transmissions.json").read_text())
        ids = {t["id"] for t in txs}
        self.assertIn("LOG-0000", ids)
        self.assertIn("LOG-0001", ids)
        self.assertIn("LOG-0002", ids)

    def test_artifact_freshness_check(self):
        """Artifact freshness warning for stale manifests."""
        from sync_mission import check_artifact_freshness
        from datetime import datetime, timezone, timedelta

        # Old manifest
        old_date = (datetime.now(timezone.utc) - timedelta(hours=72)).strftime("%Y-%m-%dT%H:%M:%SZ")
        manifest_path = self.output_dir / "manifest.json"
        manifest_path.write_text(json.dumps({
            "sync": {
                "last_successful_sync": old_date,
                "content_fingerprint": "old_fp"
            }
        }))

        fresh, warnings = check_artifact_freshness(manifest_path, "test_commit")
        self.assertTrue(fresh)  # Should still be fresh (just warning)
        self.assertTrue(any("stale" in w.lower() for w in warnings))

if __name__ == "__main__":
    unittest.main()