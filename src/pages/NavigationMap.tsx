import React, { useState, useMemo } from 'react';
import { Anomaly } from '../types/anomaly';
import { Transmission } from '../types/transmission';
import { MissionState } from '../types/mission';
import {
  buildNavigationObjects,
  buildTrajectoryProgression,
  extractNavigationTelemetry
} from '../services/navigationData';
import { StatusIndicator } from '../components/StatusIndicator';
import { FlightTelemetryPanel } from '../components/FlightTelemetryPanel';
import {
  Compass,
  AlertTriangle,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Radio,
  Layers,
  ArrowRight,
  ShieldAlert,
  Activity
} from 'lucide-react';

interface NavigationMapProps {
  mission?: MissionState | null;
  anomalies?: Anomaly[];
  transmissions?: Transmission[];
  onSelectAnomaly?: (id: string) => void;
  onSelectTransmission?: (id: string) => void;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({
  mission = null,
  anomalies = [],
  transmissions = [],
  onSelectAnomaly,
  onSelectTransmission
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Navigation catalog & telemetry model
  const navObjects = useMemo(() => buildNavigationObjects(anomalies), [anomalies]);
  const trajectoryPoints = useMemo(() => buildTrajectoryProgression(transmissions), [transmissions]);
  const telemetry = useMemo(() => extractNavigationTelemetry(mission), [mission]);

  // Default selected object: SONDA 0
  const [selectedId, setSelectedId] = useState<string>('NAV-SONDA-0');

  const selectedObject = useMemo(() => {
    return navObjects.find(o => o.id === selectedId) || navObjects[0] || null;
  }, [navObjects, selectedId]);

  // Separate visual vs unlocalized objects
  const mapObjects = useMemo(() => navObjects.filter(o => o.hasVisualCoordinates), [navObjects]);
  const unlocalizedObjects = useMemo(() => navObjects.filter(o => !o.hasVisualCoordinates), [navObjects]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only left click initiates pan
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="navigation-control-v2">
      {/* 1. Header con Disciplina Epistémica Rigurosa */}
      <div className="panel-card panel-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
          <div>
            <div className="panel-title" style={{ fontSize: '1.05rem', marginBottom: '4px' }}>
              <Compass size={18} />
              <span>NAVIGATION-CONTROL V2.0 // ESTADO DE NAVEGACIÓN Y DERIVA</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Consola interactiva de telemetría heliocéntrica, proyección topológica ordinal y catálogo de anomalías en espacio profundo.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(232, 170, 83, 0.12)',
              border: '1px solid var(--amber-warning)',
              color: 'var(--amber-warning)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={15} />
            <span>VISTA CONCEPTUAL // NO A ESCALA // POSICIÓN NO CONFIRMADA</span>
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          * En estricto cumplimiento de EXODATA V3.1: Las fronteras heliosféricas son asimétricas y dinámicas. Las distancias no representan escalas métricas astronómicas exactas. Las anomalías sin vector se clasifican expresamente con POSICIÓN NO DETERMINADA.
        </p>
      </div>

      {/* 2. Área Tripartita de Navegación: Panel de Telemetría */}
      <div
        className="panel-card panel-body"
        style={{
          background: 'rgba(13, 23, 36, 0.85)',
          borderLeft: '4px solid var(--cyan-instrument)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: '4px' }}>
            DISTANCIA ESTIMADA AL SOL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {telemetry.currentDistanceAu}
            </span>
            <StatusIndicator status={telemetry.distanceClassification} size="sm" />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--amber-warning)' }}>
            [MODELO CONGELADO / LOG-0016]
          </span>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: '4px' }}>
            ORIENTACIÓN INSTRUMENTAL / VELOCIDAD
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--cyan-instrument)', marginBottom: '2px' }}>
            {telemetry.chassisOrientation}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--yellow-warning)', marginBottom: '2px' }}>
            {telemetry.inertialVelocityVector}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Giro de chasis 112° (LOG-0000) / Vector inercial sin solución
          </span>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: '4px' }}>
            MARCO DE REFERENCIA ORBITAL
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
            {telemetry.orbitalFrame}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Propagación inercial sin empuje
          </span>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: '4px' }}>
            ÚLTIMO REPORTE DE TELEMETRÍA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--green-operational)' }}>
              {telemetry.lastTelemetryLog}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              ({telemetry.lastTelemetryDate.split('T')[0]})
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {telemetry.propagationPolicy}
          </span>
        </div>
      </div>

      {/* 3. Panel Principal: Cartografía Interactiva SVG y Panel de Objetos Lateral */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Canvas de Cartografía */}
        <div className="panel-card" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Controles de Zoom, Desplazamiento y Reset */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10,
              display: 'flex',
              gap: '6px',
              background: 'rgba(6, 11, 18, 0.75)',
              padding: '4px',
              borderRadius: '6px',
              border: '1px solid var(--border-panel)'
            }}
          >
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
              className="btn-primary"
              aria-label="Aumentar Zoom"
              title="Aumentar Zoom"
              style={{ padding: '6px 10px' }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.6))}
              className="btn-primary"
              aria-label="Reducir Zoom"
              title="Reducir Zoom"
              style={{ padding: '6px 10px' }}
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={resetView}
              className="btn-primary"
              aria-label="Restablecer vista"
              title="Restablecer vista"
              style={{ padding: '6px 10px' }}
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Canvas SVG Interactivo */}
          <div
            style={{
              width: '100%',
              overflow: 'hidden',
              background: '#05090F',
              cursor: isPanning ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg
              viewBox="0 0 1000 600"
              style={{
                width: '100%',
                minWidth: '650px',
                height: 'auto',
                display: 'block',
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: '500px 300px',
                transition: isPanning ? 'none' : 'transform 0.15s ease'
              }}
            >
              <defs>
                <radialGradient id="sunGlowV2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F4D06F" stopOpacity="0.85" />
                  <stop offset="40%" stopColor="#E8AA53" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F4D06F" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="probeGlowV2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#45C9D8" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#45C9D8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#45C9D8" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="escapeVectorV2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F4D06F" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#45C9D8" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#45C9D8" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Cuadrícula astrométrica de referencia */}
              <g stroke="#122034" strokeWidth="1" strokeDasharray="4 8">
                {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
                  <line key={`gx-${x}`} x1={x} y1="0" x2={x} y2="600" />
                ))}
                {[100, 200, 300, 400, 500].map((y) => (
                  <line key={`gy-${y}`} x1="0" y1={y} x2="1000" y2={y} />
                ))}
              </g>

              {/* Fronteras Heliosféricas con contorno asimétrico elíptico */}
              {/* 1. Cinturón de Kuiper */}
              <ellipse cx="180" cy="300" rx="125" ry="110" fill="none" stroke="#243B50" strokeWidth="1.2" strokeDasharray="4 4" />
              <text x="270" y="215" fill="#506677" fontSize="10" fontFamily="var(--font-mono)">CINTURÓN DE KUIPER (~50 AU)</text>

              {/* 2. Choque de Terminación */}
              <path
                d="M 180 80 C 340 90, 470 190, 470 300 C 470 410, 340 510, 180 520"
                fill="none"
                stroke="rgba(69, 201, 216, 0.25)"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
              <text x="400" y="160" fill="#45C9D8" fontSize="10" fontFamily="var(--font-mono)">CHOQUE DE TERMINACIÓN (~94 AU)</text>

              {/* 3. Heliopausa (Frontera magnética interestelar asimétrica) */}
              <path
                d="M 180 30 C 400 45, 570 160, 570 300 C 570 440, 400 555, 180 570"
                fill="none"
                stroke="rgba(66, 200, 162, 0.25)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text x="490" y="115" fill="#42C8A2" fontSize="10" fontFamily="var(--font-mono)">HELIOPAUSA (~120 AU)</text>

              {/* Vector de Escape Histórico de SONDA 0 */}
              <path
                d="M 180 300 Q 430 305 680 260"
                fill="none"
                stroke="url(#escapeVectorV2)"
                strokeWidth="2.2"
                strokeDasharray="4 2"
              />

              {/* Línea de Observación de SONDA 0 hacia WISE-0001 (0.04 AL) */}
              <line
                x1="680"
                y1="260"
                x2="840"
                y2="190"
                stroke="#E8AA53"
                strokeWidth="1.4"
                strokeDasharray="3 3"
                opacity="0.75"
              />
              <text x="735" y="215" fill="#E8AA53" fontSize="9" fontFamily="var(--font-mono)">
                EJE OBSERVACIÓN ~0.04 AL
              </text>

              {/* 1. Sol */}
              <circle cx="180" cy="300" r="30" fill="url(#sunGlowV2)" />
              <circle cx="180" cy="300" r="9" fill="#F4D06F" />
              <text x="162" y="325" fill="#F4D06F" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold">SOL</text>

              {/* 2. Sonda 0 */}
              <circle cx="680" cy="260" r="26" fill="url(#probeGlowV2)" />
              <circle cx="680" cy="260" r="7" fill="#45C9D8" />
              <circle cx="680" cy="260" r="16" fill="none" stroke="#45C9D8" strokeWidth="1.2" strokeDasharray="3 2" />
              <text x="640" y="295" fill="#45C9D8" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold">SONDA 0</text>
              <text x="635" y="310" fill="#8297A9" fontSize="9" fontFamily="var(--font-mono)">169.34 AU [Congelado]</text>

              {/* 3. Enana Marrón WISE-0001 (Entidad física distinta) */}
              <circle cx="840" cy="190" r="14" fill="rgba(196, 154, 69, 0.25)" />
              <circle cx="840" cy="190" r="6" fill="#C49A45" />
              <text x="800" y="218" fill="#C49A45" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold">WISE-0001</text>
              <text x="805" y="230" fill="#8297A9" fontSize="8" fontFamily="var(--font-mono)">Enana Marrón</text>

              {/* 4. Objeto Hexagonal HEX-04 (Órbita sobre WISE-0001; período orbital no confirmado) */}
              <circle cx="840" cy="190" r="24" fill="none" stroke="#E8AA53" strokeWidth="1" strokeDasharray="2 2" />
              <polygon
                points="855,170 861,173 861,180 855,183 849,180 849,173"
                fill="rgba(232, 170, 83, 0.35)"
                stroke="#E8AA53"
                strokeWidth="1.5"
              />
              <text x="866" y="178" fill="#E8AA53" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold">HEX-04</text>

              {/* Hotspots interactivos accesibles con teclado */}
              {mapObjects.map((obj) => {
                if (obj.x === undefined || obj.y === undefined) return null;
                const isSelected = selectedId === obj.id;
                return (
                  <g
                    key={obj.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Seleccionar ${obj.name}`}
                    style={{ outline: 'none', cursor: 'pointer' }}
                    onClick={() => setSelectedId(obj.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(obj.id);
                      }
                    }}
                  >
                    {/* Ring selector indicator */}
                    {isSelected && (
                      <circle
                        cx={obj.x}
                        cy={obj.y}
                        r={(obj.radius || 6) + 10}
                        fill="none"
                        stroke="var(--cyan-instrument)"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                    )}
                    <circle
                      cx={obj.x}
                      cy={obj.y}
                      r={Math.max((obj.radius || 6) + 12, 18)}
                      fill="transparent"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Panel inferior contextual del objeto seleccionado */}
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-panel)'
            }}
          >
            {selectedObject ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: selectedObject.color,
                        boxShadow: `0 0 8px ${selectedObject.color}66`
                      }}
                    />
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                      {selectedObject.name}
                    </h3>
                    <span className="tag-chip" style={{ fontSize: '0.7rem' }}>
                      {selectedObject.type}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cyan-instrument)', fontWeight: 600 }}>
                      {selectedObject.distanceOrigin === 'SOLAR_ORIGIN'
                        ? `DISTANCIA HELIOCÉNTRICA: ${selectedObject.distanceValue} ${selectedObject.distanceUnit}`
                        : selectedObject.distanceOrigin === 'RELATIVE_TO_PROBE'
                        ? `DISTANCIA A SONDA 0: ${selectedObject.distanceValue}`
                        : `ESTADO: ${selectedObject.distanceValue}`}
                    </span>
                    <StatusIndicator status={selectedObject.epistemicClass} size="sm" />
                  </div>
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {selectedObject.description}
                </p>

                {/* Parámetros físicos e incertidumbre */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '10px',
                    background: 'rgba(6, 11, 18, 0.65)',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-panel)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    marginBottom: '10px'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>FUENTE DOCUMENTAL: </span>
                    <span style={{ color: 'var(--text-main)' }}>{selectedObject.documentarySource}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>ORIGEN DE DISTANCIA: </span>
                    <span style={{ color: 'var(--cyan-instrument)' }}>{selectedObject.distanceOrigin}</span>
                  </div>
                  {selectedObject.physicalNotes && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--text-dim)' }}>NOTAS FÍSICAS: </span>
                      <span style={{ color: 'var(--text-muted)' }}>{selectedObject.physicalNotes}</span>
                    </div>
                  )}
                </div>

                {/* Declaración de Incertidumbre */}
                <div
                  style={{
                    background: 'rgba(232, 170, 83, 0.08)',
                    borderLeft: '3px solid var(--amber-warning)',
                    padding: '8px 12px',
                    borderRadius: '0 4px 4px 0',
                    fontSize: '0.78rem',
                    color: 'var(--amber-warning)',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>INCERTIDUMBRE: {selectedObject.uncertaintyStatement}</span>
                </div>

                {/* Acciones directas (abrir anomalía o transmisión) */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedObject.relatedAnomalyId && onSelectAnomaly && (
                    <button
                      onClick={() => onSelectAnomaly(selectedObject.relatedAnomalyId!)}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <ShieldAlert size={13} style={{ color: 'var(--amber-warning)' }} />
                      <span>Ver Expediente {selectedObject.relatedAnomalyId}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                  {selectedObject.relatedTransmissionId && onSelectTransmission && (
                    <button
                      onClick={() => onSelectTransmission(selectedObject.relatedTransmissionId!)}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Radio size={13} style={{ color: 'var(--cyan-instrument)' }} />
                      <span>Ver Bitácora {selectedObject.relatedTransmissionId}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                <Info size={14} />
                <span>Haga clic sobre cualquier marcador en el mapa para consultar la telemetría del sector.</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Panel de Objetos y Anomalías no Localizadas (Sidebar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* A. Selector de Objetos Mapeados */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Layers size={15} />
                <span>REGIONES Y CUERPOS CARTOGRAFIADOS ({mapObjects.length})</span>
              </div>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
              {mapObjects.map((obj) => {
                const isSelected = selectedId === obj.id;
                return (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedId(obj.id)}
                    style={{
                      background: isSelected ? 'rgba(69, 201, 216, 0.12)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--cyan-instrument)' : 'var(--border-panel)'}`,
                      borderRadius: '4px',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: obj.color
                          }}
                        />
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {obj.name}
                        </span>
                      </div>
                      <StatusIndicator status={obj.epistemicClass} size="sm" showLabel={false} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>{obj.type}</span>
                      <span style={{ color: 'var(--cyan-instrument)' }}>{obj.distanceValue} {obj.distanceUnit}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. Anomalías de Posición no Determinada */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title" style={{ color: 'var(--red-critical)' }}>
                <ShieldAlert size={15} />
                <span>ANOMALÍAS: POSICIÓN NO DETERMINADA ({unlocalizedObjects.length})</span>
              </div>
            </div>

            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', margin: '0 0 6px 0' }}>
                * No se asignan coordenadas topológicas ficticias a señales sin triangulación confirmada.
              </p>

              {unlocalizedObjects.map((obj) => {
                const isSelected = selectedId === obj.id;
                return (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedId(obj.id)}
                    style={{
                      background: isSelected ? 'rgba(220, 100, 113, 0.12)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--red-critical)' : 'var(--border-panel)'}`,
                      borderRadius: '4px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {obj.name}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          background: 'rgba(220, 100, 113, 0.15)',
                          color: 'var(--red-critical)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          border: '1px solid rgba(220, 100, 113, 0.3)'
                        }}
                      >
                        POSICIÓN NO DETERMINADA
                      </span>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                      {obj.description.length > 110 ? `${obj.description.slice(0, 110)}...` : obj.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Fuente: {obj.documentarySource}
                      </span>
                      {obj.relatedAnomalyId && onSelectAnomaly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAnomaly(obj.relatedAnomalyId!);
                          }}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.72rem',
                            color: 'var(--cyan-instrument)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Expediente <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FLIGHT-TELEMETRY PANEL // Panel Extendido de Telemetría de Vuelo */}
      <div className="panel-card panel-body">
        <FlightTelemetryPanel
          title="FLIGHT-TELEMETRY V1.0 // PANEL EXTENDIDO DE PARÁMETROS DE VUELO"
          onSelectLog={onSelectTransmission}
          onSelectAnomaly={onSelectAnomaly}
          showCategoryFilters={true}
        />
      </div>

      {/* 5. Historial de Navegación y Registros de Telemetría Comparables */}
      <div className="panel-card panel-body">
        <div className="panel-title" style={{ fontSize: '0.95rem', marginBottom: '12px' }}>
          <Activity size={16} />
          <span>CRONOLOGÍA COMPARABLE DE DISTANCIA HELIOCÉNTRICA ({trajectoryPoints.length} HITOS VERIFICADOS)</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem'
          }}
        >
          {trajectoryPoints.map((pt) => (
            <div
              key={pt.logId}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-panel)',
                borderRadius: '4px',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--cyan-instrument)' }}>{pt.logId}</span>
                <StatusIndicator status={pt.classification} size="sm" />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {pt.distanceAu}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                {pt.date.split('T')[0]} — {pt.notes.length > 50 ? `${pt.notes.slice(0, 50)}...` : pt.notes}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
