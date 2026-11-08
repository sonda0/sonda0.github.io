import React, { useState, useMemo } from 'react';
import { Anomaly, AnomalyState } from '../types/anomaly';
import { AnomalyCard } from '../components/AnomalyCard';
import { AlertOctagon, Search, ShieldAlert } from 'lucide-react';

interface AnomaliesProps {
  anomalies: Anomaly[];
  onSelect: (id: string) => void;
}

const ALL_STATES: AnomalyState[] = [
  'AWAITING_DATA',
  'HYPOTHESIS_REVISION',
  'UNDER_ANALYSIS',
  'DETECTED',
  'RESOLVED',
  'ARCHIVED'
];

export const Anomalies: React.FC<AnomaliesProps> = ({ anomalies, onSelect }) => {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return anomalies.filter((a) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const inId = a.id.toLowerCase().includes(q);
        const inTitle = a.title.toLowerCase().includes(q);
        const inDesc = a.description.toLowerCase().includes(q);
        const inType = a.type.toLowerCase().includes(q);
        if (!inId && !inTitle && !inDesc && !inType) {
          return false;
        }
      }

      if (stateFilter && a.state !== stateFilter) {
        return false;
      }

      return true;
    });
  }, [anomalies, search, stateFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Epistemic Policy Notice */}
      <div className="panel-card panel-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
          <div>
            <div className="panel-title" style={{ fontSize: '1rem', marginBottom: '4px' }}>
              <AlertOctagon size={18} style={{ color: 'var(--amber-warning)' }} />
              <span>EXPEDIENTES Y CATÁLOGO DE ANOMALÍAS DE ESPACIO PROFUNDO</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Catálogo de fenómenos anómalos detectados por el instrumental de Sonda 0. Exportación pública mediante lista blanca controlada.
            </p>
          </div>

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Mostrando <strong style={{ color: 'var(--amber-warning)' }}>{filtered.length}</strong> de {anomalies.length} anomalías
          </span>
        </div>

        {/* Epistemic disclaimer note */}
        <div
          style={{
            background: 'rgba(13, 23, 36, 0.6)',
            borderLeft: '3px solid var(--cyan-instrument)',
            padding: '10px 14px',
            borderRadius: '0 4px 4px 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <ShieldAlert size={16} style={{ color: 'var(--cyan-instrument)', flexShrink: 0 }} />
          <span>
            DISCIPLINA EPISTÉMICA EXODATA: Los parámetros geométricos o composicionales procedentes de registros únicos no confirmados instrumentalmente se clasifican bajo incertidumbre rigurosa.
          </span>
        </div>

        {/* Filter controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar anomalía (ej. HEX-04, pulsar, memoria)..."
              className="input-filter"
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>

          <select
            value={stateFilter || ''}
            onChange={(e) => setStateFilter(e.target.value || null)}
            className="input-filter"
          >
            <option value="">TODOS LOS ESTADOS DE INVESTIGACIÓN</option>
            {ALL_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Anomalies Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        {filtered.map((anomaly) => (
          <AnomalyCard
            key={anomaly.id}
            anomaly={anomaly}
            onSelect={onSelect}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-12 panel-card panel-body" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              No se encontraron anomalías coincidentes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
