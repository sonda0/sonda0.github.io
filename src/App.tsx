import React, { useState, useEffect, useCallback } from 'react';
import { MissionState, ManifestData, TimelineEvent } from './types/mission';
import { Transmission } from './types/transmission';
import { Anomaly } from './types/anomaly';
import { SystemsData } from './types/systems';
import {
  getMission,
  getManifest,
  getTransmissions,
  getAnomalies,
  getSystems,
  getTimeline
} from './services/missionData';

import { MissionHeader } from './components/MissionHeader';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';

import { Dashboard } from './pages/Dashboard';
import { Transmissions } from './pages/Transmissions';
import { TransmissionDetail } from './pages/TransmissionDetail';
import { Anomalies } from './pages/Anomalies';
import { AnomalyDetail } from './pages/AnomalyDetail';
import { NavigationMap } from './pages/NavigationMap';
import { Systems } from './pages/Systems';
import { Communications } from './pages/Communications';
import { About } from './pages/About';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation route state (normalized to start with '/')
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && hash.startsWith('/')) return hash;
    const path = window.location.pathname;
    return path || '/';
  });

  // Data states
  const [mission, setMission] = useState<MissionState | null>(null);
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [systems, setSystems] = useState<SystemsData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync with browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && hash.startsWith('/')) {
        setCurrentPath(hash);
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, man, txs, anoms, sys, tl] = await Promise.all([
        getMission(),
        getManifest(),
        getTransmissions(),
        getAnomalies(),
        getSystems(),
        getTimeline()
      ]);

      setMission(m);
      setManifest(man);
      setTransmissions(txs);
      setAnomalies(anoms);
      setSystems(sys);
      setTimeline(tl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al recuperar datos públicos de misión.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Route matching helper
  const renderCurrentView = () => {
    if (loading) {
      return (
        <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--cyan-instrument)', fontSize: '1rem' }}>
            <RefreshCw size={20} className="pulse-green" />
            <span>SINCRONIZANDO DATALINK DE MISIÓN SONDA 0...</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px' }}>
            Consultando registros autorizados en /data/*.json
          </p>
        </div>
      );
    }

    if (error || !mission) {
      return (
        <div className="panel-card panel-body" style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--red-critical)', marginBottom: '12px' }}>
            <AlertTriangle size={24} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>ANOMALÍA EN LA RECUPERACIÓN DE DATOS</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
            {error || 'No fue posible cargar el estado verificado de la misión.'}
          </p>
          <button onClick={loadData} className="btn-primary" style={{ margin: '0 auto' }}>
            <RefreshCw size={14} />
            <span>Reintentar Conexión</span>
          </button>
        </div>
      );
    }

    // Match transmission detail: /transmisiones/:id
    if (currentPath.startsWith('/transmisiones/')) {
      const logId = currentPath.split('/transmisiones/')[1];
      const found = transmissions.find((t) => t.id.toUpperCase() === logId.toUpperCase());
      if (found) {
        return (
          <TransmissionDetail
            transmission={found}
            onBack={() => navigateTo('/transmisiones')}
          />
        );
      }
      return (
        <div className="panel-card panel-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'var(--amber-warning)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
            Transmisión "{logId}" no hallada en el índice de bitácora verificado.
          </p>
          <button onClick={() => navigateTo('/transmisiones')} className="btn-primary">
            Volver a la lista de transmisiones
          </button>
        </div>
      );
    }

    // Match anomaly detail: /anomalias/:id
    if (currentPath.startsWith('/anomalias/')) {
      const anomId = currentPath.split('/anomalias/')[1];
      const found = anomalies.find((a) => a.id.toUpperCase() === anomId.toUpperCase());
      if (found) {
        return (
          <AnomalyDetail
            anomaly={found}
            onBack={() => navigateTo('/anomalias')}
            onSelectTransmission={(id) => navigateTo(`/transmisiones/${id}`)}
          />
        );
      }
      return (
        <div className="panel-card panel-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'var(--amber-warning)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
            Expediente de anomalía "{anomId}" no catalogado o no autorizado para exportación pública.
          </p>
          <button onClick={() => navigateTo('/anomalias')} className="btn-primary">
            Volver al catálogo de anomalías
          </button>
        </div>
      );
    }

    // Main Page routes
    switch (currentPath) {
      case '/transmisiones':
        return (
          <Transmissions
            transmissions={transmissions}
            onSelect={(id) => navigateTo(`/transmisiones/${id}`)}
          />
        );

      case '/anomalias':
        return (
          <Anomalies
            anomalies={anomalies}
            onSelect={(id) => navigateTo(`/anomalias/${id}`)}
          />
        );

      case '/navegacion':
        return <NavigationMap />;

      case '/sistemas':
        return systems ? <Systems systemsData={systems} /> : null;

      case '/comunicaciones':
        return <Communications />;

      case '/acerca-de':
        return <About />;

      case '/':
      default:
        return (
          <Dashboard
            mission={mission}
            recentTransmission={transmissions.length > 0 ? transmissions[transmissions.length - 1] : null}
            timeline={timeline}
            onNavigate={navigateTo}
            onSelectTransmission={(id) => navigateTo(`/transmisiones/${id}`)}
            onSelectAnomaly={(id) => navigateTo(`/anomalias/${id}`)}
          />
        );
    }
  };

  return (
    <div className="mission-app-container">
      {/* Header */}
      <MissionHeader
        carrierStatus={mission?.carrier_status || 'SIN_PORTADORA'}
        earthLinkState={mission?.earth_link_state || 'LOSS_OF_SIGNAL'}
        protocolVersion={mission?.protocol_version || 'V3.1-EXODATA'}
        onLogoClick={() => navigateTo('/')}
      />

      {/* Navigation Bar */}
      <Navigation currentPath={currentPath} onNavigate={navigateTo} />

      {/* Main Content Area */}
      <main className="main-content">
        {renderCurrentView()}
      </main>

      {/* Footer */}
      <Footer
        lastUpdate={mission?.last_data_update}
        dataStatus={manifest?.data_status}
      />
    </div>
  );
};
