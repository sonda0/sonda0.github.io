import React from 'react';
import { Transmission } from '../types/transmission';
import { formatDateTime, formatTimeAgo } from '../services/transmissionParser';
import { Radio, ExternalLink, ArrowRight } from 'lucide-react';

interface TransmissionCardProps {
  transmission: Transmission;
  onSelect: (id: string) => void;
  compact?: boolean;
}

export const TransmissionCard: React.FC<TransmissionCardProps> = ({
  transmission,
  onSelect,
  compact = false
}) => {
  return (
    <div
      className="panel-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }}
      onClick={() => onSelect(transmission.id)}
    >
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={14} style={{ color: 'var(--cyan-instrument)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan-instrument)', fontSize: '0.85rem' }}>
            {transmission.id}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              padding: '1px 6px',
              borderRadius: '3px',
              background: transmission.version === 'V3.1' ? 'rgba(66, 200, 162, 0.15)' : 'rgba(69, 201, 216, 0.1)',
              color: transmission.version === 'V3.1' ? 'var(--green-operational)' : 'var(--cyan-instrument)',
              border: `1px solid ${transmission.version === 'V3.1' ? 'rgba(66, 200, 162, 0.3)' : 'rgba(69, 201, 216, 0.3)'}`
            }}
          >
            {transmission.version}
          </span>
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {formatTimeAgo(transmission.date)}
        </span>
      </div>

      <div className="panel-body" style={{ flex: 1 }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--text-main)',
            lineHeight: 1.4
          }}
        >
          {transmission.display_title || transmission.title}
        </h3>

        {!compact && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              marginBottom: '12px'
            }}
          >
            {transmission.summary.length > 220
              ? `${transmission.summary.slice(0, 220)}...`
              : transmission.summary}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {transmission.tags.slice(0, compact ? 3 : 5).map((t) => (
            <span key={t} className="tag-chip">
              #{t}
            </span>
          ))}
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
        <span style={{ color: 'var(--text-dim)' }}>
          {formatDateTime(transmission.date)}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href={transmission.github_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Ver archivo original en GitHub"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
          >
            <ExternalLink size={12} />
            <span style={{ fontSize: '0.7rem' }}>GitHub</span>
          </a>

          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--cyan-instrument)',
              fontWeight: 600
            }}
          >
            Explorar <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
};
