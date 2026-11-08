import React from 'react';
import {
  LayoutDashboard,
  Radio,
  AlertOctagon,
  Compass,
  Cpu,
  Share2,
  Info,
  LucideIcon
} from 'lucide-react';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', path: '/', label: 'DASHBOARD', icon: LayoutDashboard },
  { id: 'transmissions', path: '/transmisiones', label: 'TRANSMISIONES', icon: Radio },
  { id: 'anomalies', path: '/anomalias', label: 'ANOMALÍAS', icon: AlertOctagon },
  { id: 'navigation', path: '/navegacion', label: 'CARTOGRAFÍA', icon: Compass },
  { id: 'systems', path: '/sistemas', label: 'SISTEMAS', icon: Cpu },
  { id: 'comms', path: '/comunicaciones', label: 'COMUNICACIONES', icon: Share2 },
  { id: 'about', path: '/acerca-de', label: 'ACERCA DE', icon: Info }
];

export const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate }) => {
  return (
    <nav
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-panel)',
        padding: '0 20px',
        overflowX: 'auto',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          minWidth: 'max-content',
          margin: '0 auto',
          maxWidth: '1440px',
          width: '100%'
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? currentPath === '/' || currentPath === ''
              : currentPath.startsWith(item.path);

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.08em',
                color: isActive ? 'var(--cyan-instrument)' : 'var(--text-muted)',
                background: isActive ? 'rgba(69, 201, 216, 0.08)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--cyan-instrument)' : '2px solid transparent',
                borderRadius: '2px 2px 0 0',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} style={{ color: isActive ? 'var(--cyan-instrument)' : 'var(--text-muted)' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
