import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const MissionClock: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const utcTime = now.toUTCString().replace('GMT', 'UTC');
  const secondsInHour = now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const nextCycleSeconds = 3600 - secondsInHour;
  const cycleMinutes = Math.floor(nextCycleSeconds / 60);
  const cycleSecs = nextCycleSeconds % 60;

  return (
    <div className="flex items-center gap-4 font-mono text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Clock size={13} style={{ color: 'var(--cyan-instrument)' }} />
        <span>RELOJ UTC: <strong style={{ color: 'var(--text-main)' }}>{utcTime}</strong></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-panel)', paddingLeft: '12px' }}>
        <span style={{ color: 'var(--amber-warning)' }}>CICLO TX:</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
          T-{String(cycleMinutes).padStart(2, '0')}:{String(cycleSecs).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
