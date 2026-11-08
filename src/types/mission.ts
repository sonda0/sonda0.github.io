export type EpistemicClassification = 'MEASURED' | 'ESTIMATED' | 'HISTORICAL' | 'UNKNOWN';

export interface TelemetryItem {
  label: string;
  value: string;
  classification: EpistemicClassification;
  notes: string;
}

export interface ActiveInvestigation {
  id: string;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  summary: string;
}

export interface MissionState {
  schema_version: string;
  mission_id: string;
  protocol_version: string;
  carrier_status: 'SIN_PORTADORA' | 'ONLINE';
  carrier_label: string;
  earth_link_state: 'LOSS_OF_SIGNAL' | 'CONNECTED';
  earth_link_description: string;
  last_transmission_id: string;
  last_transmission_date: string;
  last_data_update: string;
  known_anomalies_count: number;
  active_anomalies_count: number;
  total_transmissions_count: number;
  subsystem_summary?: string;
  telemetry: {
    distance: TelemetryItem;
    rtg_power: TelemetryItem;
    transceiver: TelemetryItem;
    optical: TelemetryItem;
    memory_integrity: TelemetryItem;
    [key: string]: TelemetryItem;
  };
  investigations: ActiveInvestigation[];
}

export interface AnomalyExportMetadata {
  source: string;
  exporter_version: string;
  content_fingerprint?: string | null;
  exported_at?: string | null;
  last_validated_at: string;
  status: 'SYNCHRONIZED' | 'STALE' | 'UNAVAILABLE' | 'VALIDATION_FAILED' | string;
  count: number;
}

export interface ManifestData {
  schema_version: string;
  project: string;
  site: string;
  domain: string;
  generated_at: string;
  last_valid_transmission: string;
  data_status: string;
  stats?: {
    transmissions_count: number;
    anomalies_count: number;
  };
  sources: {
    repository: string;
    official_domain: string;
    youtube: string;
    reddit: string;
  };
  anomaly_export?: AnomalyExportMetadata;
  sync?: {
    version: string;
    source_repository: string;
    source_branch: string;
    source_commit?: string | null;
    content_fingerprint?: string | null;
    last_successful_sync: string;
    status: string;
    transmissions_count: number;
    anomalies_status: 'SYNCHRONIZED' | 'STALE' | string;
  };
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category: string;
  summary: string;
  source: string;
  epistemic_status: string;
}
