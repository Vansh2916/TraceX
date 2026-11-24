import React, { useState } from 'react';
import { AlibiResult } from '../types';
import { Scale, CheckCircle2, XCircle, HelpCircle, MapPin, Clock, Gauge, ArrowRight } from 'lucide-react';

interface AlibiPanelProps {
  onFocusCoordinate: (coords: [number, number]) => void;
}

export const AlibiPanel: React.FC<AlibiPanelProps> = ({ onFocusCoordinate }) => {
  const [plate, setPlate] = useState('DL 1C WX 0007');
  const [claimedLat, setClaimedLat] = useState('28.5355'); // e.g. Saket / South Delhi
  const [claimedLon, setClaimedLon] = useState('77.2180');
  const [landmarkLabel, setLandmarkLabel] = useState('Select a preset or enter coordinates');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AlibiResult | null>(null);

  const presets = [
    { label: 'Saket District Centre', lat: 28.5284, lon: 77.2185 },
    { label: 'Noida Sector 18 Hub', lat: 28.5695, lon: 77.3235 },
    { label: 'Cyber City Gurgaon', lat: 28.4950, lon: 77.0890 },
    { label: 'Rohini Sector 10', lat: 28.7180, lon: 77.1120 },
    { label: 'Connaught Place (CP)', lat: 28.6328, lon: 77.2197 },
    { label: 'AIIMS Medical Corridor', lat: 28.5672, lon: 77.2100 }
  ];

  const handlePresetSelect = (preset: { label: string; lat: number; lon: number }) => {
    setClaimedLat(preset.lat.toString());
    setClaimedLon(preset.lon.toString());
    setLandmarkLabel(preset.label);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!plate.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/alibi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: plate.trim().toUpperCase(),
          claimed_lat: parseFloat(claimedLat),
          claimed_lon: parseFloat(claimedLon)
        })
      });
      const data: AlibiResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Alibi check error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-200">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scale className="w-4 h-4 text-sky-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
            Trajectory Alibi Verification Engine
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
          Haversine Discrepancy
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Verification Form */}
        <form onSubmit={handleVerify} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 space-y-3 shadow-md">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Target Vehicle License Plate
            </label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="e.g. DL 1C WX 0007"
              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold tracking-wider focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Claimed Location Presets
              </label>
              <span className="text-[10px] text-sky-400 font-mono">{landmarkLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => handlePresetSelect(p)}
                  className="px-2 py-1 text-left rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-white transition truncate"
                >
                  📍 {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={claimedLat}
                onChange={(e) => setClaimedLat(e.target.value)}
                className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={claimedLon}
                onChange={(e) => setClaimedLon(e.target.value)}
                className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 font-mono font-bold text-xs uppercase tracking-wider text-white transition flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-50"
          >
            <span>Cross-Examine Telemetry & Verify Alibi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Verification Result */}
        {result && (
          <div className={`p-4 rounded-lg border shadow-xl space-y-3 font-sans ${
            result.status === 'BROKEN'
              ? 'bg-red-950/20 border-red-800 text-red-100'
              : result.status === 'CONFIRMED'
              ? 'bg-emerald-950/20 border-emerald-800 text-emerald-100'
              : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}>
            {/* Verdict Banner */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                {result.status === 'BROKEN' ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : result.status === 'CONFIRMED' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <HelpCircle className="w-6 h-6 text-slate-400" />
                )}
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                    Judicial ANPR Alibi Verdict
                  </div>
                  <div className={`text-base font-black font-mono tracking-widest ${
                    result.status === 'BROKEN' ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {result.status}
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[10px] opacity-75">Discrepancy</div>
                <div className="text-sm font-bold">{result.discrepancy_km} km</div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-black/30 border border-white/5 space-y-0.5">
                <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                  <MapPin className="w-3 h-3" />
                  <span>CLAIMED COORDS</span>
                </div>
                <div className="text-white text-[11px]">
                  [{result.claimed_coords[0].toFixed(4)}, {result.claimed_coords[1].toFixed(4)}]
                </div>
              </div>

              <div className="p-2 rounded bg-black/30 border border-white/5 space-y-0.5">
                <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>CLOSEST RECORD SIGHTING</span>
                </div>
                <div className="text-white text-[11px] truncate">
                  {result.closest_sighting?.camera_name || 'N/A'}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="text-xs leading-relaxed p-2.5 rounded bg-black/40 border border-white/10 text-slate-300">
              {result.explanation}
            </div>

            {result.closest_sighting && (
              <button
                onClick={() => {
                  onFocusCoordinate(result.claimed_coords);
                }}
                className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-[11px] flex items-center justify-center space-x-1 transition border border-slate-700"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Locate Claimed Position on Leaflet Grid</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
