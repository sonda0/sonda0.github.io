import React, { useState, useMemo } from 'react';
import { Transmission } from '../types/transmission';
import { TransmissionCard } from '../components/TransmissionCard';
import { Search, ArrowUpDown, Radio } from 'lucide-react';

interface TransmissionsProps {
  transmissions: Transmission[];
  onSelect: (id: string) => void;
}

export const Transmissions: React.FC<TransmissionsProps> = ({
  transmissions,
  onSelect
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    transmissions.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [transmissions]);

  // Filter and sort
  const filtered = useMemo(() => {
    return transmissions.filter((t) => {
      // Search matching title, id, summary, tags, paragraphs
      if (search.trim()) {
        const query = search.toLowerCase();
        const inId = t.id.toLowerCase().includes(query);
        const inTitle = t.title.toLowerCase().includes(query);
        const inSummary = t.summary.toLowerCase().includes(query);
        const inTags = t.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!inId && !inTitle && !inSummary && !inTags) {
          return false;
        }
      }

      // Tag filter
      if (selectedTag && !t.tags.includes(selectedTag)) {
        return false;
      }

      // Version filter
      if (selectedVersion && t.version !== selectedVersion) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.log_number - a.log_number;
      }
      return a.log_number - b.log_number;
    });
  }, [transmissions, search, selectedTag, selectedVersion, sortOrder]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and summary */}
      <div className="panel-card panel-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div className="panel-title" style={{ fontSize: '1rem', marginBottom: '4px' }}>
              <Radio size={18} />
              <span>ARCHIVO PÚBLICO DE TRANSMISIONES DE SONDA 0</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Registro cronológico inmutable de paquetes de telemetría y reportes científicos en el medio interestelar.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Mostrando <strong style={{ color: 'var(--cyan-instrument)' }}>{filtered.length}</strong> de {transmissions.length}
            </span>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="btn-primary"
              title="Cambiar orden cronológico"
            >
              <ArrowUpDown size={13} />
              <span>{sortOrder === 'desc' ? 'MÁS RECIENTES PRIMERO' : 'MÁS ANTIGUOS PRIMERO'}</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}
        >
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ID, título, contenido o etiqueta..."
              className="input-filter"
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>

          {/* Version Filter */}
          <select
            value={selectedVersion || ''}
            onChange={(e) => setSelectedVersion(e.target.value || null)}
            className="input-filter"
          >
            <option value="">TODAS LAS VERSIONES (V2, V3, V3.1)</option>
            <option value="V3.1">V3.1 (Actual / Rigor Epistémico)</option>
            <option value="V3.0">V3.0 (Transición)</option>
            <option value="V2.0">V2.0 (Histórico / Génesis)</option>
          </select>

          {/* Tag Filter */}
          <select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="input-filter"
          >
            <option value="">TODAS LAS ETIQUETAS ({allTags.length})</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </div>

        {/* Active filters reset */}
        {(search || selectedTag || selectedVersion) && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              Filtros activos:
            </span>
            {search && <span className="tag-chip active">Texto: "{search}"</span>}
            {selectedVersion && <span className="tag-chip active">Versión: {selectedVersion}</span>}
            {selectedTag && <span className="tag-chip active">Etiqueta: #{selectedTag}</span>}
            <button
              onClick={() => {
                setSearch('');
                setSelectedTag(null);
                setSelectedVersion(null);
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--red-critical)',
                marginLeft: '8px',
                textDecoration: 'underline'
              }}
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {/* Transmissions Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        {filtered.map((tx) => (
          <TransmissionCard
            key={tx.id}
            transmission={tx}
            onSelect={onSelect}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-12 panel-card panel-body" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '8px' }}>
              No se hallaron transmisiones coincidentes con los criterios de búsqueda.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedTag(null);
                setSelectedVersion(null);
              }}
              className="btn-primary"
            >
              Mostrar todas las transmisiones
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
