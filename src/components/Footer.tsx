import React from 'react';
import { ExternalLink, Database, Shield } from 'lucide-react';

interface FooterProps {
  lastUpdate?: string;
  dataStatus?: string;
}

export const Footer: React.FC<FooterProps> = ({
  lastUpdate,
  dataStatus = 'SYNCHRONIZED'
}) => {
  return (
    <footer
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-panel)',
        padding: '24px 20px',
        marginTop: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid rgba(36, 59, 80, 0.5)',
            paddingBottom: '16px'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>SONDA 0 // MISSION-CONTROL V1.0</span>
            <span style={{ margin: '0 8px', color: 'var(--text-dim)' }}>|</span>
            <span style={{ color: 'var(--cyan-instrument)' }}>sonda0.online</span>
            <span style={{ margin: '0 8px', color: 'var(--text-dim)' }}>|</span>
            <span>EXODATA V3.1</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={13} style={{ color: 'var(--cyan-instrument)' }} />
              <span>ESTADO DE DATOS: <strong style={{ color: 'var(--green-operational)' }}>{dataStatus}</strong></span>
            </span>
            {lastUpdate && (
              <span style={{ color: 'var(--text-dim)' }}>
                SINCRONIZACIÓN: {lastUpdate}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.72rem',
            color: 'var(--text-dim)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={12} />
            <span>
              SUBSISTEMA DE VISUALIZACIÓN EXCLUSIVAMENTE DE SOLO LECTURA. NINGÚN COMANDO MODIFICA LA DERIVA DE LA SONDA.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <a
              href="https://github.com/sonda0/bitacora"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
            >
              GitHub Bitácora <ExternalLink size={11} />
            </a>
            <a
              href="https://www.youtube.com/@sonda0.Operator"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
            >
              YouTube <ExternalLink size={11} />
            </a>
            <a
              href="https://www.reddit.com/r/Sonda0/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
            >
              Reddit <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
