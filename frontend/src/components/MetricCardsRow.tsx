import React from 'react';
import { Car, Video, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MetricCardsRowProps {
  vehicleCount?: number;
  cameraCount?: number;
  anomalyCount?: number;
  pursuitCount?: number;
  onCardClick?: (metric: string) => void;
}

export const MetricCardsRow: React.FC<MetricCardsRowProps> = ({
  vehicleCount = 2481,
  cameraCount = 12,
  anomalyCount = 7,
  pursuitCount = 3,
  onCardClick,
}) => {
  return (
    <div className="grid grid-cols-4 gap-4 px-6 mb-4 select-none">
      {/* 1. Vehicles Tracked */}
      <div
        onClick={() => onCardClick?.('vehicles')}
        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-slate-500">
              Vehicles Tracked
            </p>
            <div className="flex items-baseline space-x-2">
              <span className="text-[21px] font-black text-slate-800 tracking-tight leading-none mt-0.5">
                {vehicleCount.toLocaleString()}
              </span>
              <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                ↑ +12%
              </span>
            </div>
          </div>
        </div>
        {/* Blue Sparkline SVG */}
        <div className="w-20 h-9 shrink-0">
          <svg className="w-full h-full" viewBox="0 0 80 36">
            <defs>
              <linearGradient id="blueSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,28 Q15,22 30,26 T55,14 T80,8"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M0,28 Q15,22 30,26 T55,14 T80,8 L80,36 L0,36 Z"
              fill="url(#blueSpark)"
            />
          </svg>
        </div>
      </div>

      {/* 2. Active Cameras */}
      <div
        onClick={() => onCardClick?.('cameras')}
        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-slate-500">
              Active Cameras
            </p>
            <div className="flex items-baseline space-x-2">
              <span className="text-[21px] font-black text-slate-800 tracking-tight leading-none mt-0.5">
                {cameraCount} / {cameraCount}
              </span>
              <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" />
                Online
              </span>
            </div>
          </div>
        </div>
        {/* Purple Sparkline SVG */}
        <div className="w-20 h-9 shrink-0">
          <svg className="w-full h-full" viewBox="0 0 80 36">
            <defs>
              <linearGradient id="purpleSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,24 Q20,30 40,20 T65,12 T80,6"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M0,24 Q20,30 40,20 T65,12 T80,6 L80,36 L0,36 Z"
              fill="url(#purpleSpark)"
            />
          </svg>
        </div>
      </div>

      {/* 3. Anomalies */}
      <div
        onClick={() => onCardClick?.('anomalies')}
        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-slate-500">Anomalies</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-[21px] font-black text-slate-800 tracking-tight leading-none mt-0.5">
                {anomalyCount < 10 ? `0${anomalyCount}` : anomalyCount}
              </span>
              <span className="text-[10.5px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                ↑ +2
              </span>
            </div>
          </div>
        </div>
        {/* Red Sparkline SVG */}
        <div className="w-20 h-9 shrink-0">
          <svg className="w-full h-full" viewBox="0 0 80 36">
            <defs>
              <linearGradient id="redSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,28 Q25,32 45,22 T70,16 T80,10"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M0,28 Q25,32 45,22 T70,16 T80,10 L80,36 L0,36 Z"
              fill="url(#redSpark)"
            />
          </svg>
        </div>
      </div>

      {/* 4. Active Pursuits */}
      <div
        onClick={() => onCardClick?.('pursuits')}
        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11.5px] font-medium text-slate-500">
              Active Pursuits
            </p>
            <div className="flex items-baseline space-x-2">
              <span className="text-[21px] font-black text-slate-800 tracking-tight leading-none mt-0.5">
                {pursuitCount < 10 ? `0${pursuitCount}` : pursuitCount}
              </span>
            </div>
          </div>
        </div>
        {/* Emerald Sparkline SVG */}
        <div className="w-20 h-9 shrink-0">
          <svg className="w-full h-full" viewBox="0 0 80 36">
            <defs>
              <linearGradient id="emeraldSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,26 Q20,20 40,24 T65,16 T80,12"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M0,26 Q20,20 40,24 T65,16 T80,12 L80,36 L0,36 Z"
              fill="url(#emeraldSpark)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
