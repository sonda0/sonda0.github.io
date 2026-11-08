export type SubsystemHealth = 'nominal' | 'degraded' | 'critical' | 'offline';

export interface Subsystem {
  id: string;
  category: string;
  name: string;
  narrative_status: string;
  platform_status: string;
  health_level: SubsystemHealth;
  metrics: Record<string, string>;
  details: string;
  epistemic_class: string;
}

export interface SystemsData {
  schema_version: string;
  subsystems: Subsystem[];
}
