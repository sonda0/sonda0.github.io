import { describe, it, expect } from 'vitest';
import {
  isValidIsoDate,
  sanitizeUrl,
  validateMissionData,
  validateManifest,
  validateTransmissionsList,
  validateAnomaliesList,
  validateSystemsData,
  DataValidationError
} from '../src/services/dataValidation';
import { renderMarkdownParagraph, escapeHtml } from '../src/services/transmissionParser';

describe('Data Validation & Epistemic Integrity Tests', () => {
  it('validates ISO 8601 dates correctly', () => {
    expect(isValidIsoDate('2026-11-07T03:00:00Z')).toBe(true);
    expect(isValidIsoDate('2026-11-08T01:05:00+00:00')).toBe(true);
    expect(isValidIsoDate('invalid-date')).toBe(false);
    expect(isValidIsoDate(null)).toBe(false);
    expect(isValidIsoDate(12345)).toBe(false);
  });

  it('sanitizes external URLs and blocks javascript: schemes', () => {
    expect(sanitizeUrl('https://github.com/sonda0/bitacora')).toBe('https://github.com/sonda0/bitacora');
    expect(sanitizeUrl('http://sonda0.online')).toBe('http://sonda0.online');
    expect(sanitizeUrl('/data/manifest.json')).toBe('/data/manifest.json');
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
    expect(sanitizeUrl('')).toBe('#');
  });

  it('validates valid mission data structure', () => {
    const validMission = {
      schema_version: '1.0',
      mission_id: 'SONDA-0',
      protocol_version: 'V3.1-EXODATA',
      carrier_status: 'SIN_PORTADORA',
      carrier_label: 'CONTROL DE MISIÓN: SIN PORTADORA',
      earth_link_state: 'LOSS_OF_SIGNAL',
      earth_link_description: 'Loss of comms',
      last_transmission_id: 'LOG-0022',
      last_transmission_date: '2026-11-08T01:05:00Z',
      last_data_update: '2026-11-08T01:10:00Z',
      known_anomalies_count: 6,
      active_anomalies_count: 3,
      total_transmissions_count: 23,
      telemetry: {
        distance: { label: 'Distancia', value: '169.34 AU', classification: 'ESTIMATED', notes: '' },
        rtg_power: { label: 'RTG', value: '41.71%', classification: 'HISTORICAL', notes: '' },
        transceiver: { label: 'Transceptor', value: 'DEGRADADO', classification: 'MEASURED', notes: '' },
        optical: { label: 'Óptica', value: 'OPERATIVO', classification: 'MEASURED', notes: '' },
        memory_integrity: { label: 'Memoria', value: 'VERIFICADA', classification: 'HISTORICAL', notes: '' }
      },
      investigations: []
    };

    expect(() => validateMissionData(validMission)).not.toThrow();
  });

  it('rejects corrupted or forged mission data', () => {
    expect(() => validateMissionData({ mission_id: 'FAKE-PROBE' })).toThrow(DataValidationError);
    expect(() => validateMissionData(null)).toThrow(DataValidationError);
    expect(() => validateMissionData({ mission_id: 'SONDA-0' })).toThrow(DataValidationError);
  });

  it('validates public manifest data contract', () => {
    const validManifest = {
      schema_version: '1.0',
      project: 'SONDA 0',
      site: 'MISSION-CONTROL',
      domain: 'sonda0.online',
      generated_at: '2026-11-08T01:10:00Z',
      last_valid_transmission: 'LOG-0022',
      data_status: 'SYNCHRONIZED',
      sources: {
        repository: 'https://github.com/sonda0/bitacora',
        official_domain: 'https://sonda0.online',
        youtube: 'https://www.youtube.com/@sonda0.Operator',
        reddit: 'https://www.reddit.com/r/Sonda0/'
      }
    };

    expect(() => validateManifest(validManifest)).not.toThrow();
    expect(() => validateManifest({ project: 'WRONG' })).toThrow(DataValidationError);
  });

  it('validates transmission list integrity', () => {
    const list = [
      { id: 'LOG-0001', title: 'Captura', date: '2026-11-07T03:00:00Z' }
    ];
    expect(() => validateTransmissionsList(list)).not.toThrow();
    expect(() => validateTransmissionsList('not-an-array')).toThrow(DataValidationError);
    expect(() => validateTransmissionsList([{ title: 'No ID' }])).toThrow(DataValidationError);
  });

  it('validates anomaly list integrity', () => {
    const list = [
      { id: 'ANOM-HEX-04', state: 'AWAITING_DATA' }
    ];
    expect(() => validateAnomaliesList(list)).not.toThrow();
    expect(() => validateAnomaliesList([{ id: 'ANOM-1' }])).toThrow(DataValidationError);
  });

  it('sanitizes and parses markdown text safely', () => {
    const raw = '<script>alert(1)</script>**bold text** and [link](https://sonda0.online)';
    const rendered = renderMarkdownParagraph(raw);
    expect(rendered).not.toContain('<script>');
    expect(rendered).toContain('&lt;script&gt;');
    expect(rendered).toContain('<strong class="text-text-main font-semibold">bold text</strong>');
    expect(rendered).toContain('https://sonda0.online');
  });
});
