import { NavObject, TrajectoryPoint, NavigationTelemetry, CelestialCategory } from '../types/navigation';
import { Anomaly } from '../types/anomaly';
import { Transmission } from '../types/transmission';
import { MissionState, EpistemicClassification } from '../types/mission';

/**
 * Builds the canonical catalog of navigation objects adhering to NAVIGATION-CONTROL V2.0:
 * Separates explicitly:
 * A. HISTORICAL_DOCUMENTED (Sol, puntos con telemetría histórica documentada)
 * B. NARRATIVE_ESTIMATE (SONDA 0 modelo congelado, WISE-0001, HEX-04 separadas)
 * C. UNKNOWN_POSITION (Anomalías sin coordenadas verificadas, paneles laterales)
 * D. ILLUSTRATIVE_BOUNDARY (Fronteras heliosféricas no esféricas)
 */
export function buildNavigationObjects(anomalies: Anomaly[]): NavObject[] {
  // Map of known localized objects
  const localizedObjects: NavObject[] = [
    {
      id: 'NAV-SOL',
      name: 'El Sol (Sol Central)',
      category: 'HISTORICAL_DOCUMENTED',
      type: 'Estrella G2V (Origen)',
      distanceValue: '0.00',
      distanceUnit: 'AU',
      distanceOrigin: 'SOLAR_ORIGIN',
      epistemicClass: 'HISTORICAL',
      uncertaintyStatement: 'Coordenadas heliocéntricas canónicas de origen. Enlace DSN perdido.',
      documentarySource: 'LOG-0000-GENESIS / Archivo de Vuelo ROM',
      lastUpdated: '2026-11-06T04:12:09Z',
      description: 'Punto de partida de la misión SONDA 0. Ausencia absoluta de portadora artificial detectada hace más de 4,200 ciclos orbitales.',
      color: '#F4D06F',
      hasVisualCoordinates: true,
      x: 180,
      y: 300,
      radius: 9,
      physicalNotes: 'Masa: 1 M☉, tipo espectral G2V, referencia de reposo heliocéntrico.'
    },
    {
      id: 'NAV-KUIPER',
      name: 'Cinturón de Kuiper',
      category: 'ILLUSTRATIVE_BOUNDARY',
      type: 'Región Trans-Neptuniana de Cuerpos Menores',
      distanceValue: '30 - 50',
      distanceUnit: 'AU',
      distanceOrigin: 'SOLAR_ORIGIN',
      epistemicClass: 'HISTORICAL',
      uncertaintyStatement: 'Región toroidal toroidal difusa, no es una frontera esférica discreta.',
      documentarySource: 'Catálogo Astronómico Solar',
      lastUpdated: '2026-11-06T04:12:09Z',
      description: 'Zona de restos planetarios de hielo y roca. Superada en fases tempranas de escape por la sonda.',
      color: '#506677',
      hasVisualCoordinates: true,
      x: 290,
      y: 300,
      radius: 4,
      physicalNotes: 'Extensión radial estimada entre 30 y 50 AU desde el baricentro solar.'
    },
    {
      id: 'NAV-TERMINATION-SHOCK',
      name: 'Choque de Terminación',
      category: 'ILLUSTRATIVE_BOUNDARY',
      type: 'Frontera Heliosférica Dinámica',
      distanceValue: '~94',
      distanceUnit: 'AU',
      distanceOrigin: 'SOLAR_ORIGIN',
      epistemicClass: 'ESTIMATED',
      uncertaintyStatement: 'Frontera asimétrica modulada por ciclos solares de 11 años y presión del viento solar.',
      documentarySource: 'LOG-0000 / Telemetría Histórica',
      lastUpdated: '2026-11-06T04:12:09Z',
      description: 'Discontinuidad donde el viento solar supersónico desacelera a régimen subsónico frente al medio interestelar.',
      color: '#45C9D8',
      hasVisualCoordinates: true,
      x: 430,
      y: 300,
      radius: 3,
      physicalNotes: 'Borde de choque superado antes del corte de comunicaciones.'
    },
    {
      id: 'NAV-HELIOPAUSE',
      name: 'Heliopausa',
      category: 'ILLUSTRATIVE_BOUNDARY',
      type: 'Frontera de la Magnetosfera Solar',
      distanceValue: '~120',
      distanceUnit: 'AU',
      distanceOrigin: 'SOLAR_ORIGIN',
      epistemicClass: 'ESTIMATED',
      uncertaintyStatement: 'Espesor y contorno dependientes de la presión del medio interestelar local.',
      documentarySource: 'LOG-0000 / Medición In situ',
      lastUpdated: '2026-11-06T04:12:09Z',
      description: 'Límite exterior de la heliosfera donde la presión del plasma solar se equilibra con el plasma interestelar.',
      color: '#42C8A2',
      hasVisualCoordinates: true,
      x: 530,
      y: 300,
      radius: 3,
      physicalNotes: 'Transición al medio interestelar superada en deriva inercial.'
    },
    {
      id: 'NAV-SONDA-0',
      name: 'SONDA 0 (Modelo Orbital Congelado)',
      category: 'NARRATIVE_ESTIMATE',
      type: 'Vehículo Autónomo en Escape Heliosférico',
      distanceValue: '169.34',
      distanceUnit: 'AU',
      distanceOrigin: 'SOLAR_ORIGIN',
      epistemicClass: 'ESTIMATED',
      uncertaintyStatement: 'DISTANCIA CONGELADA DESDE LOG-0016: Sin solución orbital verificada ni telemetría terrestre. No se extrapola avance.',
      documentarySource: 'LOG-0016 a LOG-0039 / mission_state.json',
      lastUpdated: '2026-11-08T18:05:00Z',
      description: 'Vehículo interestelar autónomo. Tras LOG-0016 la propagación orbital automática se congeló por protocolo EXODATA V3.1.',
      color: '#45C9D8',
      hasVisualCoordinates: true,
      x: 680,
      y: 260,
      radius: 7,
      physicalNotes: 'Orientación instrumental de chasis: 112° hacia el plano galáctico exterior (LOG-0000 / README). Vector de velocidad inercial: NO DETERMINADO (Sin solución DSN).'
    },
    {
      id: 'NAV-WISE-0001',
      name: 'Enana Marrón WISE-0001',
      category: 'NARRATIVE_ESTIMATE',
      type: 'Astro Subestelar Frío (Enana Y/T)',
      distanceValue: '~0.04 AL (~2,500 AU)',
      distanceUnit: 'AL',
      distanceOrigin: 'RELATIVE_TO_PROBE',
      epistemicClass: 'ESTIMATED',
      uncertaintyStatement: 'Distancia relativa declarada desde la trayectoria de la sonda en LOG-0001; no es distancia al Sol.',
      documentarySource: 'LOG-0001 / Archivo de Vuelo',
      lastUpdated: '2026-11-07T03:00:00Z',
      description: 'Cuerpo subestelar frío de masa subestelar en torno al cual se detectó la órbita del objeto hexagonal HEX-04.',
      color: '#C49A45',
      hasVisualCoordinates: true,
      x: 840,
      y: 190,
      radius: 6,
      physicalNotes: 'Temperatura efectiva extremadamente baja. Actúa como centro gravitatorio local del monolito HEX-04.'
    },
    {
      id: 'NAV-HEX-04',
      name: 'Objeto Hexagonal HEX-04',
      category: 'NARRATIVE_ESTIMATE',
      type: 'Megaestructura Resonante (Anomalía)',
      distanceValue: '0.04 AL (Relativa a la sonda)',
      distanceUnit: 'AL',
      distanceOrigin: 'RELATIVE_TO_PROBE',
      epistemicClass: 'UNKNOWN',
      uncertaintyStatement: 'Masa, longitud de arista (14.8 km) y emisión en 1420 MHz proceden de un único informe no replicado. Período orbital no confirmado (los 73.004 s corresponden a emisión electromagnética y compresión magnética, no a órbita).',
      documentarySource: 'LOG-0001 // ANOM-HEX-04',
      lastUpdated: '2026-11-07T03:00:00Z',
      relatedAnomalyId: 'ANOM-HEX-04',
      relatedTransmissionId: 'LOG-0001',
      description: 'Monolito de 14.8 km de longitud de arista (afirmación narrativa no confirmada independientemente) en órbita alrededor de WISE-0001 (período orbital no determinado). Presenta emisión monocromática en 1420.405 MHz y compresión magnética periódica cada 73.004 s.',
      color: '#E8AA53',
      hasVisualCoordinates: true,
      x: 855,
      y: 175,
      radius: 4,
      physicalNotes: 'Superficie fractal de nanotubos de boro y osmio. Cavidad resonante de microondas. Periodicidad instrumental: pulsos de 73.004 s (no confundir con período orbital).'
    }
  ];

  // Anomalies with unknown coordinates to be mapped to the UNKNOWN_POSITION panel
  const unknownPositionAnomalies: NavObject[] = anomalies
    .filter(a => a.id !== 'ANOM-HEX-04') // HEX-04 is localized next to WISE-0001
    .map(a => {
      let desc = a.description;
      let docSource = a.first_detected || 'Archivo de Bitácora';
      if (a.related_logs && a.related_logs.length > 0) {
        docSource = a.related_logs.join(', ');
      }

      return {
        id: `NAV-${a.id}`,
        name: a.title,
        category: 'UNKNOWN_POSITION' as CelestialCategory,
        type: `Anomalía: ${a.type.replace(/_/g, ' ')}`,
        distanceValue: 'NO DETERMINADA',
        distanceUnit: 'DESCONOCIDA' as const,
        distanceOrigin: 'UNDETERMINED' as const,
        epistemicClass: 'UNKNOWN' as EpistemicClassification,
        uncertaintyStatement: a.uncertainty || 'Sin coordenadas vectoriales o distancia física verificable.',
        documentarySource: docSource,
        lastUpdated: a.last_observation || a.first_detected,
        relatedAnomalyId: a.id,
        relatedTransmissionId: a.related_logs && a.related_logs.length > 0 ? a.related_logs[0] : null,
        description: desc,
        color: '#DC6471',
        hasVisualCoordinates: false,
        physicalNotes: a.location || 'Medio interestelar o memoria interna.'
      };
    });

  return [...localizedObjects, ...unknownPositionAnomalies];
}

/**
 * Builds chronological trajectory progression from transmissions.
 * Strictly adheres to verified log values without interpolating fictional steps.
 */
export function buildTrajectoryProgression(transmissions: Transmission[]): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const seenDistances = new Set<string>();

  for (const t of transmissions) {
    const dist = t.telemetry?.distance;
    const cl = t.telemetry?.distance_status || 'UNKNOWN';
    if (!dist) continue;

    // Extract numerical AU if present
    const match = dist.match(/([0-9]+\.[0-9]+)\s*AU/i);
    const cleanVal = match ? `${match[1]} AU` : dist;

    // Only record when there is a documented transition or notable checkpoint
    if (!seenDistances.has(cleanVal) || t.log_number === 0 || t.log_number === 15 || t.log_number === 16 || t.log_number === transmissions.length - 1) {
      seenDistances.add(cleanVal);
      points.push({
        logId: t.id,
        date: t.date,
        distanceAu: cleanVal,
        classification: cl,
        notes: t.telemetry?.subsystems_status || t.display_title || 'Registro de vuelo'
      });
    }
  }

  return points;
}

/**
 * Extracts consolidated navigation telemetry from mission state
 */
export function extractNavigationTelemetry(mission: MissionState | null): NavigationTelemetry {
  if (!mission) {
    return {
      currentDistanceAu: '169.34 AU',
      distanceClassification: 'ESTIMATED',
      modelStatus: 'MODELO_CONGELADO',
      chassisOrientation: '112° hacia plano galáctico (LOG-0000)',
      inertialVelocityVector: 'NO DETERMINADO (Sin solución DSN)',
      orbitalFrame: 'Heliocéntrico (No confirmado por DSN)',
      propagationPolicy: 'Congelada tras LOG-0016 / AUTOCODE-0',
      lastTelemetryLog: 'LOG-0039',
      lastTelemetryDate: '2026-11-08T18:05:00Z'
    };
  }

  const distItem = mission.telemetry?.distance;
  return {
    currentDistanceAu: distItem?.value || '169.34 AU',
    distanceClassification: distItem?.classification || 'ESTIMATED',
    modelStatus: 'MODELO_CONGELADO',
    chassisOrientation: '112° hacia plano galáctico (LOG-0000)',
    inertialVelocityVector: 'NO DETERMINADO (Sin solución DSN)',
    orbitalFrame: 'Heliocéntrico inercial (Sin solución DSN)',
    propagationPolicy: 'Congelada en 169.34 AU pendiente de validación física',
    lastTelemetryLog: mission.last_transmission_id || 'LOG-0039',
    lastTelemetryDate: mission.last_transmission_date || '2026-11-08T18:05:00Z'
  };
}
