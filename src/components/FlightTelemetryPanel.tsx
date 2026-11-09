import React, { useState, useEffect, useCallback } from 'react';
import { FlightTelemetryCollection, FlightTelemetryParameter, FlightTelemetryCategory } from '../types/flightTelemetry';
import { FlightTelemetryCard } from './FlightTelemetryCard';
import { FlightTelemetryDetailPanel } from './FlightTelemetryDetailPanel';
import { loadFlightTelemetry, getParametersByCategory, getDashboardSummaryParameters, getCategoryColor, getCategoryLabel } from '../services/flightTelemetry';
import { BarChart2, RotateCcw, AlertTriangle, Info } from 'lucide-react';

interface FlightTelemetryPanelProps {
  /** Categorías a mostrar (todas por defecto) */
  categories?: FlightTelemetryCategory[];
  /** Modo compacto para Dashboard (6 indicadores) */
  compact?: boolean;
  /** Título del panel */
  title?: string;
  /** Callback para navegar a transmisión/anomalía */
  onSelectLog?: (logId: string) => void;
  /** Callback para navegar a anomalía */
  onSelectAnomaly?: (anomalyId: string) => void;
  /** Mostrar controles de categoría */
  showCategoryFilters?: boolean;
}

export const FlightTelemetryPanel: React.FC<FlightTelemetryPanelProps> = ({
  categories = ['NAVEGACION', 'AMBIENTE', 'ENERGIA', 'COMUNICACIONES', 'SISTEMAS'],
  compact = false,
  title = 'FLIGHT-TELEMETRY // PARÁMETROS DE VUELO',
  onSelectLog,
  showCategoryFilters = !compact
}) => {
  const [collection, setCollection] = useState<FlightTelemetryCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<FlightTelemetryParameter | null>(null);
  const [activeCategory, setActiveCategory] = useState<FlightTelemetryCategory | 'ALL'>('ALL');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadFlightTelemetry();
      if (data) {
        setCollection(data);
        setLastRefresh(new Date());
      } else {
        setError('No se pudo cargar flight-telemetry.json');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    // Forzar recarga limpiando caché
    localStorage.removeItem('flight-telemetry-cache');
    loadData();
  };

  // Parámetros a mostrar
  let displayParams: FlightTelemetryParameter[] = [];
  
  if (compact) {
    // Dashboard: 6 indicadores clave
    displayParams = getDashboardSummaryParameters(collection);
  } else if (activeCategory === 'ALL') {
    // Panel extendido: todas las categorías seleccionadas
    categories.forEach(cat => {
      displayParams.push(...getParametersByCategory(collection, cat));
    });
  } else {
    // Panel extendido: categoría específica
    displayParams = getParametersByCategory(collection, activeCategory);
  }

  if (loading) {
    return (
      <div className="flight-telemetry-panel" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
          <div style={{ 
            width: '32px', height: '32px', border: '3px solid var(--border-panel)', 
            borderTopColor: 'var(--cyan-instrument)', borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            CARGANDO TELEMETRÍA DE VUELO...
          </span>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flight-telemetry-panel" style={{ padding: '20px', textAlign: 'center', color: '#DC6471' }}>
        <AlertTriangle size={32} style={{ marginBottom: '12px' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          ERROR CARGANDO TELEMETRÍA
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '8px', color: 'var(--text-dim)' }}>
          {error}
        </div>
        <button onClick={handleRefresh} className="btn-primary" style={{ marginTop: '16px' }}>
          <RotateCcw size={14} /> REINTENTAR
        </button>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flight-telemetry-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>
        <Info size={32} style={{ marginBottom: '12px' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          SIN DATOS DE TELEMETRÍA DISPONIBLES
        </div>
      </div>
    );
  }

  // Agrupar por categoría para modo no compacto
  const paramsByCategory: Record<FlightTelemetryCategory, FlightTelemetryParameter[]> = {} as any;
  categories.forEach(cat => {
    paramsByCategory[cat] = getParametersByCategory(collection, cat);
  });

  const totalParams = collection.integrity.total_parameters;
  const withHistory = collection.integrity.with_historical_series;

  return (
    <div className="flight-telemetry-panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: compact ? '12px' : '16px',
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '12px',
        paddingBottom: compact ? '8px' : '12px',
        borderBottom: '1px solid var(--border-panel)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            width: '10px', height: '10px', borderRadius: '50%', 
            background: 'var(--cyan-instrument)',
            boxShadow: '0 0 8px var(--cyan-instrument)'
          }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: compact ? '0.95rem' : '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {title}
          </span>
          {!compact && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              v{collection.schema_version}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {!compact && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              <span>{totalParams} PARÁMETROS</span>
              <span style={{ color: '#42C8A2' }}>{withHistory} CON HISTORIAL</span>
              <span style={{ color: '#E8AA53' }}>{collection.integrity.stale_count} STALE</span>
              <span style={{ color: '#DC6471' }}>{collection.integrity.unknown_count} N/D</span>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            <span>ÚLTIMA ACTUALIZACIÓN:</span>
            <span style={{ color: 'var(--cyan-instrument)' }}>
              {lastRefresh ? lastRefresh.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
            </span>
            <button onClick={handleRefresh} className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.65rem' }} aria-label="Actualizar telemetría">
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros de categoría (solo modo extendido) */}
      {!compact && showCategoryFilters && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveCategory('ALL')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: `1px solid ${activeCategory === 'ALL' ? 'var(--cyan-instrument)' : 'var(--border-panel)'}`,
              background: activeCategory === 'ALL' ? 'rgba(69, 201, 216, 0.12)' : 'var(--bg-surface)',
              color: activeCategory === 'ALL' ? 'var(--cyan-instrument)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: activeCategory === 'ALL' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            TODAS ({totalParams})
          </button>
          {categories.map(cat => {
            const count = paramsByCategory[cat]?.length || 0;
            const color = getCategoryColor(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: `1px solid ${activeCategory === cat ? color : 'var(--border-panel)'}`,
                  background: activeCategory === cat ? `${color}20` : 'var(--bg-surface)',
                  color: activeCategory === cat ? color : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: activeCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                {getCategoryLabel(cat)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de tarjetas */}
      <div className="telemetry-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: compact ? 'repeat(auto-fit, minmax(220px, 1fr))' : 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: compact ? '12px' : '16px' 
      }}>
        {displayParams.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: 'var(--text-dim)',
            background: 'rgba(6, 11, 18, 0.4)',
            border: '1px dashed var(--border-panel)',
            borderRadius: '4px'
          }}>
            <Info size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              SIN PARÁMETROS EN ESTA CATEGORÍA
            </div>
          </div>
        ) : (
          displayParams.map(param => (
            <FlightTelemetryCard
              key={param.id}
              parameter={param}
              compact={compact}
              showCategory={!compact && activeCategory === 'ALL'}
              onClick={() => setSelectedParameter(param)}
            />
          ))
        )}
      </div>

      {/* Leyenda de estados epistemológicos (solo modo extendido) */}
      {!compact && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '12px', 
          paddingTop: '8px',
          borderTop: '1px dashed rgba(36, 59, 80, 0.4)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'var(--text-dim)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#45C9D8' }} />
            MEDIDO_NARRATIVO
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8AA53' }} />
            ESTIMADO
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#42C8A2' }} />
            HISTÓRICO
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC6471' }} />
            NO DETERMINADO
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8297A9' }} />
            OBSOLETO
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <BarChart2 size={10} style={{ color: '#42C8A2' }} /> = Historial
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={10} style={{ color: '#E8AA53' }} /> = STALE
          </span>
        </div>
      )}

      {/* Panel de detalle */}
      {selectedParameter && (
        <FlightTelemetryDetailPanel
          parameter={selectedParameter}
          onClose={() => setSelectedParameter(null)}
          onSelectRelated={onSelectLog}
          allParameters={collection.parameters}
        />
      )}
    </div>
  );
};