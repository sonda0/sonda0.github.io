import React from 'react';
import { Anomaly } from '../types/anomaly';
import { getStateBadgeClass, getStateLabel } from '../components/AnomalyCard';
import {
  ArrowLeft,
  AlertOctagon,
  HelpCircle,
  FileText,
  Lightbulb,
  MapPin,
  Calendar,
  Radio,
  Clock,
  Compass
} from 'lucide-react';

interface AnomalyDetailProps {
  anomaly: Anomaly;
  onBack: () => void;
  onSelectTransmission?: (logId: string) => void;
}

export const AnomalyDetail: React.FC<AnomalyDetailProps> = ({
  anomaly,
  onBack,
  onSelectTransmission
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px', margin: '0 auto' }}>
      <button onClick={onBack} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={14} />
        <span>Volver al Catálogo de Anomalías</span>
      </button>

      <article className="panel-card">
        {/* Header */}
        <div
          style={{
            padding: '24px',
            background: 'rgba(13, 23, 36, 0.7)',
            borderBottom: '1px solid var(--border-panel)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertOctagon size={18} style={{ color: 'var(--amber-warning)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-main)'
                }}
              >
                EXPEDIENTE: {anomaly.id}
              </span>
            </div>

            <span className={`anomaly-state-badge ${getStateBadgeClass(anomaly.state)}`}>
              ESTADO: {getStateLabel(anomaly.state)}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--cyan-instrument)',
              marginBottom: '14px',
              lineHeight: 1.3
            }}
          >
            {anomaly.title}
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-main)',
              lineHeight: 1.6,
              marginBottom: '16px'
            }}
          >
            {anomaly.description}
          </p>

          {/* Quick facts grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              background: 'rgba(6, 11, 18, 0.6)',
              padding: '14px',
              borderRadius: '4px',
              border: '1px solid var(--border-panel)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Calendar size={12} /> PRIMERA DETECCIÓN:
              </span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {anomaly.first_detected}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Clock size={12} /> ÚLTIMA OBSERVACIÓN:
              </span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {anomaly.last_observation}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <MapPin size={12} /> UBICACIÓN DECLARADA:
              </span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                {anomaly.location || 'Coordenadas no verificadas'}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Compass size={12} /> PRIORIDAD DE SEGUIMIENTO:
              </span>
              <span style={{ color: 'var(--amber-warning)', fontWeight: 600, textTransform: 'uppercase' }}>
                {anomaly.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          {/* 1. Incertidumbre Epistémica */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--amber-warning)',
                letterSpacing: '0.08em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <HelpCircle size={14} />
              <span>NIVEL DE INCERTIDUMBRE Y DISCIPLINA EPISTÉMICA</span>
            </div>
            <div
              style={{
                background: 'rgba(232, 170, 83, 0.08)',
                borderLeft: '3px solid var(--amber-warning)',
                padding: '12px 16px',
                borderRadius: '0 4px 4px 0',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                lineHeight: 1.5
              }}
            >
              {anomaly.uncertainty}
            </div>
          </div>

          {/* 2. Evidencia Disponible */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--cyan-instrument)',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileText size={14} />
              <span>EVIDENCIA Y LECTURAS INSTRUMENTALES ({anomaly.evidence.length})</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {anomaly.evidence.map((ev, idx) => (
                <li
                  key={idx}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-panel)',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  <span style={{ color: 'var(--cyan-instrument)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    [{String(idx + 1).padStart(2, '0')}]
                  </span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Hipótesis Activas */}
          {anomaly.hypotheses && anomaly.hypotheses.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--green-operational)',
                  letterSpacing: '0.08em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Lightbulb size={14} />
                <span>HIPÓTESIS DE TRABAJO ACTIVAS</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {anomaly.hypotheses.map((hyp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(66, 200, 162, 0.08)',
                      border: '1px solid rgba(66, 200, 162, 0.3)',
                      borderRadius: '4px',
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      lineHeight: 1.5
                    }}
                  >
                    {hyp}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Próxima Investigación Propuesta */}
          {anomaly.next_observation && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--cyan-instrument)',
                  letterSpacing: '0.08em',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Compass size={14} />
                <span>PRÓXIMA INVESTIGACIÓN PROPUESTA // PROTOCOLO DE OBSERVACIÓN</span>
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-surface)',
                  padding: '12px 14px',
                  borderRadius: '4px',
                  border: '1px dashed var(--border-panel)'
                }}
              >
                {anomaly.next_observation}
              </p>
            </div>
          )}

          {/* 5. Registros Asociados */}
          {anomaly.related_logs && anomaly.related_logs.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Radio size={14} />
                <span>REGISTROS HISTÓRICOS ASOCIADOS</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {anomaly.related_logs.map((logId) => (
                  <button
                    key={logId}
                    onClick={() => onSelectTransmission && onSelectTransmission(logId)}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Radio size={12} />
                    <span>Consultar {logId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};
