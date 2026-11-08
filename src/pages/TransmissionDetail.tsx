import React from 'react';
import { Transmission } from '../types/transmission';
import { formatDateTime } from '../services/transmissionParser';
import { renderMarkdownParagraph } from '../services/transmissionParser';
import { StatusIndicator } from '../components/StatusIndicator';
import {
  ArrowLeft,
  ExternalLink,
  Radio,
  Calendar
} from 'lucide-react';

interface TransmissionDetailProps {
  transmission: Transmission;
  onBack: () => void;
  onSelectTag?: (tag: string) => void;
}

export const TransmissionDetail: React.FC<TransmissionDetailProps> = ({
  transmission,
  onBack,
  onSelectTag
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Top back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBack} className="btn-primary">
          <ArrowLeft size={14} />
          <span>Volver al Archivo de Transmisiones</span>
        </button>

        <a
          href={transmission.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ borderColor: 'var(--cyan-instrument)', color: 'var(--cyan-instrument)' }}
        >
          <ExternalLink size={14} />
          <span>Ver Fuente Verificada en GitHub</span>
        </a>
      </div>

      {/* Main Document Panel */}
      <article className="panel-card">
        {/* Document Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'rgba(13, 23, 36, 0.7)',
            borderBottom: '1px solid var(--border-panel)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--cyan-instrument)',
                background: 'rgba(69, 201, 216, 0.1)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(69, 201, 216, 0.3)'
              }}
            >
              {transmission.id}
            </span>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '4px',
                background: transmission.version === 'V3.1' ? 'rgba(66, 200, 162, 0.15)' : 'rgba(69, 201, 216, 0.15)',
                color: transmission.version === 'V3.1' ? 'var(--green-operational)' : 'var(--cyan-instrument)',
                border: `1px solid ${transmission.version === 'V3.1' ? 'rgba(66, 200, 162, 0.4)' : 'rgba(69, 201, 216, 0.4)'}`
              }}
            >
              PROTOCOLO {transmission.version}
            </span>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} />
              {formatDateTime(transmission.date)}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.45rem',
              fontWeight: 700,
              lineHeight: 1.35,
              color: 'var(--text-main)',
              marginBottom: '16px'
            }}
          >
            {transmission.title}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {transmission.tags.map((tag) => (
              <span
                key={tag}
                className="tag-chip"
                style={{ cursor: onSelectTag ? 'pointer' : 'default' }}
                onClick={() => onSelectTag && onSelectTag(tag)}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Telemetry Block of this Transmission */}
        {transmission.telemetry && (
          <div
            style={{
              padding: '16px 24px',
              background: 'rgba(6, 11, 18, 0.6)',
              borderBottom: '1px solid var(--border-panel)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem'
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--cyan-instrument)',
                letterSpacing: '0.1em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Radio size={12} />
              <span>PAQUETE DE TELEMETRÍA ASOCIADO // REGISTRO DE ORIGEN</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-dim)' }}>ID REGISTRO: </span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  {transmission.telemetry.id_registro}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-dim)' }}>DISTANCIA: </span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                  {transmission.telemetry.distance}
                </span>
                <span style={{ marginLeft: '6px' }}>
                  <StatusIndicator status={transmission.telemetry.distance_status} size="sm" />
                </span>
              </div>

              {transmission.telemetry.vector && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-dim)' }}>VECTOR: </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {transmission.telemetry.vector}
                  </span>
                </div>
              )}

              {transmission.telemetry.subsystems_status && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-dim)' }}>SUBSISTEMAS: </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {transmission.telemetry.subsystems_status}
                  </span>
                </div>
              )}

              {transmission.telemetry.external_signal && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-dim)' }}>SEÑAL EXTERNA ENLAZADA: </span>
                  <a
                    href={transmission.telemetry.external_signal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--cyan-instrument)', textDecoration: 'underline' }}
                  >
                    {transmission.telemetry.external_signal.title} ↗
                  </a>
                </div>
              )}

              {transmission.telemetry.confidence && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-dim)' }}>CONFIANZA EPISTÉMICA: </span>
                  <span style={{ color: 'var(--amber-warning)', fontWeight: 600 }}>
                    {transmission.telemetry.confidence}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Paragraphs Rendered Safely */}
        <div
          className="panel-body"
          style={{
            padding: '28px 24px',
            fontSize: '0.95rem',
            lineHeight: 1.8,
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {transmission.paragraphs.map((p, idx) => (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: renderMarkdownParagraph(p) }}
            />
          ))}
        </div>

        {/* Footer info & End of file marker */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(13, 23, 36, 0.4)',
            borderTop: '1px solid var(--border-panel)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-dim)'
          }}
        >
          <span>[FIN DE ARCHIVO // DATALINK TERMINADO]</span>
          <span>ESTADO EPISTÉMICO: ARCHIVO HISTÓRICO VERIFICADO</span>
        </div>
      </article>
    </div>
  );
};
