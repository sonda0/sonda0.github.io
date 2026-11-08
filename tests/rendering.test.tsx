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
});
