import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Car, Video, Server } from 'lucide-react';
import { ConnectionStatus, DataOrigin } from '../../types';

interface AnalyticsViewProps {
  apiStatus?: ConnectionStatus;
  wsStatus?: ConnectionStatus;
  dataOrigin?: DataOrigin;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  apiStatus = 'connected',
  wsStatus = 'connected',
  dataOrigin = 'mock',
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                City-Wide ANPR Analytics & Vision Diagnostics
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                24H METRICS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Corridor throughput, speed violation density, and neural OCR confidence levels across Delhi NCR.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            dataOrigin === 'live' && apiStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            {dataOrigin === 'live' && apiStatus === 'connected'
              ? '● DATA ORIGIN: LIVE SIGHTINGS'
              : '▲ DATA ORIGIN: DEMO 24H BASELINE'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center space-x-1 ${
            apiStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <Server className="w-3 h-3" />
            <span>API: {apiStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Total Sightings Today</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">18,492</div>
          <span className="text-[10.5px] font-bold text-emerald-600">↑ +14.2% from yesterday</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Over-Speed Violations</span>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">342</div>
          <span className="text-[10.5px] font-bold text-rose-600">Peak: Barakhamba Rd (86 km/h)</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Average OCR Confidence</span>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">97.8%</div>
          <span className="text-[10.5px] font-medium text-slate-500">YOLOv8x + PaddleOCR</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Active Tactical Units</span>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">8 Units</div>
          <span className="text-[10.5px] font-medium text-slate-500">Mean response time: 2.4 min</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800">Hourly Traffic & Sighting Density</h3>
          <div className="h-48 flex items-end space-x-2 pt-6">
            {[35, 45, 60, 80, 95, 70, 50, 40, 65, 85, 90, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full bg-blue-600 rounded-t-md hover:bg-blue-700 transition"
                />
                <span className="text-[9px] font-mono text-slate-400">{i * 2}h</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800">Top Violation Corridors</h3>
          <div className="space-y-2.5 text-xs">
            {[
              { corridor: 'Barakhamba Road Corridor (CAM_01 → CAM_02)', count: 124, pct: '36%' },
              { corridor: 'Vikas Marg East Corridor (CAM_03 ITO)', count: 98, pct: '28%' },
              { corridor: 'NH-48 Dhaula Kuan Express Corridor (CAM_06)', count: 68, pct: '20%' },
              { corridor: 'Ring Road AIIMS South Flyover (CAM_05)', count: 52, pct: '16%' },
            ].map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="truncate max-w-[280px]">{c.corridor}</span>
                  <span className="font-mono text-slate-900">{c.count} ({c.pct})</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: c.pct }} className="h-full bg-rose-500 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
