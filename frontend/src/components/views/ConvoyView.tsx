import React, { useState } from 'react';
import { Users, Car, ShieldAlert, ArrowRight, CheckCircle2, Clock, Server, AlertTriangle } from 'lucide-react';
import { ConnectionStatus, DataOrigin } from '../../types';

interface ConvoyViewProps {
  apiStatus?: ConnectionStatus;
  wsStatus?: ConnectionStatus;
  dataOrigin?: DataOrigin;
}

export const ConvoyView: React.FC<ConvoyViewProps> = ({
  apiStatus = 'connected',
  wsStatus = 'connected',
  dataOrigin = 'mock',
}) => {
  const convoys = [
    {
      id: 'CNV_01',
      plates: ['DL 1C AA 9999', 'HR 26 DQ 8888'],
      vehicles: 'White Mahindra Scorpio & Black Toyota Fortuner',
      route: 'CAM_06 (Dhaula Kuan) → CAM_09 (Moti Bagh) → CAM_05 (AIIMS)',
      coOccurrence: 3,
      avgDeltaT: '38s (Trailing formation)',
      risk: 'HIGH - ESCORT TACTIC DETECTED',
      status: 'UNDER ACTIVE TRACKING',
    },
    {
      id: 'CNV_02',
      plates: ['UP 16 BT 4097', 'DL 3C CC 0456'],
      vehicles: 'Red Maruti Swift & Grey Honda City',
      route: 'CAM_08 (Ashram) → CAM_12 (Sarai Kale Khan)',
      coOccurrence: 2,
      avgDeltaT: '22s',
      risk: 'MEDIUM - CO-TRAVEL FORMATION',
      status: 'MONITORING',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                Convoy Intelligence & Escort Detection
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                TEMPORAL PROXIMITY ALGORITHM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies coordinated vehicular formations traversing multiple arterial junctions within tight time windows (Δt ≤ 45s).
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1 ${
            dataOrigin === 'live' && apiStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            <span>
              {dataOrigin === 'live' && apiStatus === 'connected'
                ? '● DATA ORIGIN: LIVE INGESTION'
                : '▲ DATA ORIGIN: DEMO CONVOY SET'}
            </span>
          </span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
            apiStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            API: {apiStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {convoys.map((convoy) => (
          <div key={convoy.id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-black text-sm text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  {convoy.id}
                </span>
                <span className="text-xs font-bold text-slate-800">{convoy.vehicles}</span>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                {convoy.risk}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex -space-x-2">
                  <img src="/mockup_assets/car_pb10hs3187.jpg" className="w-10 h-8 rounded-lg object-cover border-2 border-white shadow-xs" alt="car1" />
                  <img src="/mockup_assets/car_hr26dk9723.jpg" className="w-10 h-8 rounded-lg object-cover border-2 border-white shadow-xs" alt="car2" />
                </div>
                <div>
                  <div className="flex space-x-2 font-mono font-bold text-xs text-slate-900">
                    <span>{convoy.plates[0]}</span>
                    <span className="text-slate-400">&</span>
                    <span>{convoy.plates[1]}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{convoy.avgDeltaT}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Traversed Corridor</span>
                <p className="text-xs font-semibold text-slate-800 truncate">{convoy.route}</p>
                <span className="text-[10.5px] font-mono text-purple-700 font-bold">
                  {convoy.coOccurrence} Consecutive Junctions Matched
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
