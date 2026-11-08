import React from 'react';
import { Share2, ExternalLink, Code2, Video, MessageSquare, Shield, CheckCircle } from 'lucide-react';

export const Communications: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="panel-card panel-body">
        <div className="panel-title" style={{ fontSize: '1rem', marginBottom: '4px' }}>
          <Share2 size={18} />
          <span>CANALES OFICIALES DE COMUNICACIÓN Y DIFUSIÓN</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Puntos de enlace y acceso a los registros públicos de la misión SONDA 0 en redes y repositorios externos.
        </p>
      </div>

      {/* Official Channels Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}
      >
        {/* GitHub Bitácora */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={16} style={{ color: 'var(--cyan-instrument)' }} />
              <span className="panel-title">REPOSITORIO DE BITÁCORA</span>
            </div>
            <span className="tag-chip" style={{ color: 'var(--green-operational)', borderColor: 'rgba(66, 200, 162, 0.4)' }}>
              PRIMARIO
            </span>
          </div>

          <div className="panel-body">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              github.com/sonda0/bitacora
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
              Repositorio de solo lectura que aloja los archivos Markdown originales de cada transmisión horaria (`transmisiones/LOG-*.md`), manifiestos y árbol inmutable de control.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Fuente de verdad canónica
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Historial de versiones y hashes git
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Sin dependencias dinámicas
              </li>
            </ul>
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(13, 23, 36, 0.4)', borderTop: '1px solid var(--border-panel)' }}>
            <a
              href="https://github.com/sonda0/bitacora"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Acceder al Repositorio de Bitácora</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* YouTube Channel */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={16} style={{ color: 'var(--red-critical)' }} />
              <span className="panel-title">TRANSMISIONES AUDIOVISUALES</span>
            </div>
            <span className="tag-chip">AV-001</span>
          </div>

          <div className="panel-body">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              @sonda0.Operator
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
              Canal de difusión audiovisual. Emisión periódica de las transmisiones científicas, telemetría sonora y visualizaciones procedurales generadas por el subsistema AV-001.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Videos públicos confirmados
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Sin almacenamiento de credenciales OAuth
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Registro audiovisual inmutable
              </li>
            </ul>
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(13, 23, 36, 0.4)', borderTop: '1px solid var(--border-panel)' }}>
            <a
              href="https://www.youtube.com/@sonda0.Operator"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Visitar Canal Oficial de YouTube</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Reddit Community */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} style={{ color: 'var(--amber-warning)' }} />
              <span className="panel-title">COMUNIDAD Y DEBATE</span>
            </div>
            <span className="tag-chip">COMMS-001</span>
          </div>

          <div className="panel-body">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '8px' }}>
              r/Sonda0
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
              Foro comunitario para el análisis de anomalías, discusión de hipótesis astrofísicas y desentrañamiento colectivo de los registros de Sonda 0.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Enlace oficial a la comunidad
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Independiente de la API de Reddit
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={12} style={{ color: 'var(--green-operational)' }} /> Análisis abierto y colaborativo
              </li>
            </ul>
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(13, 23, 36, 0.4)', borderTop: '1px solid var(--border-panel)' }}>
            <a
              href="https://www.reddit.com/r/Sonda0/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Acceder a la Comunidad r/Sonda0</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Safety and Protocol Directives */}
      <div
        className="panel-card panel-body"
        style={{
          background: 'rgba(13, 23, 36, 0.5)',
          border: '1px dashed var(--border-panel)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <Shield size={22} style={{ color: 'var(--cyan-instrument)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>
            POLÍTICA DE INTERACCIÓN UNIDIRECCIONAL
          </strong>
          MISSION-CONTROL no dispone de interfaces de publicación interactiva ni ejecuta scripts sobre plataformas externas. Toda emisión externa es originada por los subsistemas de vuelo autorizados mediante flujo unidireccional.
        </div>
      </div>
    </div>
  );
};
