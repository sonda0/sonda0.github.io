import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../src/components/Navigation';
import { Transmissions } from '../src/pages/Transmissions';
import { Anomalies } from '../src/pages/Anomalies';

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
