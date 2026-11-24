import React, { useState } from 'react';
import { Alert, Camera } from '../types';
import { ShieldAlert, Zap, Radio, AlertTriangle, Crosshair, ChevronDown, ChevronUp, Navigation, Car } from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
  cameras: Camera[];
  onFocusCamera: (camId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, cameras, onFocusCamera }) => {
  const [expandedId, setExpandedId] = useState<number | null>(alerts.length > 0 ? alerts[0].id : null);
  const camMap = new Map(cameras.map((c) => [c.id, c]));

  const getAlertBadge = (type: string, severity: string) => {
    switch (type) {
      case 'GHOST_ALERT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse" /> GHOST CLONE
          </span>
        );
      case 'WATCHLIST_HIT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> WATCHLIST MATCH
          </span>
        );
      case 'SPEED_VIOLATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Zap className="w-3 h-3" /> SPEED &gt; 80 KM/H
          </span>
        );
      case 'CONVOY_DETECTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <Car className="w-3 h-3" /> CONVOY DETECTED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-700 text-slate-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-200">
      {/* Header bar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
            Live Priority Alerts
          </span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
          {alerts.length} ACTIVE
        </span>
      </div>

      {/* Alerts Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-mono">No active tactical anomalies detected.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            const cam = camMap.get(alert.camera_id);
            const timeStr = new Date(alert.iso_time || alert.timestamp_sec * 1000).toLocaleTimeString();

            return (
              <div
                key={alert.id}
                className={`rounded-lg border transition-all duration-150 ${
                  alert.alert_type === 'GHOST_ALERT'
                    ? 'border-red-900/50 bg-red-950/10 hover:border-red-600/70'
                    : alert.alert_type === 'WATCHLIST_HIT'
                    ? 'border-rose-900/50 bg-rose-950/10 hover:border-rose-600/70'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                {/* Alert Card Header */}
                <div
                  className="p-3 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    {getAlertBadge(alert.alert_type, alert.severity)}
                    <span className="text-[11px] font-mono text-slate-400">{timeStr}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold font-mono tracking-wider text-white">
                        {alert.plate}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {cam?.name || alert.camera_id} ({alert.camera_id})
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFocusCamera(alert.camera_id);
                        }}
                        className="p-1.5 rounded bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 transition border border-slate-700"
                        title="Focus on Camera"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                      </button>
                      <button className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Anomaly Details */}
                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-slate-800/80 text-xs space-y-2.5 font-sans bg-black/20">
                    {/* Ghost Alert specifics */}
                    {alert.alert_type === 'GHOST_ALERT' && alert.details && (
                      <div className="p-2.5 rounded bg-red-950/30 border border-red-900/60 text-red-200 space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center space-x-1 text-red-400 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>DIJKSTRA MINIMUM PHYSICAL TIME VIOLATION</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                          <div>
                            Theoretical Min Time: <b className="text-white">{alert.details.dijkstra_min_time_sec}s</b>
                          </div>
                          <div>
                            Actual Observed Delta: <b className="text-red-400">{alert.details.actual_time_sec}s</b>
                          </div>
                          <div>
                            Haversine Distance: <b className="text-white">{alert.details.haversine_distance_km} km</b>
                          </div>
                          <div>
                            Implied Teleport Speed: <b className="text-red-400">{alert.details.speed_kmh} km/h</b>
                          </div>
                        </div>
                        {alert.details.ghost_explanation && (
                          <div className="pt-1 text-[10px] text-red-300/80 leading-relaxed font-sans">
                            {alert.details.ghost_explanation}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Speed Violation specifics */}
                    {alert.alert_type === 'SPEED_VIOLATION' && alert.details && (
                      <div className="p-2.5 rounded bg-amber-950/30 border border-amber-900/60 text-amber-200 space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Recorded Velocity:</span>
                          <b className="text-amber-400 text-sm">{alert.details.speed_kmh} km/h</b>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Corridor Limit:</span>
                          <b className="text-slate-300">{alert.details.limit_kmh} km/h</b>
                        </div>
                      </div>
                    )}

                    {/* Watchlist Hit & Markov Interception Details */}
                    {alert.alert_type === 'WATCHLIST_HIT' && alert.details && (
                      <div className="space-y-2">
                        <div className="p-2 rounded bg-rose-950/30 border border-rose-900/60 text-rose-200">
                          <div className="font-bold text-rose-400 font-mono text-[11px]">REASON FOR ENROLLMENT:</div>
                          <div className="text-xs text-slate-200">{alert.details.reason}</div>
                        </div>

                        {/* Markov Top Next Likely Junctions */}
                        {alert.details.predicted_next && alert.details.predicted_next.length > 0 && (
                          <div className="p-2.5 rounded bg-purple-950/20 border border-purple-900/50 space-y-1.5 font-mono text-[11px]">
                            <div className="text-purple-300 font-bold flex items-center space-x-1">
                              <Navigation className="w-3.5 h-3.5" />
                              <span>MARKOV CHAIN TRAJECTORY PROJECTION</span>
                            </div>
                            {alert.details.predicted_next.map((pred: any, pidx: number) => (
                              <div key={pidx} className="flex items-center justify-between text-slate-300">
                                <span>
                                  #{pidx + 1} <b>{pred.camera_name}</b> ({pred.camera_id})
                                </span>
                                <span className="text-purple-400 font-bold">
                                  {Math.round(pred.probability * 100)}% | ETA {pred.eta_seconds}s
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Nearest PCR Unit */}
                        {alert.details.pcr_dispatch && alert.details.pcr_dispatch.nearest_pcr && (
                          <div className="p-2.5 rounded bg-blue-950/30 border border-blue-900/50 space-y-1 font-mono text-[11px]">
                            <div className="text-blue-300 font-bold flex items-center justify-between">
                              <span>RECOMMENDED INTERCEPTION UNIT</span>
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                                {alert.details.pcr_dispatch.nearest_pcr.callsign}
                              </span>
                            </div>
                            <div className="text-slate-300">
                              Vehicle: <b>{alert.details.pcr_dispatch.nearest_pcr.vehicle}</b> ({alert.details.pcr_dispatch.nearest_pcr.station})
                            </div>
                            <div className="flex items-center justify-between text-slate-400 pt-0.5">
                              <span>Intercept Dist: <b>{alert.details.pcr_dispatch.nearest_pcr.distance_km} km</b></span>
                              <span className="text-emerald-400 font-bold">ETA: ~{alert.details.pcr_dispatch.nearest_pcr.intercept_eta_min} min</span>
                            </div>
                            <button
                              onClick={() => window.alert(`[DISPATCH ORDER TRANSMITTED]\nUnit ${alert.details.pcr_dispatch.nearest_pcr.callsign} dispatched to intercept ${alert.plate} at ${alert.details.pcr_dispatch.intercept_camera_name}.`)}
                              className="w-full mt-1.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] tracking-wider uppercase transition shadow"
                            >
                              Dispatch Interceptor Now
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
