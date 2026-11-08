import React from 'react';
import { Subsystem } from '../types/systems';
import { Cpu, Activity, ShieldCheck } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface SystemPanelProps {
  system: Subsystem;
}

export const SystemPanel: React.FC<SystemPanelProps> = ({ system }) => {
  const isNominal = system.health_level === 'nominal';

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={14} style={{ color: isNominal ? 'var(--green-operational)' : 'var(--amber-warning)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
            {system.id}
          </span>
          <span className="tag-chip" style={{ fontSize: '0.65rem' }}>
            {system.category}
          </span>
        </div>

        <StatusIndicator status={system.epistemic_class} size="sm" />
      </div>

      <div className="panel-body">
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            marginBottom: '14px'
          }}
        >
          {system.name}
        </h3>

        {/* Narrative vs Platform Status */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-panel)',
              borderRadius: '4px',
              padding: '10px'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--cyan-instrument)',
                letterSpacing: '0.08em',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Activity size={11} />
              <span>ESTADO NARRATIVO</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: isNominal ? 'var(--green-operational)' : 'var(--amber-warning)'
              }}
            >
              {system.narrative_status}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-panel)',
              borderRadius: '4px',
              padding: '10px'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={11} />
              <span>ESTADO DE PLATAFORMA</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-main)'
              }}
            >
              {system.platform_status}
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: '16px'
          }}
        >
          {system.details}
        </p>

        {/* Technical telemetry metrics */}
        {system.metrics && Object.keys(system.metrics).length > 0 && (
          <div
            style={{
              background: 'rgba(13, 23, 36, 0.5)',
              borderRadius: '4px',
              padding: '10px 12px',
              border: '1px dashed var(--border-panel)'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                marginBottom: '6px'
              }}
            >
              PARÁMETROS ASOCIADOS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              {Object.entries(system.metrics).map(([k, v]) => (
                <div key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}: </span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
