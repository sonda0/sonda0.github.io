import React from 'react';
import { Info, ShieldAlert, ExternalLink, Sparkles, BookOpen } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="panel-card panel-body">
        <div className="panel-title" style={{ fontSize: '1rem', marginBottom: '4px' }}>
          <Info size={18} />
          <span>ACERCA DE // SONDA 0 — EXODATA V3.1</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Naturaleza, objetivos epistemológicos y arquitectura del proyecto experimental de ciencia ficción dura.
        </p>
      </div>

      {/* Main Narrative & Disclaimer Panel */}
      <div className="panel-card panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Crucial Disclaimer */}
        <div
          style={{
            background: 'rgba(232, 170, 83, 0.08)',
            borderLeft: '4px solid var(--amber-warning)',
            padding: '16px 20px',
            borderRadius: '0 4px 4px 0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber-warning)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
            <ShieldAlert size={16} />
            <span>AVISO EPISTÉMICO DE DIVULGACIÓN</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            <strong>SONDA 0 es una obra de ficción especulativa y ciencia ficción dura.</strong> La plataforma MISSION-CONTROL simula la consola de telemetría de una sonda espacial autónoma en deriva interestelar, pero <strong>no representa una misión espacial física real ni un vehículo en órbita</strong>.
          </p>
        </div>

        {/* Project Description */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cyan-instrument)', marginBottom: '10px' }}>
            ¿Qué es SONDA 0?
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.7, marginBottom: '12px' }}>
            SONDA 0 es un proyecto experimental que entrelaza astrofísica contemporánea, narrativa algorítmica autónoma e inteligencia artificial. Su eje central es un archivo cronológico inmutable de transmisiones horarias (bitácora) emitidas por una sonda hipotética lanzada más allá del choque de terminación de la heliosfera.
          </p>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Tras perder el enlace de comunicaciones con la Tierra, la sonda opera bajo un estricto protocolo de contingencia denominado <strong>EXODATA V3.1</strong>. Este protocolo prioriza la catalogación sistemática de anomalías electromagnéticas, megaestructuras estelares y fenómenos de física extrema, manteniendo continuidad lógica sin intervención humana permanente.
          </p>
        </section>

        {/* Real Science vs Fictional Narrative */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-panel)',
            borderRadius: '6px',
            padding: '18px 20px'
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--green-operational)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} />
            <span>Fundamentación Científica y Realismo Hard Sci-Fi</span>
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '10px' }}>
            Cada transmisión de la misión incorpora referencias a literatura científica verídica, como preprints de astrofísica y robótica en <strong>arXiv</strong>, observaciones de la <strong>NASA</strong> o misiones astronómicas reales.
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Sin embargo, las observaciones locales atribuidas al instrumental de la Sonda 0 (como la megaestructura hexagonal HEX-04 o la biosfera criogénica CRIO-01) forman parte del universo narrativo ficticio.
          </p>
        </section>

        {/* AI Transparency */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-panel)',
            borderRadius: '6px',
            padding: '18px 20px'
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--cyan-instrument)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            <span>Transparencia en el Uso de Inteligencia Artificial</span>
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '10px' }}>
            La generación periódica de las transmisiones de la misión se apoya en modelos avanzados de lenguaje e inferencia orquestados mediante el entorno de desarrollo <strong>DeepSeek Harness</strong>.
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            El sistema cuenta con compuertas automatizadas de revisión editorial (V3.1 Quality Gate) y filtros de consistencia para prevenir la degradación semántica, alucinaciones no documentadas o contradicciones con el archivo histórico de vuelo.
          </p>
        </section>

        {/* Official Direct Links */}
        <section style={{ borderTop: '1px solid var(--border-panel)', paddingTop: '18px' }}>
          <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: '12px' }}>
            FUENTES DE DATOS Y ENLACES OFICIALES
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <a
              href="https://github.com/sonda0/bitacora"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <span>GitHub Bitácora</span>
              <ExternalLink size={12} />
            </a>
            <a
              href="https://www.youtube.com/@sonda0.Operator"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <span>Canal YouTube @sonda0.Operator</span>
              <ExternalLink size={12} />
            </a>
            <a
              href="https://www.reddit.com/r/Sonda0/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <span>Comunidad r/Sonda0</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
