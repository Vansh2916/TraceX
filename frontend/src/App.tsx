import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Sighting, Alert, ConnectionStatus, DataOrigin } from './types';
import { MOCK_CAMERAS, MOCK_ALERTS } from './data/mockData';
import { fetchJson, getWebSocketUrl } from './utils/api';
import { CommanderSidebar } from './components/CommanderSidebar';
import { CommanderHeader } from './components/CommanderHeader';
import { OperationalStatusBar } from './components/OperationalStatusBar';
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

// Dedicated Views for Sidebar Navigation
import { TrajectoriesView } from './components/views/TrajectoriesView';
import { LiveMapView } from './components/views/LiveMapView';
import { CameraNetworkView } from './components/views/CameraNetworkView';
import { ConvoyView } from './components/views/ConvoyView';
import { AlibiView } from './components/views/AlibiView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';

export const App: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedPlate, setSelectedPlate] = useState('DL8CAF2381');

  // Modals state
  const [isConsecutiveTrackerOpen, setIsConsecutiveTrackerOpen] = useState(false);
  const [isLiveVehiclesDBOpen, setIsLiveVehiclesDBOpen] = useState(false);
  const [isDashcamOpen, setIsDashcamOpen] = useState(false);
  const [isCitizenPWAOpen, setIsCitizenPWAOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Connection status & Data Origin state
  const [apiStatus, setApiStatus] = useState<ConnectionStatus>('connecting');
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('connecting');
  const [dataOrigin, setDataOrigin] = useState<DataOrigin>('mock');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial base metadata
  const fetchBase = useCallback(async () => {
    try {
      setApiStatus('connecting');
      const [cData, sData, aData] = await Promise.all([
        fetchJson<{ cameras: Camera[] }>('/api/cameras'),
        fetchJson<{ sightings: Sighting[] }>('/api/sightings?limit=60'),
        fetchJson<{ alerts: Alert[] }>('/api/alerts?limit=30'),
      ]);

      const hasLiveCameras = Boolean(cData.cameras && cData.cameras.length > 0);
      setCameras(hasLiveCameras ? cData.cameras : MOCK_CAMERAS);
      setSightings(sData.sightings || []);
      setAlerts(aData.alerts && aData.alerts.length > 0 ? aData.alerts : MOCK_ALERTS);

      setApiStatus('connected');
      setDataOrigin(hasLiveCameras ? 'live' : 'mock');
      setLastSyncTime(new Date());
      setApiError(null);
    } catch (err: any) {
      console.warn('Backend API unavailable, using mock data:', err);
      setCameras(MOCK_CAMERAS);
      setAlerts(MOCK_ALERTS);
      setApiStatus('offline');
      setDataOrigin('mock');
      setApiError(err?.message || 'Backend API unreachable');
    }
  }, []);

  useEffect(() => {
    fetchBase();
  }, [fetchBase]);

  // Connect & verify WebSocket separately
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    let isCleanedUp = false;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let pingInterval: NodeJS.Timeout | null = null;

    const connectWs = () => {
      if (isCleanedUp) return;

      try {
        setWsStatus('connecting');
        console.log(`[Crusaders WS] Connecting to WebSocket endpoint: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[Crusaders WS] Connection opened. Verifying endpoint with heartbeat PING...');
          // Verify WebSocket endpoint separately with heartbeat PING
          ws.send(JSON.stringify({ action: 'PING' }));

          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ action: 'PING' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'PONG') {
              console.log('[Crusaders WS] Verified WebSocket endpoint (received PONG from backend)');
              setWsConnected(true);
              setWsStatus('connected');
              return;
            }

            // Valid telemetry payload also confirms verified connection
            setWsConnected(true);
            setWsStatus('connected');

            if (msg.type === 'INIT_STATE') {
              if (msg.cameras) setCameras(msg.cameras);
              if (msg.recent_sightings) setSightings(msg.recent_sightings);
              if (msg.recent_alerts) setAlerts(msg.recent_alerts);
            } else if (msg.type === 'NEW_SIGHTING') {
              setSightings((prev) => [msg.data, ...prev.slice(0, 100)]);
              if (msg.alerts && msg.alerts.length > 0) {
                setAlerts((prev) => [...msg.alerts, ...prev]);
              }
            }
          } catch (e) {
            console.error('[Crusaders WS] Parse error', e);
          }
        };

        ws.onclose = (event) => {
          setWsConnected(false);
          setWsStatus('disconnected');
          if (pingInterval) clearInterval(pingInterval);
          console.warn(`[Crusaders WS] Disconnected (code: ${event.code}). Retrying in 3s...`);
          if (!isCleanedUp) {
            reconnectTimer = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = (err) => {
          console.warn('[Crusaders WS] Error on WebSocket endpoint:', err);
          setWsConnected(false);
          setWsStatus('disconnected');
        };
      } catch (err) {
        console.error('[Crusaders WS] Failed to initialize WebSocket:', err);
        setWsConnected(false);
        setWsStatus('disconnected');
        if (!isCleanedUp) {
          reconnectTimer = setTimeout(connectWs, 3000);
        }
      }
    };

    connectWs();
    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    await fetchBase();
    if (wsRef.current) {
      wsRef.current.close();
    }
    setTimeout(() => setIsRetrying(false), 800);
  };

  const handleSearchPlate = (plate: string) => {
    setSelectedPlate(plate);
    setActiveNav('trajectories');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f7fb] text-slate-800 font-sans">
      {/* 1. Left Sidebar */}
      <CommanderSidebar
        activeNav={activeNav}
        onSelectNav={(nav) => {
          setActiveNav(nav);
          if (nav === 'vehicle_search') {
            setIsLiveVehiclesDBOpen(true);
          }
        }}
        onOpenLiveVehiclesDB={() => setIsLiveVehiclesDBOpen(true)}
        onOpenConsecutiveTracker={() => setIsConsecutiveTrackerOpen(true)}
      />

      {/* 2. Main Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <CommanderHeader
          onSearchPlate={handleSearchPlate}
          onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          alertCount={alerts.length || 3}
          isLive={wsConnected}
          apiStatus={apiStatus}
          wsStatus={wsStatus}
          dataOrigin={dataOrigin}
          onRetryConnection={handleRetry}
        />

        {/* Operational Status Bar Alongside Every View */}
        <OperationalStatusBar
          activeNav={activeNav}
          apiStatus={apiStatus}
          wsStatus={wsStatus}
          dataOrigin={dataOrigin}
          lastSyncTime={lastSyncTime}
          errorMessage={apiError}
          onRetry={handleRetry}
          isRetrying={isRetrying}
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
            apiStatus={apiStatus}
            wsStatus={wsStatus}
            dataOrigin={dataOrigin}
          />
        )}

        {/* Dedicated Live Map View */}
        {activeNav === 'live_map' && (
          <LiveMapView
            cameras={cameras}
            onOpenFeed={(camId) => setIsConsecutiveTrackerOpen(true)}
            apiStatus={apiStatus}
            wsStatus={wsStatus}
            dataOrigin={dataOrigin}
          />
        )}

        {/* Dedicated Convoy View */}
        {activeNav === 'convoy_intelligence' && (
          <ConvoyView
            apiStatus={apiStatus}
            wsStatus={wsStatus}
            dataOrigin={dataOrigin}
          />
        )}

        {/* Dedicated Alibi View */}
        {activeNav === 'alibi_verification' && (
          <AlibiView
            apiStatus={apiStatus}
            wsStatus={wsStatus}
            dataOrigin={dataOrigin}
          />
        )}

        {/* Dedicated Camera Network View */}
        {activeNav === 'camera_network' && (
          <CameraNetworkView
            cameras={cameras}
            onOpenFeed={(camId) => setIsConsecutiveTrackerOpen(true)}
            apiStatus={apiStatus}
            wsStatus={wsStatus}
            dataOrigin={dataOrigin}
          />
        )}

        {/* Dedicated Analytics View */}
        {activeNav === 'analytics' && (
          <AnalyticsView
            apiStatus={apiStatus}
            wsStatus={wsStatus}
            dataOrigin={dataOrigin}
          />
        )}

        {/* Dedicated Settings View */}
        {activeNav === 'settings' && (
          <SettingsView
            apiStatus={apiStatus}
            wsStatus={wsStatus}
            dataOrigin={dataOrigin}
            onRetryConnection={handleRetry}
          />
        )}

        {/* Vehicle Search View */}
        {activeNav === 'vehicle_search' && (
          <div className="flex-1 p-6">
            <LiveVehiclesDatabaseModal
              isOpen={true}
              onClose={() => setActiveNav('overview')}
              onSelectPlate={(plate) => {
                setSelectedPlate(plate);
                setActiveNav('trajectories');
              }}
            />
          </div>
        )}
      </div>

      {/* Slide-over Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[600] flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-[380px] bg-white h-full shadow-2xl p-5 flex flex-col justify-between border-l border-slate-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Priority Intelligence Alerts
                  </h3>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-rose-800">
                      DL8CAF2381
                    </span>
                    <span className="text-[10px] font-mono text-rose-600">
                      17:41:52
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    Ghost Plate Detected
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Logged at CAM_03 concurrent with CAM_01 within Δt &lt; 30s.
                  </p>
                </div>

                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {alt.plate}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {alt.camera_id}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {alt.alert_type}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {typeof alt.details === 'string'
                        ? alt.details
                        : JSON.stringify(alt.details)}
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
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Open Live Vehicles Database
            </button>
          </div>
        </div>
      )}

      {/* 2 Consecutive Cameras Real Live Footage Modal */}
      <ConsecutiveCameraTracker
        isOpen={isConsecutiveTrackerOpen}
        onClose={() => setIsConsecutiveTrackerOpen(false)}
      />

      {/* Passing Live Streaming Vehicles SQLite Database Modal */}
      <LiveVehiclesDatabaseModal
        isOpen={isLiveVehiclesDBOpen}
        onClose={() => setIsLiveVehiclesDBOpen(false)}
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
        onUploadComplete={() => setIsNotificationsOpen(true)}
      />

      {/* Citizen PWA Modal */}
      <CitizenPWAModal
        isOpen={isCitizenPWAOpen}
        onClose={() => setIsCitizenPWAOpen(false)}
        onReportSubmitted={() => setIsNotificationsOpen(true)}
      />
    </div>
  );
};
