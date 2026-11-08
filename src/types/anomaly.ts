export type AnomalyState =
  | 'DETECTED'
  | 'UNDER_ANALYSIS'
  | 'AWAITING_DATA'
  | 'HYPOTHESIS_REVISION'
  | 'INCONCLUSIVE'
  | 'RESOLVED'
  | 'ARCHIVED';

export interface Anomaly {
  id: string;
  title: string;
  type: string;
  description: string;
  first_detected: string;
  last_observation: string;
  state: AnomalyState;
  evidence: string[];
  hypotheses: string[];
  uncertainty: string;
  next_observation?: string | null;
  related_logs: string[];
  location?: string | null;
  priority: 'low' | 'medium' | 'high' | string;
  epistemic_status: string;
}
