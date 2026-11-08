import { EpistemicClassification } from './mission';

export interface TransmissionTelemetry {
  id_registro: string;
  distance: string;
  distance_status: EpistemicClassification;
  subsystems_status: string;
  vector?: string | null;
  external_signal?: {
    title: string;
    url: string;
  } | null;
  confidence?: string | null;
}

export interface Transmission {
  id: string;
  log_number: number;
  title: string;
  display_title: string;
  date: string;
  tags: string[];
  version: 'V2.0' | 'V3.0' | 'V3.1' | string;
  summary: string;
  telemetry: TransmissionTelemetry;
  paragraphs: string[];
  github_url: string;
  epistemic_status: string;
}

export interface TransmissionFilterOptions {
  searchQuery: string;
  selectedTag: string | null;
  startDate: string | null;
  endDate: string | null;
  version: string | null;
  sortOrder: 'asc' | 'desc';
}
