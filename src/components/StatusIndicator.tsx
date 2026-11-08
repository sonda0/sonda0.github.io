import React from 'react';
import { EpistemicClassification } from '../types/mission';

interface StatusIndicatorProps {
  status: EpistemicClassification | string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = true
}) => {
  const normStatus = (status || 'UNKNOWN').toUpperCase();

  let badgeClass = 'badge-unknown';
  let dotColor = 'var(--text-muted)';
  let label = normStatus;

  if (normStatus === 'MEASURED' || normStatus === 'MEDIDO') {
    badgeClass = 'badge-measured';
    dotColor = 'var(--green-operational)';
    label = 'MEDIDO';
  } else if (normStatus === 'ESTIMATED' || normStatus === 'ESTIMADO') {
    badgeClass = 'badge-estimated';
    dotColor = 'var(--cyan-instrument)';
    label = 'ESTIMADO';
  } else if (normStatus === 'HISTORICAL' || normStatus === 'HISTÓRICO') {
    badgeClass = 'badge-historical';
    dotColor = 'var(--amber-warning)';
    label = 'HISTÓRICO';
  } else if (normStatus === 'CRITICAL' || normStatus === 'CRÍTICO' || normStatus === 'LOSS_OF_SIGNAL') {
    badgeClass = 'badge-critical';
    dotColor = 'var(--red-critical)';
    label = normStatus === 'LOSS_OF_SIGNAL' ? 'SIN ENLACE' : 'CRÍTICO';
  }

  const dotSize = size === 'sm' ? 6 : 7;

  return (
    <span className={`badge-epistemic ${badgeClass}`}>
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block'
        }}
      />
      {showLabel && label}
    </span>
  );
};
