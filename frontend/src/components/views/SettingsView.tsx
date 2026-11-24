import React, { useState } from 'react';
import { Settings, Sliders, ShieldCheck, Cpu, Bell, Database, Server, Radio, AlertTriangle, RefreshCw } from 'lucide-react';
import { ConnectionStatus, DataOrigin } from '../../types';
import { getApiBaseUrl, getWebSocketUrl } from '../../utils/api';

interface SettingsViewProps {
  apiStatus?: ConnectionStatus;
  wsStatus?: ConnectionStatus;
  dataOrigin?: DataOrigin;
  onRetryConnection?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  apiStatus = 'connected',
  wsStatus = 'connected',
  dataOrigin = 'mock',
  onRetryConnection,
}) => {
  const [ocrConfidence, setOcrConfidence] = useState(85);
  const [maxSpeedTolerance, setMaxSpeedTolerance] = useState(10);
  const [ghostDeltaSec, setGhostDeltaSec] = useState(30);

  const apiEndpoint = getApiBaseUrl() || window.location.origin;
  const wsEndpoint = getWebSocketUrl();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
              ANPR System Configuration & Tactical Parameters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune optical recognition sensitivity, Markov model transition probabilities, and automated police dispatch triggers.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">Vision & Optical Engine</h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>OCR Plate Confidence Threshold</span>
                <span className="font-mono text-blue-600 font-bold">{ocrConfidence}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={ocrConfidence}
                onChange={(e) => setOcrConfidence(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Speed Tolerance Before Violation (+km/h)</span>
                <span className="font-mono text-rose-600 font-bold">+{maxSpeedTolerance} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={maxSpeedTolerance}
                onChange={(e) => setMaxSpeedTolerance(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Ghost Plate Concurrent Window (Δt)</span>
                <span className="font-mono text-amber-600 font-bold">{ghostDeltaSec} sec</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={ghostDeltaSec}
                onChange={(e) => setGhostDeltaSec(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">Active AI Models & Hardware</h3>
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Object Detection Engine</span>
                <span className="text-[11px] text-slate-500">YOLOv8x-ANPR (TensorRT 8.6)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE (0.8ms)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Multimodal Vision LLM</span>
                <span className="text-[11px] text-slate-500">NVIDIA Nemotron 3.5 Super VL</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ONLINE
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Telemetry Database</span>
                <span className="text-[11px] text-slate-500">SQLite WAL Mode (crusaders.db)</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                apiStatus === 'connected'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {apiStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </div>

        {/* Full-Width Network & Telemetry Diagnostics Card */}
        <div className="col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Network, WebSocket & Data Origin Diagnostics</h3>
            </div>
            {onRetryConnection && (
              <button
                onClick={onRetryConnection}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1 transition"
              >
                <RefreshCw className="w-3 h-3 text-blue-600" />
                <span>Test & Re-Sync</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* REST API Status */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">REST API Endpoint</span>
              <span className="font-mono text-xs text-slate-700 block truncate" title={apiEndpoint}>
                {apiEndpoint}
              </span>
              <div className="flex items-center space-x-1.5 pt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    apiStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className={`font-bold text-[11px] ${
                  apiStatus === 'connected' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Status: {apiStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* WebSocket Status */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">WebSocket Endpoint</span>
              <span className="font-mono text-xs text-slate-700 block truncate" title={wsEndpoint}>
                {wsEndpoint}
              </span>
              <div className="flex items-center space-x-1.5 pt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className={`font-bold text-[11px] ${
                  wsStatus === 'connected' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  Status: {wsStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Current Active Data Origin */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Active Data Origin</span>
              <span className="font-mono text-xs text-slate-700 block">
                {dataOrigin === 'live' ? 'Live Telemetry Ingestion' : 'Simulation Fallback Mode'}
              </span>
              <div className="flex items-center space-x-1.5 pt-1">
                {dataOrigin === 'live' ? (
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span className={`font-bold text-[11px] ${
                  dataOrigin === 'live' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {dataOrigin === 'live' ? 'Live SQLite Backend' : '5 Demo Records (API Offline)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
