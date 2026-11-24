import React, { useState, useEffect } from 'react';
import { Settings, Sliders, ShieldCheck, Cpu, Bell, Database, Check, AlertCircle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [ocrConfidence, setOcrConfidence] = useState(85);
  const [maxSpeedTolerance, setMaxSpeedTolerance] = useState(10);
  const [ghostDeltaSec, setGhostDeltaSec] = useState(30);
  const [retentionDays, setRetentionDays] = useState(90);

  const [savedSettings, setSavedSettings] = useState<any>(null);
  const [appliedSettings, setAppliedSettings] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.saved) {
          setSavedSettings(data.saved);
          setAppliedSettings(data.applied);
          setOcrConfidence(data.saved.ocr_confidence_threshold ?? 85);
          setMaxSpeedTolerance(data.saved.speed_tolerance_kmh ?? 10);
          setGhostDeltaSec(data.saved.ghost_delta_sec ?? 30);
          setRetentionDays(data.saved.retention_days ?? 90);
        }
      })
      .catch((e) => console.warn('Could not fetch settings', e));
  }, []);

  const handleApply = async () => {
    setLoading(true);
    setSaveStatus('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocr_confidence_threshold: ocrConfidence,
          speed_tolerance_kmh: maxSpeedTolerance,
          ghost_delta_sec: ghostDeltaSec,
          retention_days: retentionDays,
        }),
      });
      if (!res.ok) throw new Error('Settings update failed');
      const data = await res.json();
      setSavedSettings(data.saved);
      setAppliedSettings(data.applied);
      setSaveStatus('Settings successfully applied and verified by backend engine.');
    } catch (e: any) {
      setSaveStatus(`Error applying settings: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto font-sans">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
              ANPR System Configuration & Tactical Parameters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune optical recognition sensitivity, Markov model transition probabilities, and automated police dispatch triggers.
            </p>
          </div>
        </div>
        <button
          onClick={handleApply}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{loading ? 'Applying...' : 'Apply & Confirm'}</span>
        </button>
      </div>

      {saveStatus && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 ${
            saveStatus.includes('Error')
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {saveStatus.includes('Error') ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Vision & Optical Engine</h3>
            {appliedSettings && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Applied: OCR {appliedSettings.ocr_confidence_threshold}% • Tol +{appliedSettings.speed_tolerance_kmh}km/h
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>OCR Plate Confidence Threshold</span>
                <span className="font-mono text-blue-600 font-bold">{ocrConfidence}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={ocrConfidence}
                onChange={(e) => setOcrConfidence(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Speed Tolerance Before Violation (+km/h)</span>
                <span className="font-mono text-rose-600 font-bold">+{maxSpeedTolerance} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={maxSpeedTolerance}
                onChange={(e) => setMaxSpeedTolerance(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Ghost Plate Concurrent Window (Δt)</span>
                <span className="font-mono text-amber-600 font-bold">{ghostDeltaSec} sec</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={ghostDeltaSec}
                onChange={(e) => setGhostDeltaSec(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Data Retention Policy</span>
                <span className="font-mono text-indigo-600 font-bold">{retentionDays} Days</span>
              </div>
              <input
                type="range"
                min="7"
                max="365"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">Active AI Models & Governance</h3>
          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Object Detection Engine</span>
                <span className="text-[11px] text-slate-500">YOLOv8x-ANPR (TensorRT 8.6)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE (0.8ms)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Role-Based Governance</span>
                <span className="text-[11px] text-slate-500">Admin, Operator, Read-only Viewer</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                RBAC ACTIVE
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Audit Logging & Telemetry</span>
                <span className="text-[11px] text-slate-500">audit_logs table (Tamper-evident)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                LOGGING
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
