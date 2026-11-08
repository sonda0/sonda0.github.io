import React from 'react';
import { Anomaly, AnomalyState } from '../types/anomaly';
import { AlertOctagon, HelpCircle, FileText, ArrowRight } from 'lucide-react';

interface AnomalyCardProps {
  anomaly: Anomaly;
  onSelect: (id: string) => void;
}

export function getStateBadgeClass(state: AnomalyState | string): string {
  switch (state) {
    case 'DETECTED':
      return 'state-detected';
    case 'UNDER_ANALYSIS':
      return 'state-under-analysis';
    case 'AWAITING_DATA':
      return 'state-awaiting-data';
    case 'HYPOTHESIS_REVISION':
      return 'state-hypothesis-revision';
    case 'RESOLVED':
      return 'state-resolved';
    case 'ARCHIVED':
    default:
      return 'state-archived';
  }
}

export function getStateLabel(state: AnomalyState | string): string {
  switch (state) {
    case 'DETECTED':
      return 'DETECTADA';
    case 'UNDER_ANALYSIS':
      return 'EN ANÁLISIS';
    case 'AWAITING_DATA':
      return 'ESPERA DE DATOS';
    case 'HYPOTHESIS_REVISION':
      return 'REVISIÓN HIPÓTESIS';
    case 'RESOLVED':
      return 'RESUELTA';
    case 'ARCHIVED':
      return 'ARCHIVADA';
    case 'INCONCLUSIVE':
      return 'INCONCLUSO';
    default:
      return state;
  }
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomaly, onSelect }) => {
  return (
    <div
      className="panel-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }}
      onClick={() => onSelect(anomaly.id)}
    >
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertOctagon size={14} style={{ color: 'var(--amber-warning)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
            {anomaly.id}
          </span>
        </div>

        <span className={`anomaly-state-badge ${getStateBadgeClass(anomaly.state)}`}>
          {getStateLabel(anomaly.state)}
        </span>
      </div>

      <div className="panel-body" style={{ flex: 1 }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--cyan-instrument)',
            lineHeight: 1.4
          }}
        >
          {anomaly.title}
        </h3>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            lineHeight: 1.5,
            marginBottom: '14px'
          }}
        >
          {anomaly.description}
        </p>

        {/* Uncertainty notice */}
        <div
          style={{
            background: 'rgba(13, 23, 36, 0.7)',
            borderLeft: '2px solid var(--amber-warning)',
            padding: '8px 10px',
            borderRadius: '0 4px 4px 0',
            marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--amber-warning)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '2px' }}>
            <HelpCircle size={12} />
            <span>INCERTIDUMBRE EPISTÉMICA:</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {anomaly.uncertainty}
          </p>
        </div>

        {/* Metadata info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-dim)' }}>DETECCIÓN: </span>
            <span>{anomaly.first_detected}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>ÚLTIMO REGISTRO: </span>
            <span>{anomaly.last_observation}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(13, 23, 36, 0.4)',
          borderTop: '1px solid var(--border-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem'
        }}
      >
        <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={12} /> {anomaly.evidence.length} evidencias registradas
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--cyan-instrument)',
            fontWeight: 600
          }}
        >
          Ver expediente <ArrowRight size={12} />
        </span>
      </div>
    </div>
  );
};
