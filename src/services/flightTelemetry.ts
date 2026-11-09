import { FlightTelemetryParameter, FlightTelemetryCollection, FlightTelemetryCategory, FlightEpistemicState, SubjectType, MeasurementType, QuantityKind, ReferenceFrame } from '../types/flightTelemetry';

const CACHE_KEY = 'flight-telemetry-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let memoryCache: FlightTelemetryCollection | null = null;
let cacheTimestamp = 0;

/**
 * Carga flight-telemetry.json con caché en memoria y localStorage
 */
export async function loadFlightTelemetry(): Promise<FlightTelemetryCollection | null> {
  const now = Date.now();
  
  // 1. Memoria
  if (memoryCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return memoryCache;
  }
  
  // 2. localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (now - timestamp < CACHE_DURATION) {
        memoryCache = data;
        cacheTimestamp = timestamp;
        return data;
      }
    }
  } catch {
    // Ignorar errores de localStorage
  }
  
  // 3. Fetch desde servidor
  try {
    const response = await fetch('/data/flight-telemetry.json', {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    memoryCache = data;
    cacheTimestamp = now;
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: now }));
    } catch {
      // Ignorar errores de escritura
    }
    
    return data;
  } catch (error) {
    console.error('[FlightTelemetry] Error cargando telemetría:', error);
    return memoryCache; // Devolver caché vencido como último recurso
  }
}

/**
 * Obtiene parámetros filtrados por categoría
 */
export function getParametersByCategory(
  collection: FlightTelemetryCollection | null,
  category: FlightTelemetryCategory
): FlightTelemetryParameter[] {
  if (!collection) return [];
  return collection.parameters.filter(p => p.category === category);
}

/**
 * Obtiene un parámetro por ID
 */
export function getParameterById(
  collection: FlightTelemetryCollection | null,
  id: string
): FlightTelemetryParameter | undefined {
  if (!collection) return undefined;
  return collection.parameters.find(p => p.id === id);
}

/**
 * Obtiene los 6 indicadores clave para el resumen del Dashboard
 * Selecciona uno representativo por categoría + 1 extra
 */
export function getDashboardSummaryParameters(
  collection: FlightTelemetryCollection | null
): FlightTelemetryParameter[] {
  if (!collection) return [];
  
  const priorityParams = [
    'nav.heliocentric_distance',       // NAVEGACION
    'energy.rtg_power',                // ENERGIA
    'comms.carrier_status',            // COMUNICACIONES
    'sys.memory_integrity',            // SISTEMAS
    'env.magnetic_field',              // AMBIENTE (antes radiation)
    'nav.trajectory_model_status'      // NAVEGACION (estado modelo)
  ];
  
  return priorityParams
    .map(id => getParameterById(collection, id))
    .filter((p): p is FlightTelemetryParameter => p !== undefined);
}

/**
 * Verifica si un parámetro tiene serie histórica válida (≥2 puntos)
 */
export function hasValidHistoricalSeries(param: FlightTelemetryParameter): boolean {
  return !!(
    param.historicalSeries &&
    param.historicalSeries.length >= 2 &&
    param.historicalSeries.some(p => p.value !== 'NO DETERMINADO' && p.value !== null)
  );
}

/**
 * Formatea un valor para visualización
 */
export function formatParameterValue(param: FlightTelemetryParameter): string {
  if (param.value === null || param.value === undefined) {
    return 'NO DETERMINADO';
  }
  if (typeof param.value === 'number') {
    return param.value.toString();
  }
  return param.value;
}

/**
 * Obtiene el color del estado epistémico
 */
export function getEpistemicStateColor(state: FlightEpistemicState): string {
  const colors: Record<FlightEpistemicState, string> = {
    MEASURED_NARRATIVE: '#45C9D8',
    ESTIMATED: '#E8AA53',
    HISTORICAL: '#42C8A2',
    UNKNOWN: '#DC6471',
    CONFLICTING: '#E8AA53',
    STALE: '#8297A9'
  };
  return colors[state] || '#8297A9';
}

/**
 * Obtiene el color de la categoría
 */
export function getCategoryColor(category: FlightTelemetryCategory): string {
  const colors: Record<FlightTelemetryCategory, string> = {
    NAVEGACION: '#45C9D8',
    AMBIENTE: '#42C8A2',
    ENERGIA: '#E8AA53',
    COMUNICACIONES: '#DC6471',
    SISTEMAS: '#A855F7'
  };
  return colors[category] || '#8297A9';
}

/**
 * Etiqueta legible del estado epistémico
 */
export function getEpistemicStateLabel(state: FlightEpistemicState): string {
  const labels: Record<FlightEpistemicState, string> = {
    MEASURED_NARRATIVE: 'MEDIDO_NARRATIVO',
    ESTIMATED: 'ESTIMADO',
    HISTORICAL: 'HISTÓRICO',
    UNKNOWN: 'NO DETERMINADO',
    CONFLICTING: 'CONFLICTIVO',
    STALE: 'OBSOLETO'
  };
  return labels[state] || state;
}

/**
 * Etiqueta legible de la categoría
 */
export function getCategoryLabel(category: FlightTelemetryCategory): string {
  const labels: Record<FlightTelemetryCategory, string> = {
    NAVEGACION: 'NAVEGACIÓN',
    AMBIENTE: 'AMBIENTE',
    ENERGIA: 'ENERGÍA',
    COMUNICACIONES: 'COMUNICACIONES',
    SISTEMAS: 'SISTEMAS'
  };
  return labels[category] || category;
}

/**
 * Etiqueta legible del tipo de sujeto
 */
export function getSubjectTypeLabel(type: SubjectType): string {
  const labels: Record<SubjectType, string> = {
    SONDA_0: 'SONDA 0',
    INSTRUMENTO_BORDO: 'INSTRUMENTO A BORDO',
    OBJETO_ASTRONOMICO: 'OBJETO ASTRONÓMICO',
    ANOMALIA: 'ANOMALÍA',
    ENTORNO_INTERESTELAR: 'ENTORNO INTERESTELAR',
    MAGNITUD_DERIVADA: 'MAGNITUD DERIVADA'
  };
  return labels[type] || type;
}

/**
 * Etiqueta legible del tipo de medición
 */
export function getMeasurementTypeLabel(type: MeasurementType): string {
  const labels: Record<MeasurementType, string> = {
    DIRECT: 'DIRECTA',
    NARRATED: 'NARRADA',
    DERIVED: 'DERIVADA',
    ESTIMATED: 'ESTIMADA',
    HISTORICAL: 'HISTÓRICA',
    UNAVAILABLE: 'NO DISPONIBLE'
  };
  return labels[type] || type;
}

/**
 * Etiqueta legible del tipo de cantidad
 */
export function getQuantityKindLabel(kind: QuantityKind): string {
  const labels: Record<QuantityKind, string> = {
    DISTANCE: 'DISTANCIA',
    VELOCITY: 'VELOCIDAD',
    ACCELERATION: 'ACELERACIÓN',
    ANGLE: 'ÁNGULO',
    VECTOR: 'VECTOR',
    STATE: 'ESTADO',
    TEMPERATURE: 'TEMPERATURA',
    MAGNETIC_FIELD: 'CAMPO MAGNÉTICO',
    PARTICLE_FLUX: 'FLUJO DE PARTÍCULAS',
    SHIELDING_STATUS: 'ESTADO BLINDAJE',
    OPTICAL_INTEGRITY: 'INTEGRIDAD ÓPTICA',
    POWER: 'POTENCIA',
    ENERGY: 'ENERGÍA',
    CARRIER_STATUS: 'ESTADO PORTADORA',
    DATA_RATE: 'VELOCIDAD DATOS',
    LIGHT_TIME: 'TIEMPO LUZ',
    MEMORY_INTEGRITY: 'INTEGRIDAD MEMORIA',
    INSTRUMENT_STATUS: 'ESTADO INSTRUMENTOS',
    COMPUTE_ALLOCATION: 'ASIGNACIÓN CÓMPUTO',
    ANTENNA_GAIN: 'GANANCIA ANTENA',
    ANTENNA_POINTING: 'APUNTADO ANTENA',
    THERMOCOUPLE_TEMPERATURE: 'TEMPERATURA TERMOPAR'
  };
  return labels[kind] || kind;
}

/**
 * Etiqueta legible del marco de referencia
 */
export function getReferenceFrameLabel(frame: ReferenceFrame): string {
  const labels: Record<ReferenceFrame, string> = {
    HELIOCENTRIC: 'HELIOCÉNTRICO',
    PROBE_RELATIVE: 'RELATIVO A SONDA',
    GALACTIC: 'GALÁCTICO',
    INSTRUMENTAL: 'INSTRUMENTAL',
    NONE: 'N/A',
    DERIVED_MODEL: 'MODELO DERIVADO'
  };
  return labels[frame] || frame;
}