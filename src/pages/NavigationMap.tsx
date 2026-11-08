import React, { useState } from 'react';
import { Compass, AlertTriangle, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CelestialObject {
  id: string;
  name: string;
  distance: string;
  type: string;
  description: string;
  color: string;
  x: number; // SVG coordinate
  y: number;
  radius: number;
  uncertainty?: string;
}

export const NavigationMap: React.FC = () => {
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const objects: CelestialObject[] = [
    {
      id: 'SOL',
      name: 'El Sol (Sol Central)',
      distance: '0.00 AU',
      type: 'Estrella G2V (Origen)',
      description: 'Punto de partida de la misión Sonda 0. Frecuencias DSN en silencio absoluto desde hace > 4,200 ciclos.',
      color: '#F4D06F',
      x: 200,
      y: 300,
      radius: 8
    },
    {
      id: 'KUIPER',
      name: 'Cinturón de Kuiper',
      distance: '30 - 50 AU',
      type: 'Región de Cuerpos Menores',
      description: 'Zona de restos planetarios de hielo y roca. Superada en las etapas iniciales de la trayectoria de escape.',
      color: '#506677',
      x: 320,
      y: 300,
      radius: 4
    },
    {
      id: 'TERMINATION_SHOCK',
      name: 'Choque de Terminación',
      distance: '~94 AU',
      type: 'Frontera Heliosférica',
      description: 'Zona donde el viento solar desacelera abruptamente por debajo de la velocidad del sonido ante el medio interestelar.',
      color: '#45C9D8',
      x: 450,
      y: 300,
      radius: 3
    },
    {
      id: 'HELIOPAUSE',
      name: 'Heliopausa',
      distance: '~120 AU',
      type: 'Límite de la Magnetosfera Solar',
      description: 'Borde donde la presión del viento solar se equilibra con la presión del plasma interestelar.',
      color: '#42C8A2',
      x: 540,
      y: 300,
      radius: 3
    },
    {
      id: 'SONDA_0',
      name: 'SONDA 0 (Posición Estimada)',
      distance: '169.34 AU (Calculada)',
      type: 'Vehículo Autónomo Interestelar',
      description: 'Escape heliosférico en curso. Trayectoria no verificada independientemente por telemetría terrestre. Modelo orbital congelado.',
      color: '#45C9D8',
      x: 680,
      y: 260,
      radius: 7,
      uncertainty: 'ALTA INCERTIDUMBRE: Sin modelo orbital de precisión ni confirmación terrestre.'
    },
    {
      id: 'WISE_0001',
      name: 'Enana Marrón WISE-0001 / HEX-04',
      distance: '0.04 Años Luz (~2,500 AU declarada)',
      type: 'Sistema Subestelar & Objeto Anómalo',
      description: 'Enana marrón fría de captura. Monolito hexagonal HEX-04 en órbita estacionaria con emisión coherente en 1420 MHz.',
      color: '#E8AA53',
      x: 820,
      y: 190,
      radius: 6,
      uncertainty: 'Parámetros orbitales derivados de un único informe sin repetición instrumental.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Epistemic Disclaimer */}
      <div className="panel-card panel-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
          <div>
            <div className="panel-title" style={{ fontSize: '1rem', marginBottom: '4px' }}>
              <Compass size={18} />
              <span>CARTOGRAFÍA Y DERIVA DE ESPACIO PROFUNDO</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Proyección esquemática del vector de escape heliosférico de Sonda 0 y regiones del sistema solar exterior.
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
              gap: '6px'
            }}
          >
            <AlertTriangle size={14} />
            <span>VISTA CONCEPTUAL // NO A ESCALA // POSICIÓN NO CONFIRMADA</span>
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          * En cumplimiento del protocolo EXODATA V3.1, las distancias interestelares no se representan como escala astronómica exacta sin efemérides validadas. Los puntos representan relaciones topológicas ordinales.
        </p>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="panel-card" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Controls Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            display: 'flex',
            gap: '6px'
          }}
        >
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2))}
            className="btn-primary"
            title="Aumentar Zoom"
            style={{ padding: '6px 10px' }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
            className="btn-primary"
            title="Reducir Zoom"
            style={{ padding: '6px 10px' }}
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="btn-primary"
            title="Restablecer vista"
            style={{ padding: '6px 10px' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* SVG Canvas Map */}
        <div style={{ width: '100%', overflowX: 'auto', background: '#05090F' }}>
          <svg
            viewBox="0 0 1000 600"
            style={{
              width: '100%',
              minWidth: '800px',
              height: 'auto',
              display: 'block',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease'
            }}
          >
            <defs>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F4D06F" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#E8AA53" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F4D06F" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="probeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#45C9D8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#45C9D8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#45C9D8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="escapeVector" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F4D06F" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#45C9D8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#45C9D8" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <g stroke="#122034" strokeWidth="1" strokeDasharray="4 8">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
                <line key={`gx-${x}`} x1={x} y1="0" x2={x} y2="600" />
              ))}
              {[100, 200, 300, 400, 500].map((y) => (
                <line key={`gy-${y}`} x1="0" y1={y} x2="1000" y2={y} />
              ))}
            </g>

            {/* Heliosphere boundary arcs */}
            <circle cx="200" cy="300" r="120" fill="none" stroke="#243B50" strokeWidth="1" strokeDasharray="3 3" />
            <text x="290" y="210" fill="#506677" fontSize="10" fontFamily="var(--font-mono)">CINTURÓN DE KUIPER (~50 AU)</text>

            <circle cx="200" cy="300" r="250" fill="none" stroke="rgba(69, 201, 216, 0.2)" strokeWidth="1.5" strokeDasharray="5 5" />
            <text x="420" y="160" fill="#45C9D8" fontSize="10" fontFamily="var(--font-mono)">CHOQUE DE TERMINACIÓN (~94 AU)</text>

            <circle cx="200" cy="300" r="340" fill="none" stroke="rgba(66, 200, 162, 0.2)" strokeWidth="1.5" strokeDasharray="6 4" />
            <text x="500" y="110" fill="#42C8A2" fontSize="10" fontFamily="var(--font-mono)">HELIOPAUSA (~120 AU)</text>

            {/* Escape Trajectory Line */}
            <path
              d="M 200 300 Q 450 310 680 260"
              fill="none"
              stroke="url(#escapeVector)"
              strokeWidth="2"
              strokeDasharray="4 2"
            />

            {/* Line from Sonda 0 toward WISE-0001 / HEX-04 observation */}
            <line
              x1="680"
              y1="260"
              x2="820"
              y2="190"
              stroke="#E8AA53"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.7"
            />
            <text x="740" y="215" fill="#E8AA53" fontSize="9" fontFamily="var(--font-mono)">VECTOR OBSERVACIÓN HEX-04</text>

            {/* Sol */}
            <circle cx="200" cy="300" r="28" fill="url(#sunGlow)" />
            <circle cx="200" cy="300" r="8" fill="#F4D06F" />
            <text x="180" y="325" fill="#F4D06F" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold">SOL</text>

            {/* Sonda 0 */}
            <circle cx="680" cy="260" r="24" fill="url(#probeGlow)" />
            <circle cx="680" cy="260" r="6" fill="#45C9D8" />
            <circle cx="680" cy="260" r="14" fill="none" stroke="#45C9D8" strokeWidth="1" strokeDasharray="2 2" />
            <text x="645" y="295" fill="#45C9D8" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold">SONDA 0</text>
            <text x="645" y="310" fill="#8297A9" fontSize="9" fontFamily="var(--font-mono)">169.34 AU (Est.)</text>

            {/* Target Brown Dwarf WISE-0001 */}
            <circle cx="820" cy="190" r="12" fill="rgba(232, 170, 83, 0.2)" />
            <circle cx="820" cy="190" r="5" fill="#E8AA53" />
            <polygon points="820,180 827,185 827,195 820,200 813,195 813,185" fill="none" stroke="#E8AA53" strokeWidth="1.2" />
            <text x="800" y="170" fill="#E8AA53" fontSize="10" fontFamily="var(--font-mono)" fontWeight="bold">HEX-04</text>
            <text x="790" y="218" fill="#8297A9" fontSize="8" fontFamily="var(--font-mono)">WISE-0001</text>

            {/* Clickable hotspots */}
            {objects.map((obj) => (
              <circle
                key={obj.id}
                cx={obj.x}
                cy={obj.y}
                r="18"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedObject(obj)}
              />
            ))}
          </svg>
        </div>

        {/* Selected Object Detail Panel */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-panel)'
          }}
        >
          {selectedObject ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: selectedObject.color
                    }}
                  />
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {selectedObject.name}
                  </h4>
                  <span className="tag-chip">{selectedObject.type}</span>
                </div>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cyan-instrument)', fontWeight: 600 }}>
                  DISTANCIA AL SOL: {selectedObject.distance}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '8px' }}>
                {selectedObject.description}
              </p>

              {selectedObject.uncertainty && (
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--amber-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={12} />
                  <span>{selectedObject.uncertainty}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
              <Info size={14} />
              <span>Haga clic sobre cualquier marcador en el mapa para consultar la telemetría del sector.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
