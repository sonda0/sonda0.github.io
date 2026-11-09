import React from 'react';
import { MissionState, TimelineEvent } from '../types/mission';
import { Transmission } from '../types/transmission';
import { TelemetryCard } from '../components/TelemetryCard';
import { TransmissionCard } from '../components/TransmissionCard';
import { FlightTelemetryPanel } from '../components/FlightTelemetryPanel';
import { getStateBadgeClass, getStateLabel } from '../components/AnomalyCard';
import { formatDateTime } from '../services/transmissionParser';
import {
  Compass,
  Radio,
  Zap,
  Eye,
  Database,
  Activity,
  AlertOctagon,
  ArrowRight,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  mission: MissionState;
  recentTransmission: Transmission | null;
  timeline: TimelineEvent[];
  onNavigate: (path: string) => void;
  onSelectTransmission: (id: string) => void;
  onSelectAnomaly: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  mission,
  recentTransmission,
  timeline,
  onNavigate,
  onSelectTransmission,
  onSelectAnomaly
}) => {
  return (
    <div className="dashboard-grid">
      {/* 1. Panel de Misión General */}
      <div className="col-12 panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={16} />
            <span>ESTADO GENERAL DE LA MISIÓN // EXODATA V3.1</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ÚLTIMO DATALINK VÁLIDO:
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--cyan-instrument)',
                fontWeight: 600,
                background: 'rgba(69, 201, 216, 0.1)',
                padding: '2px 8px',
                borderRadius: '3px',
                border: '1px solid rgba(69, 201, 216, 0.3)'
              }}
            >
              {mission.last_transmission_id}
            </span>
          </div>
        </div>

        <div className="panel-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                IDENTIFICADOR DE MISIÓN
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {mission.mission_id}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                PROTOCOLO DE EJECUCIÓN
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--cyan-instrument)' }}>
                {mission.protocol_version}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                FECHA ÚLTIMO REGISTRO
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {formatDateTime(mission.last_transmission_date)}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                ANOMALÍAS REGISTRADAS
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--amber-warning)' }}>
                {mission.known_anomalies_count} ({mission.active_anomalies_count} bajo investigación)
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                TRANSMISIONES PÚBLICAS
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-operational)' }}>
                {mission.total_transmissions_count} registros
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(13, 23, 36, 0.6)',
              border: '1px solid var(--border-panel)',
              borderRadius: '4px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} style={{ color: 'var(--cyan-instrument)' }} />
              <span>
                CONDICIÓN DE TELEMETRÍA: <strong style={{ color: 'var(--text-main)' }}>{mission.subsystem_summary || 'Arquitectura V3.1 autónoma; sin enlace de subida'}</strong>
              </span>
            </div>
            <div style={{ color: 'var(--text-dim)' }}>
              ACTUALIZACIÓN PÚBLICA: {mission.last_data_update}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bloque de Telemetría Instrumental (Legado) */}
      <div className="col-12">
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="panel-title">
            <Radio size={15} />
            <span>TELEMETRÍA INSTRUMENTAL DE LA SONDA (LEGADO)</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            CLASIFICACIÓN EPISTÉMICA RIGUROSA
          </span>
        </div>

        <div className="telemetry-grid">
          <TelemetryCard
            item={mission.telemetry.distance}
            icon={<Compass size={14} style={{ color: 'var(--cyan-instrument)' }} />}
          />
          <TelemetryCard
            item={mission.telemetry.rtg_power}
            icon={<Zap size={14} style={{ color: 'var(--amber-warning)' }} />}
          />
          <TelemetryCard
            item={mission.telemetry.transceiver}
            icon={<Radio size={14} style={{ color: 'var(--red-critical)' }} />}
          />
          <TelemetryCard
            item={mission.telemetry.optical}
            icon={<Eye size={14} style={{ color: 'var(--green-operational)' }} />}
          />
          <TelemetryCard
            item={mission.telemetry.memory_integrity}
            icon={<Database size={14} style={{ color: 'var(--cyan-instrument)' }} />}
          />
        </div>
      </div>

      {/* 2b. FLIGHT-TELEMETRY PANEL // Resumen de 6 Indicadores Clave */}
      <div className="col-12">
        <FlightTelemetryPanel
          compact={true}
          title="FLIGHT-TELEMETRY V1.0 // RESUMEN DE TELEMETRÍA DE VUELO"
          onSelectLog={onSelectTransmission}
          onSelectAnomaly={onSelectAnomaly}
        />
      </div>

      {/* 3. Transmisión Reciente */}
      <div className="col-7">
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="panel-title">
            <Radio size={15} />
            <span>ÚLTIMA TRANSMISIÓN RECUPERADA</span>
          </div>
          <button
            onClick={() => onNavigate('/transmisiones')}
            className="btn-primary"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            Ver Archivo Completo <ArrowRight size={12} />
          </button>
        </div>

        {recentTransmission ? (
          <TransmissionCard
            transmission={recentTransmission}
            onSelect={onSelectTransmission}
          />
        ) : (
          <div className="panel-card panel-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No se han cargado transmisiones.
          </div>
        )}
      </div>

      {/* 4. Investigaciones Activas & Anomalías */}
      <div className="col-5">
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="panel-title">
            <AlertOctagon size={15} style={{ color: 'var(--amber-warning)' }} />
            <span>INVESTIGACIONES EN CURSO</span>
          </div>
          <button
            onClick={() => onNavigate('/anomalias')}
            className="btn-primary"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            Catálogo <ArrowRight size={12} />
          </button>
        </div>

        <div className="panel-card">
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mission.investigations && mission.investigations.length > 0 ? (
              mission.investigations.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectAnomaly(inv.id)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-panel)',
                    borderRadius: '4px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cyan-instrument)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-panel)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--cyan-instrument)' }}>
                      {inv.id}
                    </span>
                    <span className={`anomaly-state-badge ${getStateBadgeClass(inv.status)}`} style={{ fontSize: '0.65rem' }}>
                      {getStateLabel(inv.status)}
                    </span>
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {inv.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {inv.summary}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Sin investigaciones activas reportadas.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Línea Temporal de Actividad Histórica */}
      <div className="col-12 panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <Clock size={16} />
            <span>CRONOLOGÍA DE HITOS Y EVENTOS VERIFICADOS</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {timeline.length} EVENTOS EN SECUENCIA HISTÓRICA
          </span>
        </div>

        <div className="panel-body">
          <div
            style={{
              position: 'relative',
              paddingLeft: '24px',
              borderLeft: '1px dashed var(--border-panel)',
              marginLeft: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {timeline.map((evt) => (
              <div key={evt.id} style={{ position: 'relative' }}>
                {/* Timeline node dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-31px',
                    top: '4px',
                    width: '13px',
                    height: '13px',
                    borderRadius: '50%',
                    background: 'var(--bg-surface)',
                    border: '2px solid var(--cyan-instrument)'
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan-instrument)', fontWeight: 600 }}>
                    {formatDateTime(evt.date)}
                  </span>
                  <span className="tag-chip" style={{ fontSize: '0.65rem' }}>
                    {evt.category}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    FUENTE: {evt.source}
                  </span>
                </div>

                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {evt.title}
                </h4>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {evt.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
