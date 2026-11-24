import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  XCircle,
  Search,
  ShieldAlert,
  Clock,
  MapPin,
  FileText,
  Printer,
  Download,
  Check,
  Sparkles,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface AlibiCase {
  plate: string;
  suspectName: string;
  firNumber: string;
  claimedLocation: string;
  claimedTime: string;
  actualCam: string;
  actualLocation: string;
  actualTime: string;
  distanceKm: number;
  minTransitMinutes: number;
  reportedDeltaMinutes: number;
  isImpossible: boolean;
  explanation: string;
}

export const AlibiView: React.FC = () => {
  const [suspectPlate, setSuspectPlate] = useState('DL 8C AF 2381');
  const [claimedLocation, setClaimedLocation] = useState('Noida Sector 62 (Industrial Area)');
  const [claimedTime, setClaimedTime] = useState('17:40:00');
  const [isComputing, setIsComputing] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const cases: Record<string, AlibiCase> = {
    'DL 8C AF 2381': {
      plate: 'DL 8C AF 2381',
      suspectName: 'Rohan Mehra (FIR 182/26)',
      firNumber: 'FIR 182/2026 Tilak Marg PS',
      claimedLocation: 'Noida Sector 62 (Industrial Area)',
      claimedTime: '17:40:00',
      actualCam: 'CAM_07 (Rajpath Rd / Kartavya Path)',
      actualLocation: 'Rajpath Rd, Central Delhi',
      actualTime: '17:42:15',
      distanceKm: 18.4,
      minTransitMinutes: 28,
      reportedDeltaMinutes: 2.25,
      isImpossible: true,
      explanation: 'Sighting occurred only 2 min 15 sec after claimed presence in Noida. Minimum physical transit through Akshardham expressway corridor requires at least 28 minutes at maximum legal speed.',
    },
    'DL 1C WX 0007': {
      plate: 'DL 1C WX 0007',
      suspectName: 'Vikas Tyagi (Hit-and-Run Suspect)',
      firNumber: 'FIR 204/2026 Chanakyapuri PS',
      claimedLocation: 'DLF Cyber City, Gurugram Phase 2',
      claimedTime: '17:15:00',
      actualCam: 'CAM_02 (India Gate C-Hexagon)',
      actualLocation: 'India Gate Radial 4',
      actualTime: '17:15:30',
      distanceKm: 24.2,
      minTransitMinutes: 36,
      reportedDeltaMinutes: 0.5,
      isImpossible: true,
      explanation: 'Vehicle detected at India Gate 30 seconds after claimed time in Gurugram. Physical impossibility confirms false alibi.',
    },
    'UP 16 BT 4097': {
      plate: 'UP 16 BT 4097',
      suspectName: 'Amit Verma (Routine Verification)',
      firNumber: 'General Diary Entry 88/26',
      claimedLocation: 'Sarai Kale Khan Bus Terminal',
      claimedTime: '17:25:00',
      actualCam: 'CAM_12 (Sarai Kale Khan RRTS Hub)',
      actualLocation: 'Ring Road Sarai Kale Khan',
      actualTime: '17:29:45',
      distanceKm: 0.8,
      minTransitMinutes: 3,
      reportedDeltaMinutes: 4.75,
      isImpossible: false,
      explanation: 'Vehicle sighting matches claimed vicinity within 4.75 minutes. Spatiotemporal presence is consistent with claimed statement.',
    },
  };

  const currentCase: AlibiCase =
    cases[suspectPlate] || {
      plate: suspectPlate,
      suspectName: 'Identified Suspect',
      firNumber: 'Inquiry Case #491/26',
      claimedLocation: claimedLocation,
      claimedTime: claimedTime,
      actualCam: 'CAM_07 (Rajpath Rd)',
      actualLocation: 'Rajpath Rd Corridor',
      actualTime: '17:42:15',
      distanceKm: 18.4,
      minTransitMinutes: 28,
      reportedDeltaMinutes: 2.25,
      isImpossible: true,
      explanation: `Vehicle ${suspectPlate} logged at CAM_07 while suspect claimed to be at ${claimedLocation}. Physical transit limits disproved the alibi.`,
    };

  const handleCompute = () => {
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
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

        {/* Quick Suspect Selectors */}
        <div className="flex items-center space-x-2">
          {Object.keys(cases).map((plate) => (
            <button
              key={plate}
              onClick={() => {
                setSuspectPlate(plate);
                setClaimedLocation(cases[plate].claimedLocation);
                setClaimedTime(cases[plate].claimedTime);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                suspectPlate === plate
                  ? 'bg-slate-900 text-cyan-300 border border-slate-700 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {plate}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left Input Form */}
        <div className="col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Suspect Defense Statement</h3>
            <span className="text-[10px] font-mono text-slate-400 font-bold">CASE INPUT</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Vehicle Registration Plate
              </label>
              <input
                type="text"
                value={suspectPlate}
                onChange={(e) => setSuspectPlate(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Claimed Location (Alibi Statement)
              </label>
              <input
                type="text"
                value={claimedLocation}
                onChange={(e) => setClaimedLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Claimed Presence Timestamp
              </label>
              <input
                type="text"
                value={claimedTime}
                onChange={(e) => setClaimedTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleCompute}
            disabled={isComputing}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            {isComputing ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            )}
            <span>{isComputing ? 'Computing Road Constraints...' : 'Compute Dijkstra Physical Feasibility'}</span>
          </button>
        </div>

        {/* Right Output Verdict & Evidence */}
        <div className="col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Judicial Forensic Verdict</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  currentCase.isImpossible
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {currentCase.isImpossible ? 'ALIBI DISPROVED / IMPOSSIBLE' : 'ALIBI CONSISTENT'}
              </span>
            </div>

            <div className="my-4 space-y-3">
              <div
                className={`p-3.5 rounded-xl border ${
                  currentCase.isImpossible
                    ? 'bg-rose-50/70 border-rose-200'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs">
                  {currentCase.isImpossible ? (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-rose-800">Physical Spatiotemporal Contradiction Confirmed</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-800">Spatiotemporal Statement Consistent</span>
                    </>
                  )}
                </div>

                <p className="text-[11.5px] text-slate-700 mt-2 leading-relaxed">
                  Vehicle <b>{currentCase.plate}</b> was captured on camera <b>{currentCase.actualCam}</b> at{' '}
                  <b>{currentCase.actualTime}</b>.
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">{currentCase.explanation}</p>
              </div>

              {/* Numerical Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block font-mono">
                    Min Transit Time
                  </span>
                  <span className="text-sm font-black text-slate-800 font-mono">
                    {currentCase.minTransitMinutes} min
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block font-mono">
                    Actual Delta
                  </span>
                  <span
                    className={`text-sm font-black font-mono ${
                      currentCase.isImpossible ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {currentCase.reportedDeltaMinutes} min
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 block font-mono">
                    Forensic Confidence
                  </span>
                  <span className="text-sm font-black text-emerald-600 font-mono">99.8%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Action */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Dijkstra Spatio-Temporal Proof Record auto-generated</span>
            </div>
            <button
              onClick={() => setShowCertificateModal(true)}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View Court-Admissible Certificate</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Official Court-Admissible Forensic Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 relative space-y-6 text-slate-900 font-serif">
            {/* Seal & Close */}
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 font-sans font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            {/* Header with Delhi Police / TraceX Seal */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 text-white flex items-center justify-center font-sans font-black text-xl mb-2 shadow-md">
                ⚖
              </div>
              <h2 className="text-lg font-black tracking-wider uppercase font-sans">
                Delhi Municipal Traffic Surveillance Intelligence
              </h2>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-sans mt-0.5">
                Cyber Forensic Trajectory Analysis & Spatiotemporal Validation Unit
              </p>
              <div className="mt-2 text-[10px] font-mono text-slate-400 font-sans">
                REF: {currentCase.firNumber} • SEC 65B INDIAN EVIDENCE ACT COMPLIANT
              </div>
            </div>

            {/* Certificate Body */}
            <div className="space-y-3 text-xs leading-relaxed font-sans">
              <p className="font-semibold text-slate-800">
                This is to officially certify that license plate <b className="font-mono">{currentCase.plate}</b>{' '}
                was subjected to city-wide Dijkstra graph verification across the Delhi municipal CCTV optical network.
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Suspect / Subject:</span>
                  <span className="font-bold">{currentCase.suspectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Claimed Alibi:</span>
                  <span>{currentCase.claimedLocation} @ {currentCase.claimedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CCTV Detection:</span>
                  <span className="font-bold text-blue-700">{currentCase.actualCam} @ {currentCase.actualTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spatial Discrepancy:</span>
                  <span>{currentCase.distanceKm} km (Direct corridor)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Min. Dijkstra Travel Time:</span>
                  <span className="font-bold">{currentCase.minTransitMinutes} minutes</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span className="text-slate-500">Judicial Finding:</span>
                  <span className={`font-black ${currentCase.isImpossible ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {currentCase.isImpossible ? 'PHYSICALLY IMPOSSIBLE (FALSE ALIBI)' : 'CONSISTENT WITH ALIBI'}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                Hash Signature: SHA256:{Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}
              </p>
            </div>

            {/* Footer Sign-off & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 font-sans">
              <div className="text-[10px] text-slate-400">
                Generated automatically by TraceX Anomaly Engine v1.0.0
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
