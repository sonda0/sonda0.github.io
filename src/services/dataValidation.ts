import { MissionState, ManifestData } from '../types/mission';
import { Transmission } from '../types/transmission';
import { Anomaly } from '../types/anomaly';
import { SystemsData } from '../types/systems';

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataValidationError';
  }
}

export function isValidIsoDate(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export function sanitizeUrl(urlStr: unknown): string {
  if (typeof urlStr !== 'string') return '#';
  const trimmed = urlStr.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return '#';
}

export function validateMissionData(data: unknown): MissionState {
  if (!data || typeof data !== 'object') {
    throw new DataValidationError('Invalid mission data: root must be an object');
  }
  const m = data as Partial<MissionState>;
  if (!m.mission_id || m.mission_id !== 'SONDA-0') {
    throw new DataValidationError('Invalid mission data: mission_id mismatch');
  }
  if (!m.telemetry || typeof m.telemetry !== 'object') {
    throw new DataValidationError('Invalid mission data: missing telemetry block');
  }
  return data as MissionState;
}

export function validateManifest(data: unknown): ManifestData {
  if (!data || typeof data !== 'object') {
    throw new DataValidationError('Invalid manifest data: root must be an object');
  }
  const m = data as Partial<ManifestData>;
  if (m.project !== 'SONDA 0' || m.domain !== 'sonda0.online') {
    throw new DataValidationError('Invalid manifest data: project or domain mismatch');
  }
  return data as ManifestData;
}

export function validateTransmissionsList(data: unknown): Transmission[] {
  if (!Array.isArray(data)) {
    throw new DataValidationError('Invalid transmissions data: expected array');
  }
  for (const item of data) {
    if (!item.id || typeof item.title !== 'string') {
      throw new DataValidationError(`Invalid transmission item: missing id or title in ${JSON.stringify(item)}`);
    }
  }
  return data as Transmission[];
}

export function validateAnomaliesList(data: unknown): Anomaly[] {
  if (!Array.isArray(data)) {
    throw new DataValidationError('Invalid anomalies data: expected array');
  }
  for (const item of data) {
    if (!item.id || !item.state) {
      throw new DataValidationError(`Invalid anomaly item: missing id or state`);
    }
  }
  return data as Anomaly[];
}

export function validateSystemsData(data: unknown): SystemsData {
  if (!data || typeof data !== 'object') {
    throw new DataValidationError('Invalid systems data: root must be an object');
  }
  const s = data as Partial<SystemsData>;
  if (!Array.isArray(s.subsystems)) {
    throw new DataValidationError('Invalid systems data: subsystems must be an array');
  }
  return data as SystemsData;
}
