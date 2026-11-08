import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Integration, Isolation & Security Safety Invariants', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const missionControlDir = path.resolve(__dirname, '..');

  it('confirms EXODATA V3.1 core files are present and untouched', () => {
    const coreFiles = [
      'scripts/editorial_v31.py',
      'scripts/v31_gate.py',
      'scripts/cycle_log.py',
      'scripts/anomaly_catalog.py',
      'scripts/mission_state.json',
      'scripts/anomaly_catalog.json',
      'scripts/cycle_log.json'
    ];

    for (const rel of coreFiles) {
      const fullPath = path.join(rootDir, rel);
      expect(fs.existsSync(fullPath), `Core file must exist: ${rel}`).toBe(true);
    }
  });

  it('confirms AV-001 subsystem (sonda_visual) remains intact', () => {
    const visualDir = path.join(rootDir, 'sonda_visual');
    expect(fs.existsSync(visualDir), 'sonda_visual directory must exist').toBe(true);
  });

  it('confirms COMMS-001 subsystem (sonda_reddit) remains intact', () => {
    const redditDir = path.join(rootDir, 'sonda_reddit');
    expect(fs.existsSync(redditDir), 'sonda_reddit directory must exist').toBe(true);
  });

  it('ensures no secret tokens, credentials or private files exist in public data and src', () => {
    const forbiddenPatterns = [
      /ghp_[A-Za-z0-9_]{30,}/,
      /github_pat_[A-Za-z0-9_]{30,}/,
      /client_secret/,
      /\.github_token/
    ];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(full);
        } else if (entry.isFile()) {
          for (const pat of forbiddenPatterns) {
            expect(entry.name).not.toMatch(pat);
          }
          if (entry.name.endsWith('.json') || entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            const content = fs.readFileSync(full, 'utf-8');
            for (const pat of forbiddenPatterns) {
              expect(content).not.toMatch(pat);
            }
          }
        }
      }
    }

    scanDir(path.join(missionControlDir, 'src'));
    scanDir(path.join(missionControlDir, 'public', 'data'));
  });
});
