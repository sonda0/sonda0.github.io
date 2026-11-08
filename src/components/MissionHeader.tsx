import React from 'react';
import { SignalIndicator } from './SignalIndicator';
import { MissionClock } from './MissionClock';
import { Terminal } from 'lucide-react';

interface MissionHeaderProps {
  carrierStatus: string;
  earthLinkState: string;
  protocolVersion: string;
  onLogoClick?: () => void;
}

export const MissionHeader: React.FC<MissionHeaderProps> = ({
  carrierStatus,
  earthLinkState,
  protocolVersion,
  onLogoClick
}) => {
  return (
    <header
      style={{
        background: 'rgba(6, 11, 18, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border-panel)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Brand identity */}
        <div
          onClick={onLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: onLogoClick ? 'pointer' : 'default'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-panel)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Terminal size={18} style={{ color: 'var(--cyan-instrument)' }} />
            <div className="reticle-corner reticle-tl" />
            <div className="reticle-corner reticle-br" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  letterSpacing: '0.12em',
                  color: 'var(--text-main)'
                }}
              >
                SONDA 0
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--cyan-instrument)',
                  background: 'rgba(69, 201, 216, 0.1)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(69, 201, 216, 0.3)'
                }}
              >
                MISSION-CONTROL
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em'
              }}
            >
              PROTOCOLO {protocolVersion || 'EXODATA V3.1'} // DOMINIO: sonda0.online
            </div>
          </div>
        </div>

        {/* Status Indicators & Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          <MissionClock />
          <SignalIndicator carrierStatus={carrierStatus} earthLinkState={earthLinkState} />
        </div>
      </div>
    </header>
  );
};
