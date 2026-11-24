import React, { useState } from 'react';
import { Scale, CheckCircle2, XCircle, Search, ShieldAlert, Clock, MapPin, Server, AlertTriangle } from 'lucide-react';
import { ConnectionStatus, DataOrigin } from '../../types';

interface AlibiViewProps {
  apiStatus?: ConnectionStatus;
  wsStatus?: ConnectionStatus;
  dataOrigin?: DataOrigin;
}

export const AlibiView: React.FC<AlibiViewProps> = ({
  apiStatus = 'connected',
  wsStatus = 'connected',
  dataOrigin = 'mock',
}) => {
  const [suspectPlate, setSuspectPlate] = useState('DL 8C AF 2381');
  const [claimedLocation, setClaimedLocation] = useState('Noida Sector 62');
  const [claimedTime, setClaimedTime] = useState('17:40');
  const [verified, setVerified] = useState<boolean | null>(true);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                Alibi Verification & Teleportation Defense Engine
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                DIJKSTRA PHYSICAL LIMITS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify suspect alibis against real camera telemetry and minimum graph road transit times.
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
                ? '● DATA ORIGIN: LIVE FORENSICS'
                : '▲ DATA ORIGIN: DEMO ROAD GRAPH'}
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

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Verify Suspect Statement</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Suspect Plate</label>
              <input
                type="text"
                value={suspectPlate}
                onChange={(e) => setSuspectPlate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Claimed Location</label>
              <input
                type="text"
                value={claimedLocation}
                onChange={(e) => setClaimedLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Claimed Timestamp</label>
              <input
                type="text"
                value={claimedTime}
                onChange={(e) => setClaimedTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setVerified(false)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
          >
            Compute Dijkstra Physical Feasibility
          </button>
        </div>

        <div className="col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Verification Result</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                ALIBI DISPROVED / IMPOSSIBLE
              </span>
            </div>

            <div className="my-4 space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Physical Contradiction Confirmed</span>
                </div>
                <p className="text-[11.5px] text-rose-700 mt-1">
                  Vehicle <b>{suspectPlate}</b> was captured on camera <b>CAM_07 Rajpath Rd</b> at <b>17:42:15</b>.
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Transit between Noida Sector 62 and Rajpath requires minimum 1,620s (27 min) via Akshardham corridor. Sighting occurred only 2 min 15s after claimed alibi.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Min Transit</span>
                  <span className="text-xs font-black text-slate-800 font-mono">27 min</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Reported Delta</span>
                  <span className="text-xs font-black text-rose-600 font-mono">2m 15s</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Confidence</span>
                  <span className="text-xs font-black text-emerald-600 font-mono">99.8%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <span>Dijkstra Spatio-Temporal Proof auto-generated</span>
            <span className="font-semibold text-blue-600 cursor-pointer hover:underline">Download Court-Admissible PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
