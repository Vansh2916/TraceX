import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Car,
  Video,
  Activity,
  Zap,
  Gauge,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const statsByRange = {
    '24h': {
      sightings: '18,492',
      trendSightings: '+14.2% from yesterday',
      overspeed: '342',
      peakCorridor: 'Barakhamba Rd (86 km/h)',
      ocrConfidence: '98.4%',
      tacticalUnits: '8 Units Active',
      responseTime: '2.4 min',
      hourlyData: [35, 45, 60, 80, 95, 70, 50, 40, 65, 85, 90, 100],
    },
    '7d': {
      sightings: '124,810',
      trendSightings: '+8.7% vs last week',
      overspeed: '2,180',
      peakCorridor: 'NH-48 Dhaula Kuan (102 km/h)',
      ocrConfidence: '98.1%',
      tacticalUnits: '12 Units Active',
      responseTime: '2.1 min',
      hourlyData: [60, 75, 85, 90, 100, 80, 70, 65, 80, 95, 85, 90],
    },
    '30d': {
      sightings: '512,400',
      trendSightings: '+21.5% monthly growth',
      overspeed: '8,940',
      peakCorridor: 'Outer Ring Road (112 km/h)',
      ocrConfidence: '98.3%',
      tacticalUnits: '15 Units Active',
      responseTime: '1.9 min',
      hourlyData: [70, 80, 90, 95, 85, 75, 60, 70, 85, 90, 100, 95],
    },
  }[timeRange];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto select-none">
      {/* Top Banner Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                City-Wide ANPR Analytics & Vision Diagnostics
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                TELEMETRY ENGINE V1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Corridor throughput, speed violation density, and neural OCR confidence levels across Delhi NCR.
            </p>
          </div>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === r
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r === '24h' ? 'Last 24 Hours' : r === '7d' ? 'Past 7 Days' : 'Past 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Sightings</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{statsByRange.sightings}</div>
          <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{statsByRange.trendSightings}</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Speed Violations</span>
            <Gauge className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">{statsByRange.overspeed}</div>
          <span className="text-[10.5px] font-medium text-rose-600 mt-0.5 block truncate">
            Peak: {statsByRange.peakCorridor}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">OCR Confidence</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{statsByRange.ocrConfidence}</div>
          <span className="text-[10.5px] font-medium text-slate-500 mt-0.5 block">
            NVIDIA TensorRT + YOLOv8x
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Tactical PCR Units</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">{statsByRange.tacticalUnits}</div>
          <span className="text-[10.5px] font-medium text-slate-500 mt-0.5 block">
            Mean intercept ETA: {statsByRange.responseTime}
          </span>
        </div>
      </div>

      {/* Middle Charts Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Hourly Traffic Density Bar Chart */}
        <div className="col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Hourly Telemetry Density Distribution</h3>
            <span className="text-[10px] font-mono text-slate-400">Peak Corridors: 17:00 - 19:30</span>
          </div>

          <div className="h-48 flex items-end space-x-2 pt-6">
            {statsByRange.hourlyData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full bg-gradient-to-t from-blue-700 to-cyan-500 rounded-t-md group-hover:from-blue-600 group-hover:to-cyan-400 transition-all duration-300 shadow-xs"
                />
                <span className="text-[9px] font-mono text-slate-400">{i * 2}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Classification Breakdown */}
        <div className="col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Fleet Class Distribution</h3>
            <span className="text-[10px] font-mono text-blue-600 font-bold">DELHI TRAFFIC PROFILE</span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { type: 'SUVs & Compact Offroaders (Scorpio, Fortuner, Creta)', count: '42%', color: 'bg-blue-600' },
              { type: 'Sedans (City, Verna, Dzire)', count: '28%', color: 'bg-cyan-500' },
              { type: 'Hatchbacks (Swift, i20, Altroz)', count: '18%', color: 'bg-emerald-500' },
              { type: 'Public & Commercial (DTC Electric, Tata Ace)', count: '12%', color: 'bg-amber-500' },
            ].map((v, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="text-[11px] truncate max-w-[220px]">{v.type}</span>
                  <span className="font-mono text-slate-900 font-bold">{v.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: v.count }} className={`h-full ${v.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Corridors Performance Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800">Highest Anomaly Corridors Breakdown</h3>
        <div className="grid grid-cols-4 gap-3 text-xs">
          {[
            { corridor: 'Barakhamba Road Corridor (CAM_01 → CAM_02)', count: 142, speed: '86 km/h', status: 'CRITICAL HOTSPOT' },
            { corridor: 'Vikas Marg East Corridor (CAM_03 ITO)', count: 98, speed: '78 km/h', status: 'HIGH VOLUME' },
            { corridor: 'NH-48 Dhaula Kuan Express Corridor (CAM_06)', count: 68, speed: '94 km/h', status: 'SPEED VIOLATIONS' },
            { corridor: 'Ring Road AIIMS South Flyover (CAM_05)', count: 52, speed: '62 km/h', status: 'MONITORED' },
          ].map((c, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <span className="text-[9.5px] font-mono font-bold text-rose-600 block">{c.status}</span>
              <h4 className="font-bold text-slate-800 text-[11.5px] leading-tight truncate">{c.corridor}</h4>
              <div className="flex justify-between text-[10.5px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                <span>{c.count} Incidents</span>
                <span className="font-bold text-slate-800">{c.speed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
