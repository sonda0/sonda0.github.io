import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../src/components/Navigation';
import { Transmissions } from '../src/pages/Transmissions';
import { Anomalies } from '../src/pages/Anomalies';
import { NavigationMap } from '../src/pages/NavigationMap';
import {
  buildNavigationObjects,
  buildTrajectoryProgression,
  extractNavigationTelemetry
} from '../src/services/navigationData';
import { Anomaly } from '../src/types/anomaly';
import { Transmission } from '../src/types/transmission';
import { MissionState } from '../src/types/mission';

describe('Navigation and Search Interaction Tests', () => {
  it('renders all main navigation tabs and handles route changes', () => {
    const onNavigate = vi.fn();
    render(<Navigation currentPath="/" onNavigate={onNavigate} />);

    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.getByText('TRANSMISIONES')).toBeInTheDocument();
    expect(screen.getByText('ANOMALÍAS')).toBeInTheDocument();
    expect(screen.getByText('CARTOGRAFÍA')).toBeInTheDocument();
    expect(screen.getByText('SISTEMAS')).toBeInTheDocument();
    expect(screen.getByText('COMUNICACIONES')).toBeInTheDocument();
    expect(screen.getByText('ACERCA DE')).toBeInTheDocument();

    fireEvent.click(screen.getByText('TRANSMISIONES'));
    expect(onNavigate).toHaveBeenCalledWith('/transmisiones');

    fireEvent.click(screen.getByText('CARTOGRAFÍA'));
    expect(onNavigate).toHaveBeenCalledWith('/navegacion');
  });

  it('filters transmissions by search text', () => {
    const onSelect = vi.fn();
    const transmissions = [
      {
        id: 'LOG-0001',
        log_number: 1,
        title: 'LOG-0001: Captura Interferométrica de HEX-04',
        display_title: 'Captura Interferométrica de HEX-04',
        date: '2026-11-07T03:00:00Z',
        tags: ['astrofísica', 'hex-04'],
        version: 'V2.0',
        summary: 'Fijación de la firma espectral del objeto HEX-04.',
        telemetry: {
          id_registro: 'LOG-0001',
          distance: '165.14 AU',
          distance_status: 'HISTORICAL' as const,
          subsystems_status: 'Nominal'
        },
        paragraphs: ['Texto 1'],
        github_url: 'https://github.com/sonda0/bitacora',
        epistemic_status: 'archive'
      },
      {
        id: 'LOG-0022',
        log_number: 22,
        title: 'LOG-0022: Controladores y trayectorias',
        display_title: 'Controladores y trayectorias',
        date: '2026-11-08T01:05:00Z',
        tags: ['robotica'],
        version: 'V3.1',
        summary: 'Evaluación de algoritmos de actualización secuencial.',
        telemetry: {
          id_registro: 'LOG-0022',
          distance: '169.34 AU',
          distance_status: 'ESTIMATED' as const,
          subsystems_status: 'RTG degradado'
        },
        paragraphs: ['Texto 2'],
        github_url: 'https://github.com/sonda0/bitacora',
        epistemic_status: 'archive'
      }
    ];

    render(<Transmissions transmissions={transmissions} onSelect={onSelect} />);

    expect(screen.getByText('Captura Interferométrica de HEX-04')).toBeInTheDocument();
    expect(screen.getByText('Controladores y trayectorias')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Buscar por ID/i);
    fireEvent.change(searchInput, { target: { value: 'HEX-04' } });

    expect(screen.getByText('Captura Interferométrica de HEX-04')).toBeInTheDocument();
    expect(screen.queryByText('Controladores y trayectorias')).not.toBeInTheDocument();
  });

  it('filters anomalies by state dropdown', () => {
    const onSelect = vi.fn();
    const anomalies = [
      {
        id: 'ANOM-HEX-04',
        title: 'Objeto Hexagonal HEX-04',
        type: 'objeto_geometrico',
        description: 'Monolito hexagonal.',
        first_detected: 'LOG-0000',
        last_observation: 'LOG-0001',
        state: 'AWAITING_DATA' as const,
        evidence: ['1420 MHz'],
        hypotheses: [],
        uncertainty: 'Único registro.',
        related_logs: ['LOG-0001'],
        priority: 'high',
        epistemic_status: 'review'
      },
      {
        id: 'ANOM-SYS-0001',
        title: 'Divergencia de Memoria',
        type: 'integridad',
        description: 'Discrepancia en checksums.',
        first_detected: 'LOG-0016',
        last_observation: 'LOG-0016',
        state: 'ARCHIVED' as const,
        evidence: ['LOG-0016'],
        hypotheses: [],
        uncertainty: 'Contenida.',
        related_logs: ['LOG-0016'],
        priority: 'low',
        epistemic_status: 'review'
      }
    ];

    render(<Anomalies anomalies={anomalies} onSelect={onSelect} />);

    expect(screen.getByText('ANOM-HEX-04')).toBeInTheDocument();
    expect(screen.getByText('ANOM-SYS-0001')).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ARCHIVED' } });

    expect(screen.queryByText('ANOM-HEX-04')).not.toBeInTheDocument();
    expect(screen.getByText('ANOM-SYS-0001')).toBeInTheDocument();
  });
});

describe('NAVIGATION-CONTROL V2.0 Scientific & Cartographic Requirements', () => {
  const sampleAnomalies: Anomaly[] = [
    {
      id: 'ANOM-HEX-04',
      title: 'ANOM-HEX-04: Objeto Hexagonal Resonante',
      type: 'objeto_geometrico_anomalo',
      description: 'Monolito hexagonal en órbita alrededor de WISE-0001.',
      first_detected: 'LOG-0000',
      last_observation: 'LOG-0001',
      state: 'AWAITING_DATA',
      evidence: ['1420 MHz'],
      hypotheses: [],
      uncertainty: 'Parámetros orbitales no verificados.',
      related_logs: ['LOG-0001'],
      priority: 'high',
      epistemic_status: 'review'
    },
    {
      id: 'ANOM-SIGNAL-ULF-01',
      title: 'ANOM-SIGNAL-ULF-01: Tren de Pulsos Modulados en 47.8 kHz',
      type: 'senal_fosil',
      description: 'Pulsos con matrices numéricas ortogonales.',
      first_detected: 'LOG-0005',
      last_observation: 'LOG-0005',
      state: 'AWAITING_DATA',
      evidence: ['47.8 kHz'],
      hypotheses: [],
      uncertainty: 'Dirección e intercepción no triangulada.',
      related_logs: ['LOG-0005'],
      priority: 'high',
      epistemic_status: 'review'
    },
    {
      id: 'ANOM-SYS-0001',
      title: 'ANOM-SYS-0001: Divergencia de Memoria',
      type: 'integridad',
      description: 'Divergencia en bloques de ROM.',
      first_detected: 'LOG-0016',
      last_observation: 'LOG-0016',
      state: 'ARCHIVED',
      evidence: ['Checksum error'],
      hypotheses: [],
      uncertainty: 'Contenida en memoria interna.',
      related_logs: ['LOG-0016'],
      priority: 'low',
      epistemic_status: 'review'
    }
  ];

  const sampleTransmissions: Transmission[] = [
    {
      id: 'LOG-0000',
      log_number: 0,
      title: 'LOG-0000: Génesis',
      display_title: 'Génesis',
      date: '2026-11-06T04:12:09Z',
      tags: ['genesis'],
      version: 'V2.0',
      summary: 'Inicio de deriva',
      telemetry: {
        id_registro: 'LOG-0000',
        distance: '164.82 AU',
        distance_status: 'HISTORICAL',
        subsystems_status: 'Giroscopios al 78%'
      },
      paragraphs: ['Texto'],
      github_url: 'https://github.com',
      epistemic_status: 'origin'
    },
    {
      id: 'LOG-0016',
      log_number: 16,
      title: 'LOG-0016: Congelación de Modelo',
      display_title: 'Congelación de Modelo',
      date: '2026-11-07T18:00:00Z',
      tags: ['modelo'],
      version: 'V3.0',
      summary: 'Congelación de propagación',
      telemetry: {
        id_registro: 'LOG-0016',
        distance: '169.34 AU (estimada)',
        distance_status: 'ESTIMATED',
        subsystems_status: 'Modelo orbital congelado'
      },
      paragraphs: ['Texto'],
      github_url: 'https://github.com',
      epistemic_status: 'archive'
    }
  ];

  const sampleMission: MissionState = {
    schema_version: '1.1',
    mission_id: 'SONDA-0',
    protocol_version: 'V3.1-EXODATA',
    carrier_status: 'SIN_PORTADORA',
    carrier_label: 'CONTROL DE MISIÓN: SIN PORTADORA',
    earth_link_state: 'LOSS_OF_SIGNAL',
    earth_link_description: 'Sin enlace',
    last_transmission_id: 'LOG-0039',
    last_transmission_date: '2026-11-08T18:05:00Z',
    last_data_update: '2026-11-08T18:57:04Z',
    known_anomalies_count: 6,
    active_anomalies_count: 5,
    total_transmissions_count: 40,
    telemetry: {
      distance: { label: 'Distancia', value: '169.34 AU', classification: 'ESTIMATED', notes: 'Modelo congelado' },
      rtg_power: { label: 'RTG', value: '41.71%', classification: 'HISTORICAL', notes: '' },
      transceiver: { label: 'Transceptor', value: 'DEGRADADO', classification: 'MEASURED', notes: '' },
      optical: { label: 'Óptica', value: 'OPERATIVO', classification: 'MEASURED', notes: '' },
      memory_integrity: { label: 'Memoria', value: 'VERIFICADA', classification: 'HISTORICAL', notes: '' }
    },
    investigations: []
  };

  // 1. Carga de datos
  it('1. loads navigation data model without runtime exceptions', () => {
    const navObjects = buildNavigationObjects(sampleAnomalies);
    expect(navObjects.length).toBeGreaterThan(5);
    const telemetry = extractNavigationTelemetry(sampleMission);
    expect(telemetry.currentDistanceAu).toBe('169.34 AU');
  });

  // 2. Ausencia de datos (tolerante a null / undefined)
  it('2. safely falls back when mission or anomalies are null or empty', () => {
    const navObjects = buildNavigationObjects([]);
    expect(navObjects.length).toBeGreaterThan(0);
    const telemetry = extractNavigationTelemetry(null);
    expect(telemetry.currentDistanceAu).toBe('169.34 AU');
    expect(telemetry.modelStatus).toBe('MODELO_CONGELADO');
  });

  // 3. Clasificación epistemológica
  it('3. strictly classifies objects into epistemic categories', () => {
    const navObjects = buildNavigationObjects(sampleAnomalies);
    const sol = navObjects.find(o => o.id === 'NAV-SOL')!;
    expect(sol.epistemicClass).toBe('HISTORICAL');
    expect(sol.category).toBe('HISTORICAL_DOCUMENTED');

    const probe = navObjects.find(o => o.id === 'NAV-SONDA-0')!;
    expect(probe.epistemicClass).toBe('ESTIMATED');
    expect(probe.category).toBe('NARRATIVE_ESTIMATE');

    const unloc = navObjects.find(o => o.id === 'NAV-ANOM-SIGNAL-ULF-01')!;
    expect(unloc.epistemicClass).toBe('UNKNOWN');
    expect(unloc.category).toBe('UNKNOWN_POSITION');
  });

  // 4. Distancias y unidades
  it('4. specifies explicit units and distinguishes solar vs relative distance origin', () => {
    const navObjects = buildNavigationObjects(sampleAnomalies);
    const sol = navObjects.find(o => o.id === 'NAV-SOL')!;
    expect(sol.distanceOrigin).toBe('SOLAR_ORIGIN');
    expect(sol.distanceUnit).toBe('AU');

    const wise = navObjects.find(o => o.id === 'NAV-WISE-0001')!;
    expect(wise.distanceOrigin).toBe('RELATIVE_TO_PROBE');
    expect(wise.distanceUnit).toBe('AL');
  });

  // 5. Referencias entre objetos y anomalías
  it('5. establishes explicit bidirectional links between nav objects and anomalies', () => {
    const navObjects = buildNavigationObjects(sampleAnomalies);
    const hex = navObjects.find(o => o.id === 'NAV-HEX-04')!;
    expect(hex.relatedAnomalyId).toBe('ANOM-HEX-04');
    expect(hex.relatedTransmissionId).toBe('LOG-0001');
  });

  // 6. Selección de marcadores y actualización de ficha
  it('6. updates selected object details when clicking or selecting', () => {
    render(<NavigationMap mission={sampleMission} anomalies={sampleAnomalies} transmissions={sampleTransmissions} />);
    // Select WISE-0001 from SVG hotspot or list button
    const wiseBtn = screen.getByRole('button', { name: /Seleccionar Enana Marrón WISE-0001/i });
    fireEvent.click(wiseBtn);
    expect(screen.getByRole('heading', { level: 3, name: /Enana Marrón WISE-0001/i })).toBeInTheDocument();
  });

  // 7. Navegación por teclado (accesibilidad)
  it('7. allows keyboard selection via Enter and Space on interactive elements', () => {
    render(<NavigationMap mission={sampleMission} anomalies={sampleAnomalies} transmissions={sampleTransmissions} />);
    const probeHotspot = screen.getByRole('button', { name: /Seleccionar SONDA 0/i });
    fireEvent.keyDown(probeHotspot, { key: 'Enter' });
    expect(screen.getByRole('heading', { level: 3, name: /SONDA 0/i })).toBeInTheDocument();
  });

  // HOTFIX SCIENTIFIC-INTEGRITY 001 - Pruebas de Regresión
  describe('HOTFIX SCIENTIFIC-INTEGRITY 001 Validations', () => {
    // Corrección 1: HEX-04 Periodicidad de 73s no es período orbital
    it('16. strictly distinguishes 73s emission/magnetic compression from orbital period (orbital period undetermined)', () => {
      const navObjects = buildNavigationObjects(sampleAnomalies);
      const hex = navObjects.find(o => o.id === 'NAV-HEX-04')!;

      // Uncertainty statement must clarify 73s is emission/compression, not orbital period
      expect(hex.uncertaintyStatement).toContain('Período orbital no confirmado');
      expect(hex.uncertaintyStatement).toContain('73.004 s corresponden a emisión electromagnética y compresión magnética, no a órbita');

      // Description must clarify orbital period is not determined
      expect(hex.description).toContain('período orbital no determinado');
      expect(hex.description).toContain('compresión magnética periódica cada 73.004 s');
      expect(hex.physicalNotes).toContain('no confundir con período orbital');
    });

    // Corrección 2: Vector de escape y fuente documental de 112°
    it('17. documents canonical source (LOG-0000 / README) and instrumental frame for 112° galactic orientation, separating it from inertial velocity', () => {
      const navObjects = buildNavigationObjects(sampleAnomalies);
      const probe = navObjects.find(o => o.id === 'NAV-SONDA-0')!;
      expect(probe.physicalNotes).toContain('LOG-0000 / README');
      expect(probe.physicalNotes).toContain('112°');
      expect(probe.physicalNotes).toContain('NO DETERMINADO');

      const telemetry = extractNavigationTelemetry(sampleMission);
      expect(telemetry.chassisOrientation).toContain('112°');
      expect(telemetry.inertialVelocityVector).toContain('NO DETERMINADO');
    });

    // Corrección 3: Dimensiones de 14.8 km tratadas explícitamente como longitud de arista
    it('18. treats 14.8 km as edge length (longitud de arista) and unconfirmed narrative claim', () => {
      const navObjects = buildNavigationObjects(sampleAnomalies);
      const hex = navObjects.find(o => o.id === 'NAV-HEX-04')!;

      expect(hex.description).toContain('14.8 km de longitud de arista');
      expect(hex.description).toContain('afirmación narrativa no confirmada independientemente');
      expect(hex.description).not.toContain('14.8 km de diámetro');
      expect(hex.uncertaintyStatement).toContain('longitud de arista (14.8 km)');
    });
  });

  // 8. Controles de Zoom y Reset
  it('8. provides zoom in, zoom out, and reset controls', () => {
    render(<NavigationMap mission={sampleMission} anomalies={sampleAnomalies} transmissions={sampleTransmissions} />);
    const zoomInBtn = screen.getByTitle(/Aumentar Zoom/i);
    const zoomOutBtn = screen.getByTitle(/Reducir Zoom/i);
    const resetBtn = screen.getByTitle(/Restablecer vista/i);

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(resetBtn);
    expect(resetBtn).toBeInTheDocument();
  });

  // 9. Adaptación móvil y tres paneles presentes
  it('9. renders all 3 essential panels (Telemetry, Cartography Canvas, Objects Sidebar)', () => {
    render(<NavigationMap mission={sampleMission} anomalies={sampleAnomalies} transmissions={sampleTransmissions} />);
    expect(screen.getByText(/^DISTANCIA ESTIMADA AL SOL$/i)).toBeInTheDocument();
    expect(screen.getByText(/^ORIENTACIÓN INSTRUMENTAL \/ VELOCIDAD$/i)).toBeInTheDocument();
    expect(screen.getByText(/REGIONES Y CUERPOS CARTOGRAFIADOS/i)).toBeInTheDocument();
    expect(screen.getByText(/ANOMALÍAS: POSICIÓN NO DETERMINADA/i)).toBeInTheDocument();
  });

  // 10. Actualización de datos reactiva ante props
  it('10. reacts cleanly to updated mission and anomaly props', () => {
    const { rerender } = render(<NavigationMap mission={sampleMission} anomalies={[]} transmissions={[]} />);
    expect(screen.getByText(/ANOMALÍAS: POSICIÓN NO DETERMINADA \(0\)/i)).toBeInTheDocument();

    rerender(<NavigationMap mission={sampleMission} anomalies={sampleAnomalies} transmissions={sampleTransmissions} />);
    expect(screen.getByText(/ANOMALÍAS: POSICIÓN NO DETERMINADA \(2\)/i)).toBeInTheDocument();
  });

  // 11. Posiciones desconocidas en panel lateral sin coordenadas inventadas
  it('11. displays unlocalized anomalies with POSICIÓN NO DETERMINADA badge', () => {
    render(<NavigationMap mission={sampleMission} anomalies={sampleAnomalies} transmissions={sampleTransmissions} />);
    const signalBadge = screen.getAllByText(/POSICIÓN NO DETERMINADA/i);
    expect(signalBadge.length).toBeGreaterThan(0);
  });

  // 12. Ausencia de coordenadas inventadas
  it('12. ensures unlocalized anomalies have hasVisualCoordinates = false', () => {
    const navObjects = buildNavigationObjects(sampleAnomalies);
    const signal = navObjects.find(o => o.id === 'NAV-ANOM-SIGNAL-ULF-01')!;
    expect(signal.hasVisualCoordinates).toBe(false);
    expect(signal.x).toBeUndefined();
    expect(signal.y).toBeUndefined();
  });

  // 13. Integración con rutas de MISSION-CONTROL
  it('13. calls onSelectAnomaly and onSelectTransmission callbacks when buttons clicked', () => {
    const onSelectAnomaly = vi.fn();
    const onSelectTransmission = vi.fn();

    render(
      <NavigationMap
        mission={sampleMission}
        anomalies={sampleAnomalies}
        transmissions={sampleTransmissions}
        onSelectAnomaly={onSelectAnomaly}
        onSelectTransmission={onSelectTransmission}
      />
    );

    // Select HEX-04 to see action buttons
    const hexBtn = screen.getByRole('button', { name: /Seleccionar Objeto Hexagonal HEX-04/i });
    fireEvent.click(hexBtn);

    const anomActionBtn = screen.getByText(/Ver Expediente ANOM-HEX-04/i);
    fireEvent.click(anomActionBtn);
    expect(onSelectAnomaly).toHaveBeenCalledWith('ANOM-HEX-04');

    const transActionBtn = screen.getByText(/Ver Bitácora LOG-0001/i);
    fireEvent.click(transActionBtn);
    expect(onSelectTransmission).toHaveBeenCalledWith('LOG-0001');
  });

  // 14. Preservación de cronología histórica sin saltos inventados
  it('14. builds trajectory timeline strictly from verified log distances', () => {
    const trajectory = buildTrajectoryProgression(sampleTransmissions);
    expect(trajectory.length).toBe(2);
    expect(trajectory[0].logId).toBe('LOG-0000');
    expect(trajectory[0].distanceAu).toBe('164.82 AU');
    expect(trajectory[1].logId).toBe('LOG-0016');
    expect(trajectory[1].distanceAu).toBe('169.34 AU');
  });

  // 15. Separación conceptual estricta de WISE-0001 y HEX-04
  it('15. strictly distinguishes WISE-0001 (brown dwarf) from HEX-04 (monolith anomaly)', () => {
    const navObjects = buildNavigationObjects(sampleAnomalies);
    const wise = navObjects.find(o => o.id === 'NAV-WISE-0001')!;
    const hex = navObjects.find(o => o.id === 'NAV-HEX-04')!;

    expect(wise).toBeDefined();
    expect(hex).toBeDefined();
    expect(wise.id).not.toBe(hex.id);
    expect(wise.type).toContain('Enana');
    expect(hex.type).toContain('Megaestructura');
  });
});
