import { EpistemicClassification } from './mission';

export type CelestialCategory =
  | 'HISTORICAL_DOCUMENTED'
  | 'NARRATIVE_ESTIMATE'
  | 'UNKNOWN_POSITION'
  | 'ILLUSTRATIVE_BOUNDARY';

export type DistanceOrigin =
  | 'SOLAR_ORIGIN'            // Distancia heliocéntrica
  | 'RELATIVE_TO_PROBE'       // Distancia relativa respecto a SONDA 0
  | 'NOT_APPLICABLE'          // Regiones limítrofes / sin centro único
  | 'UNDETERMINED';           // Posición o distancia desconocida

export interface NavObject {
  id: string;
  name: string;
  category: CelestialCategory;
  type: string;
  distanceValue: string;
  distanceUnit: 'AU' | 'AL' | 'N/A' | 'DESCONOCIDA';
  distanceOrigin: DistanceOrigin;
  epistemicClass: EpistemicClassification;
  uncertaintyStatement: string;
  documentarySource: string;
  lastUpdated: string;
  relatedAnomalyId?: string | null;
  relatedTransmissionId?: string | null;
  description: string;
  color: string;
  // Solo cuando tiene proyección topológica en el mapa conceptual
  hasVisualCoordinates: boolean;
  x?: number;
  y?: number;
  radius?: number;
  // Metadatos científicos
  physicalNotes?: string;
}

export interface NavigationTelemetry {
  currentDistanceAu: string;
  distanceClassification: EpistemicClassification;
  modelStatus: 'MODELO_CONGELADO' | 'RECONSTRUCCION_PENDIENTE' | 'MEDICION_ACTIVA';
  chassisOrientation: string; // Orientación instrumental del chasis (112° hacia plano galáctico, LOG-0000)
  inertialVelocityVector: string; // Vector cinemático de velocidad inercial (NO DETERMINADO / sin solución DSN)
  orbitalFrame: string;
  propagationPolicy: string;
  lastTelemetryLog: string;
  lastTelemetryDate: string;
}

export interface TrajectoryPoint {
  logId: string;
  date: string;
  distanceAu: string;
  classification: EpistemicClassification;
  notes: string;
}
