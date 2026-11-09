import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelemetryCard } from '../src/components/TelemetryCard';
import { StatusIndicator } from '../src/components/StatusIndicator';
import { SignalIndicator } from '../src/components/SignalIndicator';
import { MissionHeader } from '../src/components/MissionHeader';
import { AnomalyCard } from '../src/components/AnomalyCard';
import { TransmissionCard } from '../src/components/TransmissionCard';

describe('UI Rendering & Component Tests', () => {
  it('renders StatusIndicator with correct classification labels', () => {
    const { rerender } = render(<StatusIndicator status="MEASURED" />);
    expect(screen.getByText('MEDIDO')).toBeInTheDocument();

    rerender(<StatusIndicator status="ESTIMATED" />);
    expect(screen.getByText('ESTIMADO')).toBeInTheDocument();

    rerender(<StatusIndicator status="HISTORICAL" />);
    expect(screen.getByText('HISTÓRICO')).toBeInTheDocument();

    rerender(<StatusIndicator status="UNKNOWN" />);
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });

  it('renders SignalIndicator with carrier loss notice', () => {
    render(
      <SignalIndicator
        carrierStatus="SIN_PORTADORA"
        earthLinkState="LOSS_OF_SIGNAL"
      />
    );
    expect(screen.getByText(/CONTROL DE MISIÓN: SIN PORTADORA/i)).toBeInTheDocument();
  });

  it('renders MissionHeader with protocol and domain', () => {
    render(
      <MissionHeader
        carrierStatus="SIN_PORTADORA"
        earthLinkState="LOSS_OF_SIGNAL"
        protocolVersion="V3.1-EXODATA"
      />
    );
    expect(screen.getByText('SONDA 0')).toBeInTheDocument();
    expect(screen.getByText('MISSION-CONTROL')).toBeInTheDocument();
    expect(screen.getByText(/PROTOCOLO V3.1-EXODATA/i)).toBeInTheDocument();
  });

  it('renders TelemetryCard with value and notes', () => {
    const item = {
      label: 'POTENCIA RTG',
      value: '41.71%',
      classification: 'HISTORICAL' as const,
      notes: 'Decaimiento isotópico del plutonio-238'
    };
    render(<TelemetryCard item={item} />);
    expect(screen.getByText('POTENCIA RTG')).toBeInTheDocument();
    expect(screen.getByText('41.71%')).toBeInTheDocument();
    expect(screen.getByText('Decaimiento isotópico del plutonio-238')).toBeInTheDocument();
  });

  it('renders AnomalyCard with uncertainty warning and status', () => {
    const anomaly = {
      id: 'ANOM-HEX-04',
      title: 'Objeto Hexagonal Resonante',
      type: 'objeto_geometrico_anomalo',
      description: 'Objeto hexagonal no reflectante.',
      first_detected: 'LOG-0000',
      last_observation: 'LOG-0001',
      state: 'AWAITING_DATA' as const,
      evidence: ['Emisión 1420 MHz'],
      hypotheses: ['Nodo de extracción energética'],
      uncertainty: 'Parámetros orbitales proceden de un único registro sin verificación independiente.',
      related_logs: ['LOG-0001'],
      priority: 'high',
      epistemic_status: 'historical_claim_under_review'
    };

    render(<AnomalyCard anomaly={anomaly} onSelect={() => {}} />);
    expect(screen.getByText('ANOM-HEX-04')).toBeInTheDocument();
    expect(screen.getByText('Objeto Hexagonal Resonante')).toBeInTheDocument();
    expect(screen.getByText('ESPERA DE DATOS')).toBeInTheDocument();
    expect(screen.getByText(/INCERTIDUMBRE EPISTÉMICA/i)).toBeInTheDocument();
  });

  it('renders TransmissionCard with tags and version badge', () => {
    const tx = {
      id: 'LOG-0022',
      log_number: 22,
      title: 'LOG-0022: Actualizaciones de recuperación secuencial',
      display_title: 'Actualizaciones de recuperación secuencial',
      date: '2026-11-08T01:05:00Z',
      tags: ['robotica', 'trayectorias'],
      version: 'V3.1',
      summary: 'El procesamiento del ciclo incorpora un enfoque para control robusto.',
      telemetry: {
        id_registro: 'LOG-0022',
        distance: '169.34 AU',
        distance_status: 'ESTIMATED' as const,
        subsystems_status: 'RTG nominal'
      },
      paragraphs: ['Párrafo de prueba.'],
      github_url: 'https://github.com/sonda0/bitacora/blob/main/transmisiones/LOG-0022.md',
      epistemic_status: 'narrative_archive_log'
    };

    render(<TransmissionCard transmission={tx} onSelect={() => {}} />);
    expect(screen.getByText('LOG-0022')).toBeInTheDocument();
    expect(screen.getByText('V3.1')).toBeInTheDocument();
    expect(screen.getByText('#robotica')).toBeInTheDocument();
  });

  it('renders NavigationMap with reactive data binding under App on /navegacion route', async () => {
    // Set window.location.hash to /navegacion
    window.location.hash = '/navegacion';

    // Mock fetch for public data endpoints
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('manifest.json')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            schema_version: '1.1',
            project: 'SONDA 0',
            site: 'MISSION-CONTROL',
            domain: 'sonda0.online',
            generated_at: '2026-11-08T18:05:00Z',
            last_valid_transmission: 'LOG-0022',
            data_status: 'SYNCHRONIZED',
            sources: { repository: 'https://github.com/sonda0/bitacora' }
          })
        } as Response;
      }
      if (url.endsWith('mission.json')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            schema_version: '1.1',
            mission_id: 'SONDA-0',
            protocol_version: 'V3.1-EXODATA',
            carrier_status: 'SIN_PORTADORA',
            carrier_label: 'CONTROL DE MISIÓN: SIN PORTADORA',
            earth_link_state: 'LOSS_OF_SIGNAL',
            earth_link_description: 'Sin enlace',
            last_transmission_id: 'LOG-0022',
            last_transmission_date: '2026-11-08T01:05:00Z',
            last_data_update: '2026-11-08T18:05:00Z',
            known_anomalies_count: 6,
            active_anomalies_count: 5,
            total_transmissions_count: 23,
            telemetry: {
              distance: { label: 'Distancia', value: '169.34 AU', classification: 'ESTIMATED', notes: '' },
              rtg_power: { label: 'RTG', value: '41.71%', classification: 'HISTORICAL', notes: '' },
              transceiver: { label: 'Transceptor', value: 'DEGRADADO', classification: 'MEASURED', notes: '' },
              optical: { label: 'Óptica', value: 'OPERATIVO', classification: 'MEASURED', notes: '' },
              memory_integrity: { label: 'Memoria', value: 'VERIFICADA', classification: 'HISTORICAL', notes: '' }
            },
            investigations: []
          })
        } as Response;
      }
      if (url.endsWith('anomalies.json')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => [
            {
              id: 'ANOM-HEX-04',
              title: 'ANOM-HEX-04: Objeto Hexagonal Resonante',
              type: 'objeto_geometrico_anomalo',
              description: 'Monolito en WISE-0001',
              first_detected: 'LOG-0000',
              last_observation: 'LOG-0001',
              state: 'AWAITING_DATA',
              evidence: ['1420 MHz'],
              hypotheses: [],
              uncertainty: 'Sin verificación',
              related_logs: ['LOG-0001'],
              priority: 'high',
              epistemic_status: 'review'
            },
            {
              id: 'ANOM-SIGNAL-ULF-01',
              title: 'ANOM-SIGNAL-ULF-01: Señal Fósil 47.8 kHz',
              type: 'senal_fosil',
              description: 'Pulsos ortogonales',
              first_detected: 'LOG-0005',
              last_observation: 'LOG-0005',
              state: 'AWAITING_DATA',
              evidence: ['47.8 kHz'],
              hypotheses: [],
              uncertainty: 'Posición desconocida',
              related_logs: ['LOG-0005'],
              priority: 'high',
              epistemic_status: 'review'
            }
          ]
        } as Response;
      }
      if (url.endsWith('transmissions.json')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => [
            {
              id: 'LOG-0000',
              log_number: 0,
              title: 'LOG-0000: Génesis',
              display_title: 'Génesis',
              date: '2026-11-06T04:12:09Z',
              tags: ['genesis'],
              version: 'V2.0',
              summary: 'Génesis',
              telemetry: { id_registro: 'LOG-0000', distance: '164.82 AU', distance_status: 'HISTORICAL', subsystems_status: 'Nominal' },
              paragraphs: ['Párrafo'],
              github_url: 'https://github.com',
              epistemic_status: 'origin'
            }
          ]
        } as Response;
      }
      if (url.endsWith('systems.json')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ schema_version: '1.0', subsystems: [] })
        } as Response;
      }
      if (url.endsWith('timeline.json')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => []
        } as Response;
      }
      return originalFetch(input);
    };

    try {
      const { App } = await import('../src/App');
      render(<App />);

      // Wait for navigation-control-v2 to mount with bound reactive data
      const navContainer = await screen.findByTestId('navigation-control-v2');
      expect(navContainer).toBeInTheDocument();

      // Verify that NavigationMap received anomalies (ANOM-SIGNAL-ULF-01 in unlocalized list)
      expect(screen.getByText(/ANOM-SIGNAL-ULF-01: Señal Fósil 47.8 kHz/i)).toBeInTheDocument();
      // Verify that NavigationMap received telemetry (169.34 AU in distance card or items)
      expect(screen.getAllByText(/169.34 AU/i).length).toBeGreaterThan(0);
      // Verify that NavigationMap received transmissions (LOG-0000 in timeline)
      expect(screen.getByText('LOG-0000')).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
      window.location.hash = '';
    }
  });
});
