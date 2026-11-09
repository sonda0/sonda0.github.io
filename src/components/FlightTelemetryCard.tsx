import React from 'react';
import { FlightTelemetryParameter } from '../types/flightTelemetry';
import { StatusIndicator } from './StatusIndicator';
import { getCategoryColor, formatParameterValue } from '../services/flightTelemetry';

interface FlightTelemetryCardProps {
  parameter: FlightTelemetryParameter;
  compact?: boolean;
  onClick?: () => void;
  showCategory?: boolean;
}

export const FlightTelemetryCard: React.FC<FlightTelemetryCardProps> = ({
  parameter,
  compact = false,
  onClick,
  showCategory = true
}) => {
  const categoryColor = getCategoryColor(parameter.category);
  const displayValue = formatParameterValue(parameter);
  
  const isUnknown = parameter.epistemicState === 'UNKNOWN';
  const isStale = parameter.validityState === 'STALE';
  const hasHistory = parameter.historicalSeries && parameter.historicalSeries.length >= 2;
  
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: `1px solid ${isUnknown ? 'rgba(220, 100, 113, 0.3)' : 'var(--border-panel)'}`,
    borderRadius: '4px',
    padding: compact ? '10px 12px' : '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    minHeight: compact ? '90px' : '120px',
    boxShadow: isStale ? '0 0 0 1px rgba(232, 170, 83, 0.2) inset' : 'none'
  };

  return (
    <div
      className="flight-telemetry-card"
      style={cardStyle}
      onClick={onClick}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : undefined}
      aria-label={`Ver detalles de ${parameter.name}`}
    >
      {/* Reticle corners */}
      <div className="reticle-corner reticle-tl" style={{ borderColor: categoryColor }} />
      <div className="reticle-corner reticle-tr" style={{ borderColor: categoryColor }} />
      <div className="reticle-corner reticle-bl" style={{ borderColor: categoryColor }} />
      <div className="reticle-corner reticle-br" style={{ borderColor: categoryColor }} />
      
      {/* Indicador de estado epistémico en la esquina superior derecha */}
      <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
        <StatusIndicator status={parameter.epistemicState} size="sm" showLabel={false} />
        {hasHistory && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: '#42C8A2',
              background: 'rgba(66, 200, 162, 0.1)',
              padding: '1px 4px',
              borderRadius: '2px',
              border: '1px solid rgba(66, 200, 162, 0.3)'
            }}
            title="Serie histórica disponible"
          >
            📊
          </span>
        )}
        {isStale && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: '#E8AA53',
              background: 'rgba(232, 170, 83, 0.1)',
              padding: '1px 4px',
              borderRadius: '2px',
              border: '1px solid rgba(232, 170, 83, 0.3)'
            }}
            title="Dato sin actualización confirmada"
          >
            ⏳
          </span>
        )}
      </div>

      {/* Header: Categoría y Nombre */}
      <div className="telemetry-card-header" style={{ marginBottom: compact ? '6px' : '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {showCategory && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: compact ? '0.55rem' : '0.6rem',
                textTransform: 'uppercase',
                color: categoryColor,
                letterSpacing: '0.05em',
                background: `${categoryColor}15`,
                padding: '2px 6px',
                borderRadius: '2px',
                border: `1px solid ${categoryColor}40`
              }}
            >
              {parameter.category}
            </span>
          )}
          <span
            className="telemetry-label"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: compact ? '0.7rem' : '0.75rem',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {parameter.name}
          </span>
        </div>
      </div>

      {/* Valor principal */}
      <div
        className="telemetry-value"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: compact ? '1.1rem' : '1.35rem',
          fontWeight: 700,
          color: isUnknown ? '#DC6471' : 'var(--text-main)',
          margin: '4px 0',
          wordBreak: 'break-word',
          lineHeight: 1.2
        }}
      >
        {displayValue}
        {parameter.unit && parameter.unit !== 'estado' && parameter.unit !== 'vector' && parameter.unit !== 'grados' && (
          <span style={{ fontSize: '0.7em', fontWeight: 400, color: 'var(--text-dim)', marginLeft: '4px' }}>
            {parameter.unit}
          </span>
        )}
      </div>

      {/* Unidad para casos especiales */}
      {(parameter.unit === 'estado' || parameter.unit === 'vector' || parameter.unit === 'grados') && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '2px' }}>
          {parameter.unit.toUpperCase()}
        </div>
      )}

      {/* Incertidumbre / Notas (solo en modo no compacto) */}
      {!compact && parameter.uncertainty && (
        <div
          className="telemetry-notes"
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            lineHeight: 1.35,
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px dashed rgba(36, 59, 80, 0.6)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {parameter.uncertainty.length > 120 ? parameter.uncertainty.slice(0, 120) + '…' : parameter.uncertainty}
        </div>
      )}

      {/* Footer: Fecha de observación y fuente */}
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-dim)' }}>
          <span>OBS: {parameter.observationDate.split('T')[0]}</span>
          <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {parameter.provenanceLog}
          </span>
        </div>
      )}
    </div>
  );
};