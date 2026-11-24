import React from 'react';
import { ChevronDown } from 'lucide-react';

export const AnalyticsOverviewCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col justify-between h-[190px] select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-[12.5px] font-bold text-slate-800">
          Analytics Overview
        </h4>
        <div className="flex items-center space-x-1 text-[10.5px] font-medium text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md cursor-pointer hover:bg-slate-100">
          <span>Last 24 Hours</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-3 text-[10.5px] font-medium text-slate-500">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          <span>Vehicles</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span>Alerts</span>
        </div>
      </div>

      {/* SVG Dual Line Chart */}
      <div className="relative w-full h-[95px] flex items-center">
        {/* Y-axis Ticks */}
        <div className="flex flex-col justify-between h-[75px] text-[8.5px] font-mono text-slate-400 mr-1.5 shrink-0 select-none">
          <span>3k</span>
          <span>2k</span>
          <span>1k</span>
          <span>0k</span>
        </div>

        {/* SVG Curves */}
        <div className="w-full h-[75px] relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="redAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line x1="0" y1="10" x2="200" y2="10" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="30" x2="200" y2="30" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="50" x2="200" y2="50" stroke="#f1f5f9" strokeWidth="1" />

            {/* Blue Filled Area (Vehicles) */}
            <path
              d="M0,45 C30,40 50,22 80,26 C110,30 130,8 160,10 C180,12 195,18 200,20 L200,60 L0,60 Z"
              fill="url(#blueAreaGrad)"
            />

            {/* Blue Line (Vehicles) */}
            <path
              d="M0,45 C30,40 50,22 80,26 C110,30 130,8 160,10 C180,12 195,18 200,20"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* End dot */}
            <circle cx="200" cy="20" r="2.5" fill="#2563eb" />

            {/* Red Filled Area (Alerts) */}
            <path
              d="M0,55 C35,52 65,48 95,50 C125,52 145,40 175,42 C185,43 195,48 200,50 L200,60 L0,60 Z"
              fill="url(#redAreaGrad)"
            />

            {/* Red Line (Alerts) */}
            <path
              d="M0,55 C35,52 65,48 95,50 C125,52 145,40 175,42 C185,43 195,48 200,50"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* X-axis Labels */}
      <div className="flex justify-between pl-6 text-[8.5px] font-mono text-slate-400">
        <span>12AM</span>
        <span>6AM</span>
        <span>12PM</span>
        <span>6PM</span>
        <span>12AM</span>
      </div>
    </div>
  );
};
