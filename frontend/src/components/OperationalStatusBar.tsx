import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Radio,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Layers,
} from 'lucide-react';
import { ConnectionStatus, DataOrigin } from '../types';

interface OperationalStatusBarProps {
  activeNav: string;
  apiStatus: ConnectionStatus;
  wsStatus: ConnectionStatus;
  dataOrigin: DataOrigin;
  lastSyncTime: Date | null;
  errorMessage?: string | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

const VIEW_TITLES: Record<string, { label: string; icon: string }> = {
  overview: { label: 'System Overview & Telemetry Grid', icon: '📊' },
  live_map: { label: 'Live Surveillance Map & Checkpoints', icon: '🗺️' },
  vehicle_search: { label: 'Vehicle Search & SQLite Passing Database', icon: '🔍' },
  trajectories: { label: 'Markov Predictive Trajectory Intelligence', icon: '📈' },
  convoy_intelligence: { label: 'Convoy Intelligence & Escort Detection', icon: '🚘' },
  alibi_verification: { label: 'Alibi Verification & Teleportation Defense', icon: '⚖️' },
  camera_network: { label: 'Camera Network & Multi-Junction RTSP Feeds', icon: '📹' },
  analytics: { label: 'City-Wide Vision Analytics & OCR Diagnostics', icon: '📉' },
  settings: { label: 'ANPR Configuration & Network Diagnostics', icon: '⚙️' },
};

export const OperationalStatusBar: React.FC<OperationalStatusBarProps> = ({
  activeNav,
  apiStatus,
  wsStatus,
  dataOrigin,
  lastSyncTime,
  errorMessage,
  onRetry,
  isRetrying = false,
}) => {
  const currentView = VIEW_TITLES[activeNav] || { label: 'Operational View', icon: '🎯' };

  return (
    <div className="px-6 mb-3 shrink-0 select-none">
      {/* Main Status Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Identifier */}
        <div className="flex items-center space-x-2.5">
          <span className="text-base">{currentView.icon}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[12px] font-bold text-slate-800 tracking-tight">
                {currentView.label}
              </span>
              <span className="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                VIEW: {activeNav}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Connection Badges & Data Origin */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* REST API Status */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              apiStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : apiStatus === 'connecting'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={apiStatus === 'connected' ? 'REST API is connected to backend' : 'REST API is unreachable'}
          >
            <Server className="w-3.5 h-3.5" />
            <span>
              API:{' '}
              {apiStatus === 'connected'
                ? 'Online'
                : apiStatus === 'connecting'
                ? 'Connecting...'
                : 'Offline'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === 'connected'
                  ? 'bg-emerald-500'
                  : apiStatus === 'connecting'
                  ? 'bg-sky-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
          </div>

          {/* WebSocket Status */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              wsStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : wsStatus === 'connecting'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={wsStatus === 'connected' ? 'Live WebSocket telemetry active' : 'WebSocket stream disconnected'}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>
              WS:{' '}
              {wsStatus === 'connected'
                ? 'Live Stream'
                : wsStatus === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wsStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : wsStatus === 'connecting'
                  ? 'bg-sky-500 animate-ping'
                  : 'bg-amber-500'
              }`}
            />
          </div>

          {/* Data Origin Indicator */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs transition-colors ${
              dataOrigin === 'live'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-amber-500 text-white border-amber-600'
            }`}
          >
            {dataOrigin === 'live' ? (
              <Database className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>
              Data Origin:{' '}
              {dataOrigin === 'live'
                ? 'Live Backend Stream'
                : 'Demo / Mock Data (Offline Fallback)'}
            </span>
          </div>

          {/* Last Synced & Retry Button */}
          {lastSyncTime && (
            <span className="text-[10.5px] text-slate-400 font-mono hidden md:inline">
              Synced: {lastSyncTime.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition disabled:opacity-50"
            title="Refresh connection and refetch telemetry"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Re-sync'}</span>
          </button>
        </div>
      </div>

      {/* Warning Banner When in Demo Mode or API Offline */}
      {dataOrigin === 'mock' && (
        <div className="mt-2 bg-amber-50/90 border border-amber-200/90 rounded-xl px-3.5 py-2 flex items-center justify-between text-amber-900 text-[11.5px] animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Live Backend Unavailable: </span>
              <span>
                Operational views are displaying demo records (5 simulation vehicles). Real-time telemetry is paused until the backend connects.
              </span>
              {errorMessage && (
                <span className="ml-1 text-[10.5px] text-amber-700 font-mono">
                  ({errorMessage})
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="px-2.5 py-0.5 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold text-[10.5px] shrink-0 transition"
          >
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};
