import React, { useState } from 'react';
import { SystemsData } from '../types/systems';
import { SystemPanel } from '../components/SystemPanel';
import { Cpu } from 'lucide-react';

interface SystemsProps {
  systemsData: SystemsData;
}

export const Systems: React.FC<SystemsProps> = ({ systemsData }) => {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = Array.from(new Set(systemsData.subsystems.map((s) => s.category)));

  const filtered = categoryFilter
    ? systemsData.subsystems.filter((s) => s.category === categoryFilter)
    : systemsData.subsystems;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Disclaimers */}
      <div className="panel-card panel-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
          <div>
            <div className="panel-title" style={{ fontSize: '1rem', marginBottom: '4px' }}>
              <Cpu size={18} />
              <span>ESTADO DE SUBSISTEMAS DE VUELO Y ARQUITECTURA DE CÓMPUTO</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Monitor de telemetría de subsistemas a bordo, módulos de procesamiento inmutable y reservas energéticas.
            </p>
          </div>

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {systemsData.subsystems.length} SUBSISTEMAS REGISTRADOS
          </span>
        </div>

        {/* Dual status policy banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div
            style={{
              background: 'rgba(69, 201, 216, 0.08)',
              border: '1px solid rgba(69, 201, 216, 0.3)',
              borderRadius: '4px',
              padding: '10px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-main)'
            }}
          >
            <strong style={{ color: 'var(--cyan-instrument)', display: 'block', marginBottom: '4px' }}>
              // ESTADO NARRATIVO
            </strong>
            Condición simulada de los subsistemas físicos dentro del universo de ciencia ficción de Sonda 0 a 169 AU del Sol.
          </div>

          <div
            style={{
              background: 'rgba(66, 200, 162, 0.08)',
              border: '1px solid rgba(66, 200, 162, 0.3)',
              borderRadius: '4px',
              padding: '10px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-main)'
            }}
          >
            <strong style={{ color: 'var(--green-operational)', display: 'block', marginBottom: '4px' }}>
              // ESTADO DE PLATAFORMA
            </strong>
            Información técnica pública y verificable sobre la disponibilidad, integridad y consistencia del archivo estático.
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => setCategoryFilter(null)}
            className={`btn-primary ${!categoryFilter ? 'btn-active' : ''}`}
            style={{ fontSize: '0.74rem' }}
          >
            TODOS LOS SUBSISTEMAS
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`btn-primary ${categoryFilter === cat ? 'btn-active' : ''}`}
              style={{ fontSize: '0.74rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Subsystems Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '20px'
        }}
      >
        {filtered.map((sys) => (
          <SystemPanel key={sys.id} system={sys} />
        ))}
      </div>
    </div>
  );
};
