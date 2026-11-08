import { MissionState, ManifestData, TimelineEvent } from '../types/mission';
import { Transmission } from '../types/transmission';
import { Anomaly } from '../types/anomaly';
import { SystemsData } from '../types/systems';
import {
  validateMissionData,
  validateManifest,
  validateTransmissionsList,
  validateAnomaliesList,
  validateSystemsData
} from './dataValidation';

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '') + '/data/';

// In-memory cache
let cachedManifest: ManifestData | null = null;
let cachedMission: MissionState | null = null;
let cachedTransmissions: Transmission[] | null = null;
let cachedAnomalies: Anomaly[] | null = null;
let cachedSystems: SystemsData | null = null;
let cachedTimeline: TimelineEvent[] | null = null;

async function fetchJson<T>(filename: string): Promise<T> {
  const url = `${BASE_URL}${filename}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Error fetching ${filename}: HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as T;
}

export async function getManifest(): Promise<ManifestData> {
  if (cachedManifest) return cachedManifest;
  const raw = await fetchJson<unknown>('manifest.json');
  cachedManifest = validateManifest(raw);
  return cachedManifest;
}

export async function getMission(): Promise<MissionState> {
  if (cachedMission) return cachedMission;
  const raw = await fetchJson<unknown>('mission.json');
  cachedMission = validateMissionData(raw);
  return cachedMission;
}

export async function getTransmissions(): Promise<Transmission[]> {
  if (cachedTransmissions) return cachedTransmissions;
  const raw = await fetchJson<unknown>('transmissions.json');
  cachedTransmissions = validateTransmissionsList(raw);
  return cachedTransmissions;
}

export async function getTransmissionById(id: string): Promise<Transmission | null> {
  const list = await getTransmissions();
  const found = list.find((t) => t.id.toUpperCase() === id.toUpperCase());
  return found || null;
}

export async function getAnomalies(): Promise<Anomaly[]> {
  if (cachedAnomalies) return cachedAnomalies;
  const raw = await fetchJson<unknown>('anomalies.json');
  cachedAnomalies = validateAnomaliesList(raw);
  return cachedAnomalies;
}

export async function getAnomalyById(id: string): Promise<Anomaly | null> {
  const list = await getAnomalies();
  const found = list.find((a) => a.id.toUpperCase() === id.toUpperCase());
  return found || null;
}

export async function getSystems(): Promise<SystemsData> {
  if (cachedSystems) return cachedSystems;
  const raw = await fetchJson<unknown>('systems.json');
  cachedSystems = validateSystemsData(raw);
  return cachedSystems;
}

export async function getTimeline(): Promise<TimelineEvent[]> {
  if (cachedTimeline) return cachedTimeline;
  const raw = await fetchJson<TimelineEvent[]>('timeline.json');
  cachedTimeline = raw;
  return cachedTimeline;
}

export function clearDataCache(): void {
  cachedManifest = null;
  cachedMission = null;
  cachedTransmissions = null;
  cachedAnomalies = null;
  cachedSystems = null;
  cachedTimeline = null;
}

export interface UpdateCheckResult {
  hasUpdates: boolean;
  currentFingerprint?: string | null;
  newFingerprint?: string | null;
}

/**
 * Checks for manifest changes in the background without clearing the active data cache.
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  try {
    const currentFingerprint = cachedManifest?.sync?.content_fingerprint;
    const raw = await fetchJson<unknown>('manifest.json');
    const freshManifest = validateManifest(raw);
    const newFingerprint = freshManifest.sync?.content_fingerprint;

    const hasUpdates = Boolean(
      currentFingerprint &&
      newFingerprint &&
      currentFingerprint !== newFingerprint
    );

    return {
      hasUpdates,
      currentFingerprint,
      newFingerprint
    };
  } catch (err) {
    console.warn('[MISSION-DATA] Background update check failed:', err);
    return { hasUpdates: false };
  }
}

/**
 * Flushes cache and reloads all datasets in-memory for seamless live UI update.
 */
export async function refreshAllData(): Promise<{
  mission: MissionState;
  manifest: ManifestData;
  transmissions: Transmission[];
  anomalies: Anomaly[];
  systems: SystemsData;
  timeline: TimelineEvent[];
}> {
  clearDataCache();
  const [mission, manifest, transmissions, anomalies, systems, timeline] = await Promise.all([
    getMission(),
    getManifest(),
    getTransmissions(),
    getAnomalies(),
    getSystems(),
    getTimeline()
  ]);

  return {
    mission,
    manifest,
    transmissions,
    anomalies,
    systems,
    timeline
  };
}
