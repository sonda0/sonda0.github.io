

/**
 * Tipos de sujeto de la observación
 */
export type SubjectType =
  | 'SONDA_0'              // La nave SONDA 0
  | 'INSTRUMENTO_BORDO'    // Instrumento a bordo de SONDA 0
  | 'OBJETO_ASTRONOMICO'   // Objeto observado (HEX-04, WISE-0001, etc.)
  | 'ANOMALIA'             // Anomalía catalogada
  | 'ENTORNO_INTERESTELAR' // Medio interestelar (ISM, CMB, etc.)
  | 'MAGNITUD_DERIVADA';   // Magnitud calculada matemáticamente

/**
 * Tipo de medición
 */
export type MeasurementType =
  | 'DIRECT'     // Medición instrumental directa
  | 'NARRATED'   // Valor narrado en bitácora (no medición real)
  | 'DERIVED'    // Calculado a partir de otras mediciones/modelos
  | 'ESTIMATED'  // Estimado por modelo físico (decaimiento, propagación)
  | 'HISTORICAL' // Registro histórico sin verificación actual
  | 'UNAVAILABLE'; // Sin dato disponible

/**
 * Tipo de cantidad física (quantity kind)
 */
export type QuantityKind =
  | 'DISTANCE'
  | 'VELOCITY'
  | 'ACCELERATION'
  | 'ANGLE'
  | 'VECTOR'
  | 'STATE'
  | 'TEMPERATURE'
  | 'MAGNETIC_FIELD'
  | 'PARTICLE_FLUX'
  | 'SHIELDING_STATUS'
  | 'OPTICAL_INTEGRITY'
  | 'POWER'
  | 'ENERGY'
  | 'CARRIER_STATUS'
  | 'DATA_RATE'
  | 'LIGHT_TIME'
  | 'MEMORY_INTEGRITY'
  | 'INSTRUMENT_STATUS'
  | 'COMPUTE_ALLOCATION'
  | 'ANTENNA_GAIN'
  | 'ANTENNA_POINTING'
  | 'THERMOCOUPLE_TEMPERATURE';

/**
 * Marco de referencia
 */
export type ReferenceFrame =
  | 'HELIOCENTRIC'
  | 'PROBE_RELATIVE'
  | 'GALACTIC'
  | 'INSTRUMENTAL'
  | 'NONE'
  | 'DERIVED_MODEL';

/**
 * Estados de validez epistemológica extendidos para telemetría de vuelo
 * Basados en SONDA 0 // FLIGHT-TELEMETRY V1.0
 */
export type FlightEpistemicState =
  | 'MEASURED_NARRATIVE'  // Valor narrado en bitácora; NO es medición de nave real
  | 'ESTIMATED'           // Calculado a partir de modelo o decaimiento
  | 'HISTORICAL'          // Registro histórico documentado en LOG
  | 'UNKNOWN'             // Sin información documental
  | 'CONFLICTING'         // Datos contradictorios entre fuentes
  | 'STALE';              // Dato antiguo sin actualización confirmada

export interface FlightTelemetryParameter {
  /** Identificador único del parámetro */
  id: string;
  /** Nombre legible del parámetro */
  name: string;
  /** Valor actual (numérico como string o textual) */
  value: string | number | null;
  /** Unidad de medida (vacío si no aplica) */
  unit: string;
  /** Categoría principal: NAVEGACION | AMBIENTE | ENERGIA | COMUNICACIONES | SISTEMAS */
  category: FlightTelemetryCategory;
  /** Sujeto de la observación (qué entidad posee esta propiedad) */
  subjectId: string;
  /** Tipo de sujeto */
  subjectType: SubjectType;
  /** Tipo de medición */
  measurementType: MeasurementType;
  /** Tipo de cantidad física */
  quantityKind: QuantityKind;
  /** Clasificación epistemológica */
  epistemicState: FlightEpistemicState;
  /** Método de derivación si aplica */
  derivationMethod?: string;
  /** Marco de referencia */
  referenceFrame?: ReferenceFrame;
  /** Fuente documental (ej: LOG-0016, mission.json, anomaly_catalog.json) */
  documentarySource: string;
  /** LOG de procedencia específico */
  provenanceLog: string;
  /** Fecha de observación/registro (ISO 8601) */
  observationDate: string;
  /** Incertidumbre asociada (texto descriptivo o cuantitativo) */
  uncertainty: string;
  /** Evidencia documental textual */
  documentaryEvidence?: string;
  /** Estado de validez actual */
  validityState: 'VALID' | 'STALE' | 'SUPERSEDED' | 'CONFLICTING';
  /** Serie histórica opcional (mínimo 2 puntos comparables y documentados) */
  historicalSeries?: HistoricalDataPoint[];
  /** Notas adicionales */
  notes?: string;
}

export type FlightTelemetryCategory =
  | 'NAVEGACION'
  | 'AMBIENTE'
  | 'ENERGIA'
  | 'COMUNICACIONES'
  | 'SISTEMAS';

export interface HistoricalDataPoint {
  /** Fecha del registro histórico */
  date: string;
  /** Valor en ese momento */
  value: string | number;
  /** Fuente del dato histórico */
  source: string;
  /** Clasificación epistemológica en ese momento */
  epistemicState: FlightEpistemicState;
}

export interface FlightTelemetryCollection {
  /** Versión del esquema */
  schema_version: string;
  /** Timestamp de generación (ISO 8601) */
  generated_at: string;
  /** Commit de origen si aplica */
  source_commit?: string;
  /** Parámetros de telemetría */
  parameters: FlightTelemetryParameter[];
  /** Metadatos de integridad */
  integrity: {
    total_parameters: number;
    measured_narrative_count: number;
    estimated_count: number;
    historical_count: number;
    unknown_count: number;
    conflicting_count: number;
    stale_count: number;
    with_historical_series: number;
  };
}

/**
 * Categorías y parámetros definidos por FLIGHT-TELEMETRY V1.0
 * Solo se incluyen parámetros con sustento documental
 */
export const FLIGHT_TELEMETRY_PARAMETER_DEFINITIONS: Record<string, {
  name: string;
  category: FlightTelemetryCategory;
  unit: string;
  description: string;
}> = {
  // NAVEGACIÓN
  'nav.heliocentric_distance': {
    name: 'Distancia Heliocéntrica',
    category: 'NAVEGACION',
    unit: 'AU',
    description: 'Distancia estimada al Sol basada en modelo orbital congelado'
  },
  'nav.inertial_velocity': {
    name: 'Velocidad Inercial',
    category: 'NAVEGACION',
    unit: 'km/s',
    description: 'Vector de velocidad inercial (NO DETERMINADO sin solución DSN)'
  },
  'nav.acceleration': {
    name: 'Aceleración',
    category: 'NAVEGACION',
    unit: 'm/s²',
    description: 'Aceleración actual de la sonda'
  },
  'nav.chassis_orientation': {
    name: 'Orientación del Chasis',
    category: 'NAVEGACION',
    unit: 'grados',
    description: 'Orientación instrumental del chasis (112° hacia plano galáctico, LOG-0000)'
  },
  'nav.displacement_vector': {
    name: 'Vector de Desplazamiento',
    category: 'NAVEGACION',
    unit: 'vector',
    description: 'Vector de desplazamiento inercial'
  },
  'nav.trajectory_model_status': {
    name: 'Estado del Modelo de Trayectoria',
    category: 'NAVEGACION',
    unit: 'estado',
    description: 'Estado del modelo de propagación orbital'
  },

  // AMBIENTE
  'env.external_temperature': {
    name: 'Temperatura Exterior',
    category: 'AMBIENTE',
    unit: 'K',
    description: 'Temperatura del medio interestelar en la posición de la sonda'
  },
  'env.internal_temperature': {
    name: 'Temperatura Interna',
    category: 'AMBIENTE',
    unit: 'K',
    description: 'Temperatura interna del bus de la sonda'
  },
  'env.instrument_temperature': {
    name: 'Temperatura de Instrumentos',
    category: 'AMBIENTE',
    unit: 'K',
    description: 'Temperatura de los instrumentos científicos'
  },
  'env.radiation': {
    name: 'Radiación',
    category: 'AMBIENTE',
    unit: 'nT / particula/cm²/s',
    description: 'Nivel de radiación detectado por magnetómetro y sensores bolométricos'
  },
  'env.shielding_status': {
    name: 'Estado del Blindaje',
    category: 'AMBIENTE',
    unit: 'estado',
    description: 'Estado de la capa ablativa y blindaje de radiación'
  },

  // ENERGÍA
  'energy.rtg_power': {
    name: 'Potencia Residual RTG',
    category: 'ENERGIA',
    unit: '%',
    description: 'Potencia residual del generador termoeléctrico de radioisótopos'
  },
  'energy.electrical_consumption': {
    name: 'Consumo Eléctrico',
    category: 'ENERGIA',
    unit: 'W',
    description: 'Consumo eléctrico total de la sonda'
  },
  'energy.reserve': {
    name: 'Reserva Energética',
    category: 'ENERGIA',
    unit: '%',
    description: 'Reserva energética disponible'
  },
  'energy.rtg_temperature': {
    name: 'Temperatura RTG',
    category: 'ENERGIA',
    unit: 'K',
    description: 'Temperatura del termopar del RTG'
  },

  // COMUNICACIONES
  'comms.carrier_status': {
    name: 'Estado de Portadora',
    category: 'COMUNICACIONES',
    unit: 'estado',
    description: 'Estado de la portadora de banda X'
  },
  'comms.uplink_rate': {
    name: 'Velocidad del Enlace de Subida',
    category: 'COMUNICACIONES',
    unit: 'bps',
    description: 'Velocidad del enlace ascendente (0 bps sin portadora DSN)'
  },
  'comms.downlink_rate': {
    name: 'Velocidad del Enlace de Bajada',
    category: 'COMUNICACIONES',
    unit: 'bps',
    description: 'Velocidad del enlace descendente'
  },
  'comms.propagation_latency': {
    name: 'Latencia de Propagación Estimada',
    category: 'COMUNICACIONES',
    unit: 's',
    description: 'Latencia estimada de propagación (solo con distancia válida y modelo explícito)'
  },

  // SISTEMAS
  'sys.memory_integrity': {
    name: 'Integridad de Memoria',
    category: 'SISTEMAS',
    unit: 'estado',
    description: 'Estado de integridad de la memoria operativa (MNEMOSYNE-0)'
  },
  'sys.instrument_status': {
    name: 'Estado de Instrumentos',
    category: 'SISTEMAS',
    unit: 'estado',
    description: 'Estado operativo de los instrumentos científicos'
  },
  'sys.compute_availability': {
    name: 'Disponibilidad Computacional',
    category: 'SISTEMAS',
    unit: '%',
    description: 'Ciclos de procesamiento disponibles para misión científica'
  },
  'sys.antenna_orientation': {
    name: 'Orientación de Antena',
    category: 'SISTEMAS',
    unit: 'grados / estado',
    description: 'Orientación y ganancia de la antena HGA'
  },
};

/**
 * Etiquetas legibles para estados epistemológicos
 */
export const EPISTEMIC_STATE_LABELS: Record<FlightEpistemicState, string> = {
  MEASURED_NARRATIVE: 'MEDIDO_NARRATIVO',
  ESTIMATED: 'ESTIMADO',
  HISTORICAL: 'HISTÓRICO',
  UNKNOWN: 'NO DETERMINADO',
  CONFLICTING: 'CONFLICTIVO',
  STALE: 'OBsoleto'
};

/**
 * Etiquetas legibles para categorías
 */
export const CATEGORY_LABELS: Record<FlightTelemetryCategory, string> = {
  NAVEGACION: 'NAVEGACIÓN',
  AMBIENTE: 'AMBIENTE',
  ENERGIA: 'ENERGÍA',
  COMUNICACIONES: 'COMUNICACIONES',
  SISTEMAS: 'SISTEMAS'
};

/**
 * Colores por estado epistemológico (para UI)
 */
export const EPISTEMIC_STATE_COLORS: Record<FlightEpistemicState, string> = {
  MEASURED_NARRATIVE: '#45C9D8',  // cyan-instrument
  ESTIMATED: '#E8AA53',            // amber-warning
  HISTORICAL: '#42C8A2',           // green-operational
  UNKNOWN: '#DC6471',              // red-critical
  CONFLICTING: '#E8AA53',          // amber-warning
  STALE: '#8297A9'                 // text-dim
};

/**
 * Colores por categoría (para UI)
 */
export const CATEGORY_COLORS: Record<FlightTelemetryCategory, string> = {
  NAVEGACION: '#45C9D8',
  AMBIENTE: '#42C8A2',
  ENERGIA: '#E8AA53',
  COMUNICACIONES: '#DC6471',
  SISTEMAS: '#A855F7'
};