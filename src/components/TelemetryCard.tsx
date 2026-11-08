import React from 'react';
import { TelemetryItem } from '../types/mission';
import { StatusIndicator } from './StatusIndicator';

interface TelemetryCardProps {
  item: TelemetryItem;
  icon?: React.ReactNode;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({ item, icon }) => {
  return (
    <div className="telemetry-card">
      <div className="reticle-corner reticle-tl" />
      <div className="reticle-corner reticle-tr" />
      <div className="reticle-corner reticle-bl" />
      <div className="reticle-corner reticle-br" />

      <div className="telemetry-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          <span className="telemetry-label">{item.label}</span>
        </div>
        <StatusIndicator status={item.classification} size="sm" />
      </div>

      <div className="telemetry-value">
        {item.value}
      </div>

      {item.notes && (
        <div className="telemetry-notes">
          {item.notes}
        </div>
      )}
    </div>
  );
};
