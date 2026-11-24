import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sighting, Alert } from './types';
import { MOCK_CAMERAS, MOCK_ALERTS } from './data/mockData';
import { safeFetchJson, getWsUrl } from './services/apiClient';
import { CommanderSidebar } from './components/CommanderSidebar';
import { CommanderHeader } from './components/CommanderHeader';
import { MetricCardsRow } from './components/MetricCardsRow';
import { CommanderMapCard } from './components/CommanderMapCard';
import { SelectedVehicleCard } from './components/SelectedVehicleCard';
import { AnalyticsOverviewCard } from './components/AnalyticsOverviewCard';
import { TopTrackedVehiclesCard } from './components/TopTrackedVehiclesCard';
import { CameraFeedsCard } from './components/CameraFeedsCard';
import { AISearchAssistantCard } from './components/AISearchAssistantCard';
import { ConsecutiveCameraTracker } from './components/ConsecutiveCameraTracker';
import { LiveVehiclesDatabaseModal } from './components/LiveVehiclesDatabaseModal';
import { DashcamModal } from './components/DashcamModal';
import { CitizenPWAModal } from './components/CitizenPWAModal';

import { ToastContainer, ToastItem } from './components/ToastNotification';

// Dedicated Views for Sidebar Navigation
import { TrajectoriesView } from './components/views/TrajectoriesView';
import { LiveMapView } from './components/views/LiveMapView';
import { CameraNetworkView } from './components/views/CameraNetworkView';
import { ConvoyView } from './components/views/ConvoyView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';

export const App: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>(MOCK_CAMERAS);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedPlate, setSelectedPlate] = useState('DL8CAF2381');

  // Modals state
  const [isConsecutiveTrackerOpen, setIsConsecutiveTrackerOpen] = useState(false);
  const [isLiveVehiclesDBOpen, setIsLiveVehiclesDBOpen] = useState(false);
  const [isDashcamOpen, setIsDashcamOpen] = useState(false);
  const [isCitizenPWAOpen, setIsCitizenPWAOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Audio state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Global keyboard shortcuts (Requirement 9: Escape closes active modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsConsecutiveTrackerOpen(false);
        setIsLiveVehiclesDBOpen(false);
        setIsDashcamOpen(false);
        setIsCitizenPWAOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tactical Audio Synth (Web Audio API)
  const playAlertSound = (severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'CRITICAL') => {
    if (!isAudioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (severity === 'CRITICAL') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }
    } catch {
      // AudioContext blocked before first user gesture
    }
  };

  const addToast = (title: string, message: string, severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO') => {
    const newToast: ToastItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      severity,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 3)]);
    playAlertSound(severity);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch initial base metadata
  useEffect(() => {
    const fetchBase = async () => {
      try {
        const [cRes, sRes, aRes] = await Promise.all([
          safeFetchJson<{ cameras: Camera[] }>('/api/cameras'),
          safeFetchJson<{ sightings: Sighting[] }>('/api/sightings?limit=60'),
          safeFetchJson<{ alerts: Alert[] }>('/api/alerts?limit=30'),
        ]);

        const hasValidBackendResponse =
          (cRes.success && !cRes.isHtmlFallback) ||
          (sRes.success && !sRes.isHtmlFallback) ||
          (aRes.success && !aRes.isHtmlFallback);

        if (!hasValidBackendResponse) {
          throw new Error('API returned HTML fallback or backend unreachable');
        }

        const cData = cRes.data;
        const sData = sRes.data;
        const aData = aRes.data;

        setCameras(cData?.cameras && cData.cameras.length > 0 ? cData.cameras : MOCK_CAMERAS);
        setSightings(sData?.sightings || []);
        setAlerts(aData?.alerts && aData.alerts.length > 0 ? aData.alerts : MOCK_ALERTS);
        setIsBackendHealthy(true);
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn('Backend API unavailable, using mock data:', err);
        setCameras(MOCK_CAMERAS);
        setAlerts(MOCK_ALERTS);
        setIsBackendHealthy(false);
      }
    };
    fetchBase();
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const wsUrl = getWsUrl('/ws');

    const connectWs = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);
        ws.onerror = () => setWsConnected(false);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INIT_STATE') {
            if (msg.cameras) setCameras(msg.cameras);
            if (msg.recent_sightings) setSightings(msg.recent_sightings);
            if (msg.recent_alerts) setAlerts(msg.recent_alerts);
            setLastSyncedAt(new Date());
          } else if (msg.type === 'NEW_SIGHTING') {
            setSightings((prev) => [msg.data, ...prev.slice(0, 100)]);
            setLastSyncedAt(new Date());
            if (msg.alerts && msg.alerts.length > 0) {
              setAlerts((prev) => [...msg.alerts, ...prev]);
              addToast(
                `ALERT: ${msg.alerts[0].alert_type}`,
                `${msg.alerts[0].plate} flagged at ${msg.alerts[0].camera_name || 'Junction'}`,
                'CRITICAL'
              );
            }
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => ws.close();
    } catch (err) {
      console.warn('WS connection failed', err);
      setWsConnected(false);
    }
  };

    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleSearchPlate = (plate: string) => {
    setSelectedPlate(plate);
    setActiveNav('trajectories');
  };

  // Operational State calculation (Requirement 2: LIVE, DEMO, DEGRADED, OFFLINE, CONNECTING)
  const isStale = lastSyncedAt ? (Date.now() - lastSyncedAt.getTime()) > 120000 : false;
  let operationalState: 'connecting' | 'live' | 'demo' | 'degraded' | 'offline' = 'connecting';
  if (isBackendHealthy === null) {
    operationalState = 'connecting';
  } else if (isBackendHealthy === false) {
    operationalState = 'demo';
  } else if (wsConnected && !isStale) {
    operationalState = 'live';
  } else if (isBackendHealthy || wsConnected) {
    operationalState = 'degraded';
  } else {
    operationalState = 'offline';
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f7fb] text-slate-800 font-sans">
      {/* 1. Left Sidebar */}
      <CommanderSidebar
        activeNav={activeNav}
        onSelectNav={(nav) => {
          setActiveNav(nav);
          setIsLiveVehiclesDBOpen(nav === 'vehicle_search');
        }}
        onOpenConsecutiveTracker={() => setIsConsecutiveTrackerOpen(true)}
        feedStatus={operationalState}
        lastSyncedAt={lastSyncedAt}
      />

      {/* 2. Main Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <CommanderHeader
          onSearchPlate={handleSearchPlate}
          onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          alertCount={alerts.length || 3}
          isLive={wsConnected}
          systemState={operationalState}
          isAudioEnabled={isAudioEnabled}
          onToggleAudio={() => setIsAudioEnabled(!isAudioEnabled)}
          onOpenCitizenPWA={() => setIsCitizenPWAOpen(true)}
        />

        {/* Dynamic View Router */}
        {activeNav === 'overview' && (
          <main className="flex-1 overflow-y-auto pb-6">
            {/* 4 Top KPI Metric Cards */}
            <MetricCardsRow
              vehicleCount={2481}
              cameraCount={cameras.length || 12}
              anomalyCount={alerts.length || 7}
              pursuitCount={3}
              onCardClick={(metric) => {
                if (metric === 'vehicles') setIsLiveVehiclesDBOpen(true);
                if (metric === 'cameras') setIsConsecutiveTrackerOpen(true);
                if (metric === 'anomalies') setIsNotificationsOpen(true);
              }}
            />

            {/* Middle Section: Map + Selected Vehicle */}
            <div className="grid grid-cols-12 gap-5 px-6 mb-5">
              {/* Main Map Card (8 cols ~ 67%) */}
              <div className="col-span-8">
                <CommanderMapCard
                  cameras={cameras}
                  selectedPlate={selectedPlate}
                  onSelectCamera={(camId) => {
                    setIsConsecutiveTrackerOpen(true);
                  }}
                  onOpenLiveFeed={() => setIsConsecutiveTrackerOpen(true)}
                />
              </div>

              {/* Selected Vehicle Card (4 cols ~ 33%) */}
              <div className="col-span-4">
                <SelectedVehicleCard
                  plate={selectedPlate}
                  confidence={98.7}
                  timeStr="17:42:15 • 21 Nov 2026"
                  location="Rajpath Rd, New Delhi"
                  vehicleModel="Toyota Corolla • White"
                  onViewDetails={() => setActiveNav('trajectories')}
                  onViewAllAlerts={() => setIsNotificationsOpen(true)}
                />
              </div>
            </div>

            {/* Bottom Section: 4 Metric & Action Cards */}
            <div className="grid grid-cols-4 gap-5 px-6">
              {/* Col 1: Analytics Overview Dual Area Chart */}
              <AnalyticsOverviewCard />

              {/* Col 2: Top Tracked Vehicles */}
              <TopTrackedVehiclesCard
                onSelectPlate={(plate) => {
                  setSelectedPlate(plate);
                  setActiveNav('trajectories');
                }}
                onViewAll={() => setIsLiveVehiclesDBOpen(true)}
              />

              {/* Col 3: Camera Feeds */}
              <CameraFeedsCard
                onOpenFeed={(camId) => setIsConsecutiveTrackerOpen(true)}
              />

              {/* Col 4: AI Search Assistant */}
              <AISearchAssistantCard
                onExecuteQuery={(query) => {
                  console.log('Executed query:', query);
                }}
              />
            </div>
          </main>
        )}

        {/* Dedicated Trajectories View */}
        {activeNav === 'trajectories' && (
          <TrajectoriesView
            cameras={cameras}
            selectedPlate={selectedPlate}
            onSelectPlate={(plate) => setSelectedPlate(plate)}
            onOpenLiveFeed={() => setIsConsecutiveTrackerOpen(true)}
          />
        )}

        {/* Dedicated Live Map View */}
        {activeNav === 'live_map' && (
          <LiveMapView
            cameras={cameras}
            onOpenFeed={(camId) => setIsConsecutiveTrackerOpen(true)}
          />
        )}

        {/* Dedicated Convoy View */}
        {activeNav === 'convoy_intelligence' && (
          <ConvoyView />
        )}

        {/* Dedicated Camera Network View */}
        {activeNav === 'camera_network' && (
          <CameraNetworkView
            cameras={cameras}
            onOpenFeed={(camId) => setIsConsecutiveTrackerOpen(true)}
          />
        )}

        {/* Dedicated Analytics View */}
        {activeNav === 'analytics' && (
          <AnalyticsView />
        )}

        {/* Dedicated Settings View */}
        {activeNav === 'settings' && (
          <SettingsView />
        )}

      </div>

      {/* Floating Real-time Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Slide-over Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[600] flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-[380px] bg-white h-full shadow-2xl p-5 flex flex-col justify-between border-l border-slate-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Priority Intelligence Alerts ({alerts.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {alt.plate}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {alt.camera_name || alt.camera_id}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1.5 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        alt.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <span>{alt.alert_type}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {typeof alt.details === 'string'
                        ? alt.details
                        : alt.details?.message || JSON.stringify(alt.details)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setIsNotificationsOpen(false);
                setIsLiveVehiclesDBOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer mt-4"
            >
              Open Vehicle Sightings
            </button>
          </div>
        </div>
      )}

      {/* 2 Consecutive Cameras Real Live Footage Modal */}
      <ConsecutiveCameraTracker
        isOpen={isConsecutiveTrackerOpen}
        onClose={() => setIsConsecutiveTrackerOpen(false)}
      />

      {/* Vehicle Sightings Modal */}
      <LiveVehiclesDatabaseModal
        isOpen={isLiveVehiclesDBOpen}
        onClose={() => {
          setIsLiveVehiclesDBOpen(false);
          setActiveNav((currentNav) => currentNav === 'vehicle_search' ? 'overview' : currentNav);
        }}
        onSelectPlate={(plate) => {
          setSelectedPlate(plate);
          setActiveNav('trajectories');
        }}
      />

      {/* Upload Dashcam Frame Modal */}
      <DashcamModal
        isOpen={isDashcamOpen}
        onClose={() => setIsDashcamOpen(false)}
        cameras={cameras}
        onUploadComplete={() => {
          setIsNotificationsOpen(true);
          addToast('DASHCAM ANPR PROCESSED', 'Vehicle plate recognized and injected into network.', 'INFO');
        }}
      />

      {/* Citizen PWA Modal */}
      <CitizenPWAModal
        isOpen={isCitizenPWAOpen}
        onClose={() => setIsCitizenPWAOpen(false)}
        onReportSubmitted={(repPlate) => {
          setIsNotificationsOpen(true);
          addToast('CITIZEN INCIDENT REPORTED', `Target plate ${repPlate} flagged on city watchlist.`, 'WARNING');
        }}
      />
    </div>
  );
};
