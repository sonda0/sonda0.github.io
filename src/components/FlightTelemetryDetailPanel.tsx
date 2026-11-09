import React, { useState } from 'react';
import { FlightTelemetryParameter } from '../types/flightTelemetry';
import { FlightTelemetryCard } from './FlightTelemetryCard';
import { getEpistemicStateColor, getCategoryColor, getEpistemicStateLabel, getCategoryLabel, hasValidHistoricalSeries, getSubjectTypeLabel, getMeasurementTypeLabel, getQuantityKindLabel, getReferenceFrameLabel } from '../services/flightTelemetry';
import {
  X,
  Clock,
  Database,
  AlertTriangle,
  Info,
  ExternalLink,
  BarChart2,
  RotateCcw,
  Compass,
  Calculator
} from 'lucide-react';

interface FlightTelemetryDetailPanelProps {
  parameter: FlightTelemetryParameter | null;
  onClose: () => void;
  onSelectRelated?: (logId: string) => void;
  allParameters?: FlightTelemetryParameter[];
}

export const FlightTelemetryDetailPanel: React.FC<FlightTelemetryDetailPanelProps> = ({
  parameter,
  onClose,
  onSelectRelated,
  allParameters = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'sources'>('overview');
  
  if (!parameter) return null;
  
  const epistemicColor = getEpistemicStateColor(parameter.epistemicState);
  const categoryColor = getCategoryColor(parameter.category);
  const hasHistory = hasValidHistoricalSeries(parameter);
  const isUnknown = parameter.epistemicState === 'UNKNOWN';
  const isConflicting = parameter.epistemicState === 'CONFLICTING';
  
  // Encontrar parámetros relacionados (misma categoría)
  const relatedParams = allParameters.filter(p => 
    p.category === parameter.category && p.id !== parameter.id
  ).slice(0, 4);

  return (
    <div className="flight-telemetry-detail-panel" style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      bottom: 0, 
      width: '480px', 
      maxWidth: '100vw',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-panel)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-mono)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-panel)',
        background: 'rgba(6, 11, 18, 0.9)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: categoryColor,
              boxShadow: `0 0 8px ${categoryColor}66`
            }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {parameter.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span className="tag-chip" style={{ fontSize: '0.6rem', background: `${categoryColor}20`, color: categoryColor, border: `1px solid ${categoryColor}40` }}>
                {getCategoryLabel(parameter.category)}
              </span>
              <StatusIndicator status={parameter.epistemicState} size="sm" />
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="btn-primary"
          style={{ padding: '6px 10px', fontSize: '0.7rem' }}
          aria-label="Cerrar panel de detalle"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-panel)',
        background: 'rgba(6, 11, 18, 0.6)',
        flexShrink: 0
      }}>
        {[
          { id: 'overview', label: 'VISIÓN GENERAL', icon: Info },
          { id: 'history', label: 'HISTORIAL', icon: BarChart2, disabled: !hasHistory },
          { id: 'sources', label: 'FUENTES', icon: Database }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id as typeof activeTab)}
            disabled={tab.disabled}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              background: activeTab === tab.id ? 'rgba(69, 201, 216, 0.1)' : 'transparent',
              color: tab.disabled ? 'var(--text-dim)' : (activeTab === tab.id ? 'var(--cyan-instrument)' : 'var(--text-muted)'),
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: activeTab === tab.id ? '2px solid var(--cyan-instrument)' : '2px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <tab.icon size={12} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Valor principal */}
            <div style={{
              background: 'rgba(6, 11, 18, 0.6)',
              border: `1px solid ${epistemicColor}40`,
              borderRadius: '4px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                VALOR ACTUAL
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: isUnknown ? '#DC6471' : 'var(--text-main)' }}>
                {parameter.value !== null && parameter.value !== undefined ? parameter.value : 'NO DETERMINADO'}
                {parameter.unit && parameter.unit !== 'estado' && parameter.unit !== 'vector' && parameter.unit !== 'grados' && (
                  <span style={{ fontSize: '0.6em', fontWeight: 400, color: 'var(--text-dim)', marginLeft: '8px' }}>
                    {parameter.unit}
                  </span>
                )}
              </div>
              {(parameter.unit === 'estado' || parameter.unit === 'vector' || parameter.unit === 'grados') && (
                <div style={{ marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {parameter.unit.toUpperCase()}
                </div>
              )}
            </div>

            {/* Metadatos clave */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '4px' }}>ID PARÁMETRO</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cyan-instrument)', fontWeight: 600 }}>{parameter.id}</div>
              </div>
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '4px' }}>ESTADO VALIDEZ</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 
                  parameter.validityState === 'VALID' ? '#42C8A2' : 
                  parameter.validityState === 'STALE' ? '#E8AA53' : '#DC6471'
                }}>
                  {parameter.validityState}
                </div>
              </div>
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '4px' }}>FECHA OBSERVACIÓN</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  {new Date(parameter.observationDate).toLocaleString('es-ES', { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })} UTC
                </div>
              </div>
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '4px' }}>LOG DE PROCEDENCIA</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-main)' }}>{parameter.provenanceLog}</div>
              </div>
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '4px' }}>SUJETO DE OBSERVACIÓN</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                  {getSubjectTypeLabel(parameter.subjectType)}: {parameter.subjectId}
                </div>
              </div>
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '4px' }}>TIPO DE MEDICIÓN</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                  {getMeasurementTypeLabel(parameter.measurementType)}
                </div>
              </div>
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '4px' }}>GRANDEZA FÍSICA</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                  {getQuantityKindLabel(parameter.quantityKind)}
                </div>
              </div>
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '4px' }}>MARCO DE REFERENCIA</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                  {parameter.referenceFrame ? getReferenceFrameLabel(parameter.referenceFrame) : 'N/A'}
                </div>
              </div>
            </div>

            {/* Incertidumbre */}
            <div style={{
              background: isConflicting ? 'rgba(232, 170, 83, 0.12)' : 'rgba(220, 100, 113, 0.08)',
              borderLeft: `3px solid ${isConflicting ? '#E8AA53' : '#DC6471'}`,
              padding: '12px 16px',
              borderRadius: '0 4px 4px 0',
              border: `1px solid ${isConflicting ? 'rgba(232, 170, 83, 0.3)' : 'rgba(220, 100, 113, 0.3)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: isConflicting ? '#E8AA53' : '#DC6471', flexShrink: 0, marginTop: '1px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: isConflicting ? '#E8AA53' : '#DC6471', marginBottom: '4px', textTransform: 'uppercase' }}>
                    {isConflicting ? 'DATOS CONFLICTIVOS DETECTADOS' : 'DECLARACIÓN DE INCERTIDUMBRE'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {parameter.uncertainty}
                  </div>
                </div>
              </div>
            </div>

            {/* Notas */}
            {parameter.notes && (
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--cyan-instrument)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  NOTAS ADICIONALES
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{parameter.notes}</div>
              </div>
            )}

            {/* Parámetros relacionados */}
            {relatedParams.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--cyan-instrument)', marginBottom: '10px', textTransform: 'uppercase' }}>
                  PARÁMETROS RELACIONADOS ({getCategoryLabel(parameter.category)})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {relatedParams.map(p => (
                    <FlightTelemetryCard
                      key={p.id}
                      parameter={p}
                      compact={true}
                      onClick={() => {/* TODO: navegar a parámetro relacionado */}}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && hasHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#42C8A2' }}>
              <BarChart2 size={16} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                SERIE HISTÓRICA DOCUMENTADA ({parameter.historicalSeries!.length} PUNTOS)
              </span>
            </div>
            
            <div style={{ 
              background: 'rgba(6, 11, 18, 0.6)', 
              border: '1px solid var(--border-panel)', 
              borderRadius: '4px', 
              overflow: 'hidden' 
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(69, 201, 216, 0.1)', borderBottom: '1px solid var(--border-panel)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--cyan-instrument)', fontWeight: 600 }}>FECHA (UTC)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--cyan-instrument)', fontWeight: 600 }}>VALOR</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--cyan-instrument)', fontWeight: 600 }}>FUENTE</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--cyan-instrument)', fontWeight: 600 }}>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {parameter.historicalSeries!.map((point, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < parameter.historicalSeries!.length - 1 ? '1px solid rgba(36, 59, 80, 0.3)' : 'none' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>
                        {new Date(point.date).toLocaleString('es-ES', { 
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>
                        {point.value}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                        {point.source}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <StatusIndicator status={point.epistemicState} size="xs" showLabel={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              * Solo se muestran puntos con valores documentados y comparables. No se interpola ni extrapola.
            </div>
          </div>
        )}

        {activeTab === 'history' && !hasHistory && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '200px',
            color: 'var(--text-dim)',
            textAlign: 'center',
            padding: '20px'
          }}>
            <BarChart2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '8px' }}>
              SIN SERIE HISTÓRICA DISPONIBLE
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.5, maxWidth: '300px' }}>
              Este parámetro no tiene al menos dos puntos de datos comparables y documentados 
              en las bitácoras públicas. No se dibujan gráficas falsas ni interpolaciones arbitrarias.
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Fuente documental principal */}
            <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--cyan-instrument)' }}>
                <Database size={16} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  FUENTE DOCUMENTAL PRINCIPAL
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {parameter.documentarySource}
              </div>
            </div>

            {/* Método de derivación */}
            {parameter.derivationMethod && (
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#E8AA53' }}>
                  <Calculator size={16} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    MÉTODO DE DERIVACIÓN
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {parameter.derivationMethod}
                </div>
              </div>
            )}

            {/* Marco de referencia */}
            {parameter.referenceFrame && parameter.referenceFrame !== 'NONE' && (
              <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#45C9D8' }}>
                  <Compass size={16} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    MARCO DE REFERENCIA
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {getReferenceFrameLabel(parameter.referenceFrame)}
                </div>
              </div>
            )}

            {/* LOG de procedencia */}
            <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: '1px solid var(--border-panel)', borderRadius: '4px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#E8AA53' }}>
                <Clock size={16} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  LOG DE PROCEDENCIA
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {parameter.provenanceLog}
              </div>
              {parameter.provenanceLog !== 'N/A' && onSelectRelated && parameter.provenanceLog.includes('LOG-') && (
                <div style={{ marginTop: '12px' }}>
                  {parameter.provenanceLog.split(',').map(log => log.trim()).filter(l => l.startsWith('LOG-')).map(logId => (
                    <button
                      key={logId}
                      onClick={() => onSelectRelated(logId)}
                      className="btn-primary"
                      style={{ marginRight: '8px', marginBottom: '8px', fontSize: '0.7rem' }}
                    >
                      <ExternalLink size={12} style={{ color: 'var(--cyan-instrument)' }} />
                      <span>Ver {logId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clasificación epistemológica */}
            <div style={{ background: 'rgba(6, 11, 18, 0.6)', border: `1px solid ${epistemicColor}40`, borderRadius: '4px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: epistemicColor
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: epistemicColor }}>
                  CLASIFICACIÓN EPISTÉMICA: {getEpistemicStateLabel(parameter.epistemicState)}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {(() => {
                  switch (parameter.epistemicState) {
                    case 'MEASURED_NARRATIVE':
                      return 'Valor narrado en bitácora de vuelo; NO representa una medición instrumental de una nave real. Procede de informes narrativos (LOG) sin verificación instrumental independiente.';
                    case 'ESTIMATED':
                      return 'Valor calculado a partir de un modelo físico (curva de decaimiento, propagación orbital) o extrapolación de datos limitados. Incluye incertidumbre del modelo.';
                    case 'HISTORICAL':
                      return 'Registro histórico documentado en bitácoras de vuelo (LOG-XXXX). Valor observado en un momento pasado; puede estar obsoleto (STALE) si no hay actualización reciente.';
                    case 'UNKNOWN':
                      return 'Sin información documental en fuentes públicas. El parámetro no ha sido medido, estimado ni reportado en bitácoras disponibles.';
                    case 'CONFLICTING':
                      return 'Existen datos contradictorios entre diferentes fuentes documentales. Se conservan todas las procedencias y se marca como conflictivo.';
                    case 'STALE':
                      return 'Dato histórico sin actualización confirmada en ciclos recientes. La observación es antigua y su vigencia actual no está verificada.';
                    default:
                      return 'Clasificación no reconocida.';
                  }
                })()}
              </div>
            </div>

            {/* Generación */}
            <div style={{ 
              background: 'rgba(69, 201, 216, 0.05)', 
              border: '1px solid rgba(69, 201, 216, 0.2)', 
              borderRadius: '4px', 
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-dim)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <RotateCcw size={12} style={{ color: 'var(--cyan-instrument)' }} />
                <span>GENERADO DETERMINISTAMENTE</span>
              </div>
              <div>Este parámetro fue extraído automáticamente desde fuentes documentadas públicas (mission.json, transmissions.json, systems.json, anomaly_catalog.json, LOG-XXXX.md) mediante build_flight_telemetry.py.</div>
              <div style={{ marginTop: '4px' }}>El generador es idempotente: misma entrada → misma salida. No se inventan valores.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// StatusIndicator inline para evitar importación circular
const StatusIndicator: React.FC<{ 
  status: string; 
  size?: 'xs' | 'sm' | 'md'; 
  showLabel?: boolean 
}> = ({ status, size = 'sm', showLabel = true }) => {
  const colors: Record<string, string> = {
    MEASURED_NARRATIVE: '#45C9D8',
    ESTIMATED: '#E8AA53',
    HISTORICAL: '#42C8A2',
    UNKNOWN: '#DC6471',
    CONFLICTING: '#E8AA53',
    STALE: '#8297A9',
    MEASURED: '#45C9D8'
  };
  const labels: Record<string, string> = {
    MEASURED_NARRATIVE: 'MEDIDO_NARRATIVO',
    ESTIMATED: 'ESTIMADO',
    HISTORICAL: 'HISTÓRICO',
    UNKNOWN: 'NO DETERMINADO',
    CONFLICTING: 'CONFLICTIVO',
    STALE: 'OBSOLETO',
    MEASURED: 'MEDIDO'
  };
  const color = colors[status] || '#8297A9';
  const label = labels[status] || status;
  
  const sizeMap = { xs: 6, sm: 8, md: 10 };
  const dotSize = sizeMap[size];
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: showLabel ? 4 : 0 }}>
      <span style={{ width: dotSize, height: dotSize, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 ${dotSize}px ${color}80` }} />
      {showLabel && <span style={{ fontFamily: 'var(--font-mono)', fontSize: size === 'xs' ? '0.55rem' : size === 'sm' ? '0.6rem' : '0.7rem', color, fontWeight: 600 }}>{label}</span>}
    </span>
  );
};