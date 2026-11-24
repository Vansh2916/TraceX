import React, { useState } from 'react';
import {
  Users,
  Car,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  Send,
  Zap,
  Activity,
  Layers,
  Radio,
} from 'lucide-react';

interface ConvoyItem {
  id: string;
  plates: [string, string];
  vehicles: string;
  route: string;
  coOccurrence: number;
  avgDeltaT: string;
  deltaSeconds: number;
  risk: string;
  status: string;
  timestamps: Array<{ junction: string; time1: string; time2: string; dt: string }>;
}

export const ConvoyView: React.FC = () => {
  const [deltaTolerance, setDeltaTolerance] = useState(45);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const initialConvoys: ConvoyItem[] = [
    {
      id: 'CNV_01',
      plates: ['DL 1C AA 9999', 'HR 26 DQ 8888'],
      vehicles: 'White Mahindra Scorpio-N & Black Toyota Fortuner 4x4',
      route: 'CAM_07 (Airport) → CAM_06 (Dhaula Kuan) → CAM_09 (Moti Bagh) → CAM_05 (AIIMS) → CAM_10 (Lajpat Nagar)',
      coOccurrence: 5,
      avgDeltaT: '18s (Tightly synchronized tactical escort formation)',
      deltaSeconds: 18,
      risk: 'CRITICAL - HIGH THREAT VIP / ESCORT FORMATION',
      status: 'ACTIVE PURSUIT DISPATCHED',
      timestamps: [
        { junction: 'CAM_07 (Airport T3)', time1: '17:25:00', time2: '17:25:18', dt: '+18s' },
        { junction: 'CAM_06 (Dhaula Kuan)', time1: '17:29:10', time2: '17:29:28', dt: '+18s' },
        { junction: 'CAM_09 (Moti Bagh)', time1: '17:32:00', time2: '17:32:19', dt: '+19s' },
        { junction: 'CAM_05 (AIIMS)', time1: '17:34:50', time2: '17:35:07', dt: '+17s' },
        { junction: 'CAM_10 (Lajpat Nagar)', time1: '17:37:30', time2: '17:37:48', dt: '+18s' },
      ],
    },
    {
      id: 'CNV_02',
      plates: ['UP 16 BT 4097', 'DL 3C CC 0456'],
      vehicles: 'Red Maruti Swift & Grey Honda City',
      route: 'CAM_08 (Ashram Chowk) → CAM_12 (Sarai Kale Khan RRTS)',
      coOccurrence: 2,
      avgDeltaT: '22s (Trailing tandem commute)',
      deltaSeconds: 22,
      risk: 'MEDIUM - CO-TRAVEL COMMUTE FORMATION',
      status: 'MONITORING',
      timestamps: [
        { junction: 'CAM_08 (Ashram Chowk)', time1: '17:22:10', time2: '17:22:32', dt: '+22s' },
        { junction: 'CAM_12 (Sarai Kale Khan)', time1: '17:29:45', time2: '17:30:08', dt: '+23s' },
      ],
    },
  ];

  const [convoys, setConvoys] = useState<ConvoyItem[]>(initialConvoys);

  const handleSimulateNewConvoy = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setConvoys((prev) => [
        {
          id: `CNV_0${prev.length + 1}`,
          plates: ['HR 51 BZ 4321', 'DL 9C AB 1234'],
          vehicles: 'Black Tata Safari & White Hyundai Verna',
          route: 'CAM_01 (Connaught Place) → CAM_03 (ITO) → CAM_04 (Kashmere Gate)',
          coOccurrence: 3,
          avgDeltaT: '14s (High-speed coordinated transit)',
          deltaSeconds: 14,
          risk: 'HIGH - RAPID ARTERIAL SHADOWING',
          status: 'ALERT FLAGGED',
          timestamps: [
            { junction: 'CAM_01 (CP Radial)', time1: '17:41:00', time2: '17:41:14', dt: '+14s' },
            { junction: 'CAM_03 (ITO Vikas Marg)', time1: '17:44:30', time2: '17:44:45', dt: '+15s' },
            { junction: 'CAM_04 (Kashmere Gate)', time1: '17:48:10', time2: '17:48:23', dt: '+13s' },
          ],
        },
        ...prev,
      ]);
    }, 800);
  };

  const handleDispatchIntercept = (id: string) => {
    setDispatchedId(id);
    setTimeout(() => {
      setDispatchedId(null);
    }, 4000);
  };

  const filteredConvoys = convoys.filter((c) => c.deltaSeconds <= deltaTolerance);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto select-none">
      {/* Top Banner Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Users className="w-5 h-5" />
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
              Identifies coordinated vehicular formations traversing multiple arterial junctions within tight time windows (Δt ≤ {deltaTolerance}s).
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4">
          {/* Threshold Slider */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Window Δt:</span>
            <input
              type="range"
              min="10"
              max="90"
              value={deltaTolerance}
              onChange={(e) => setDeltaTolerance(Number(e.target.value))}
              className="w-24 accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-purple-700 w-8">{deltaTolerance}s</span>
          </div>

          <button
            onClick={handleSimulateNewConvoy}
            disabled={isSimulating}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>{isSimulating ? 'Scanning Corridor...' : 'Simulate Convoy Sighting'}</span>
          </button>
        </div>
      </div>

      {/* Convoy Cards Grid */}
      <div className="space-y-4">
        {filteredConvoys.map((convoy) => (
          <div
            key={convoy.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4 transition hover:border-slate-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-black text-sm text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  {convoy.id}
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{convoy.vehicles}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {convoy.coOccurrence} Consecutive Junctions Correlated
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {convoy.risk}
                </span>
                <button
                  onClick={() => handleDispatchIntercept(convoy.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    dispatchedId === convoy.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-cyan-300'
                  }`}
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>{dispatchedId === convoy.id ? 'PCR En Route (ETA 90s)' : 'Dispatch Intercept'}</span>
                </button>
              </div>
            </div>

            {/* Vehicle Details & Route */}
            <div className="grid grid-cols-12 gap-4">
              {/* Left Plates Card */}
              <div className="col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center space-x-3">
                <div className="flex -space-x-3 shrink-0">
                  <img
                    src="/mockup_assets/car_pb10hs3187.jpg"
                    className="w-12 h-9 rounded-lg object-cover border-2 border-white shadow-xs"
                    alt="car1"
                  />
                  <img
                    src="/mockup_assets/car_hr26dk9723.jpg"
                    className="w-12 h-9 rounded-lg object-cover border-2 border-white shadow-xs"
                    alt="car2"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 font-mono font-bold text-xs text-slate-900">
                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{convoy.plates[0]}</span>
                    <span className="text-purple-600 font-black">+</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{convoy.plates[1]}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block font-medium leading-snug">
                    {convoy.avgDeltaT}
                  </span>
                </div>
              </div>

              {/* Right Route Breadcrumbs */}
              <div className="col-span-8 bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                  Traversed Corridor Pipeline
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-1 leading-relaxed">
                  {convoy.route}
                </p>
                <div className="flex items-center space-x-2 mt-2 text-[10px] text-emerald-600 font-mono font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Graph Correlation: 98.4% Match Probability</span>
                </div>
              </div>
            </div>

            {/* Timestamps Timeline Steps */}
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                Synchronized CCTV Optical Telemetry Log
              </span>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {convoy.timestamps.map((ts, idx) => (
                  <div key={idx} className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                    <span className="font-bold text-white block truncate text-[11px]">{ts.junction.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{ts.time1}</span>
                    <span className="text-[10px] text-cyan-300 font-mono font-bold block">{ts.dt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
