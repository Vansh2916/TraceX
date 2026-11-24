import React, { useState, useEffect } from 'react';
import { Shield, Zap, AlertTriangle, Ghost, Film, Smartphone, Radio, Play, Pause, Database } from 'lucide-react';

interface TopBarProps {
  wsConnected: boolean;
  onSimulateTick: () => void;
  onTriggerHitAndRun: () => void;
  onTriggerGhostPlate: () => void;
  onOpenDashcam: () => void;
  onOpenCitizenPWA: () => void;
  onOpenLiveVehiclesDB?: () => void;
  isAutoSimulating: boolean;
  onToggleAutoSim: () => void;
  alertCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  wsConnected,
  onSimulateTick,
  onTriggerHitAndRun,
  onTriggerGhostPlate,
  onOpenDashcam,
  onOpenCitizenPWA,
  onOpenLiveVehiclesDB,
  isAutoSimulating,
  onToggleAutoSim,
  alertCount
}) => {
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-[#080c14] border-b border-slate-800 px-4 flex items-center justify-between z-50 select-none">
      {/* Title & Branding */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-950 border border-sky-400">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold font-mono tracking-wider text-sm text-white">
              CRUSADERS
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30">
              ANPR INTELLIGENCE
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-sans hidden sm:block">
            City-Wide Multi-Junction Trajectory & Anomaly Engine • Delhi NCR
          </div>
        </div>
      </div>

      {/* One-Click Demo Action Triggers */}
      <div className="flex items-center space-x-2">
        {/* Simulate Live Traffic Button */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onSimulateTick}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs font-mono font-medium flex items-center space-x-1.5 transition active:scale-95"
            title="Inject single telemetry event"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Simulate Traffic</span>
          </button>
          <button
            onClick={onToggleAutoSim}
            className={`p-1.5 rounded-lg border text-xs font-mono transition ${
              isAutoSimulating
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={isAutoSimulating ? 'Pause continuous stream' : 'Start continuous auto traffic'}
          >
            {isAutoSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Trigger Hit and Run */}
        <button
          onClick={onTriggerHitAndRun}
          className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/80 text-xs font-mono font-semibold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
          title="Simulate Hit-and-Run Suspect Flight"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="hidden lg:inline">Hit & Run</span>
        </button>

        {/* Trigger Ghost Plate */}
        <button
          onClick={onTriggerGhostPlate}
          className="px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-800/80 text-xs font-mono font-semibold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
          title="Simulate Dijkstra Minimum Time Teleportation Anomaly"
        >
          <Ghost className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">Ghost Plate</span>
        </button>

        {/* Real Car CCTV Live Video Feed */}
        <button
          onClick={onOpenDashcam}
          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white border border-red-400 text-xs font-mono font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-lg shadow-red-950/60"
          title="Watch Real Car CCTV Video Stream"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          <Film className="w-3.5 h-3.5 text-white" />
          <span>🔴 LIVE CAR CCTV</span>
        </button>

        {/* Live Passing Vehicles Database */}
        {onOpenLiveVehiclesDB && (
          <button
            onClick={onOpenLiveVehiclesDB}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/80 text-xs font-mono font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-md shadow-emerald-950/60"
            title="Inspect Live Streaming Vehicles Database"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">📊 VEHICLES DB</span>
          </button>
        )}

        {/* Open Citizen PWA (/report) */}
        <button
          onClick={onOpenCitizenPWA}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/80 text-xs font-mono font-semibold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
          title="Open Citizen PWA Mobile Report View"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Citizen PWA</span>
        </button>
      </div>

      {/* Status & Clock */}
      <div className="flex items-center space-x-3 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            {wsConnected ? 'WS LIVE' : 'CONNECTING'}
          </span>
        </div>
        <div className="text-slate-300 font-semibold hidden md:block">
          {clock}
        </div>
      </div>
    </header>
  );
};
