import React from 'react';
import { Radio } from 'lucide-react';

interface SignalIndicatorProps {
  carrierStatus: 'SIN_PORTADORA' | 'ONLINE' | string;
  earthLinkState: string;
}

export const SignalIndicator: React.FC<SignalIndicatorProps> = ({
  carrierStatus,
  earthLinkState
}) => {
  const isLoss = carrierStatus === 'SIN_PORTADORA' || earthLinkState === 'LOSS_OF_SIGNAL';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: isLoss ? 'rgba(220, 100, 113, 0.12)' : 'rgba(66, 200, 162, 0.12)',
        border: `1px solid ${isLoss ? 'rgba(220, 100, 113, 0.4)' : 'rgba(66, 200, 162, 0.4)'}`,
        padding: '5px 12px',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.74rem',
        letterSpacing: '0.06em'
      }}
    >
      <span
        className={isLoss ? 'pulse-red' : 'pulse-green'}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isLoss ? 'var(--red-critical)' : 'var(--green-operational)',
          display: 'inline-block'
        }}
      />
      {isLoss ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--red-critical)' }}>
          <Radio size={13} />
          <strong>CONTROL DE MISIÓN: SIN PORTADORA</strong>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green-operational)' }}>
          <Radio size={13} />
          <strong>CONTROL DE MISIÓN: ENLACE ACTIVO</strong>
        </div>
      )}
    </div>
  );
};
