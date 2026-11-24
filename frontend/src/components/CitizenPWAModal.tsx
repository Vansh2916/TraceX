import React, { useState, useRef } from 'react';
import {
  Smartphone,
  X,
  ShieldAlert,
  Send,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface CitizenPWAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: (plate: string) => void;
}

export const CitizenPWAModal: React.FC<CitizenPWAModalProps> = ({
  isOpen,
  onClose,
  onReportSubmitted,
}) => {
  const [plate, setPlate] = useState('DL 1C TS 9901');
  const [color, setColor] = useState('Dark Grey');
  const [vehicleModel, setVehicleModel] = useState('Toyota Fortuner');
  const [reason, setReason] = useState('Hit-and-Run collision witnessed at Ring Road crossing');
  const [severity, setSeverity] = useState('CRITICAL');
  const [location, setLocation] = useState('Near Moti Bagh Flyover heading towards Dhaula Kuan');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));
      setAnalyzingPhoto(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/vision/analyze', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.analysis) {
          if (data.analysis.plate) setPlate(data.analysis.plate);
          if (data.analysis.color) setColor(data.analysis.color);
          if (data.analysis.make_model) setVehicleModel(data.analysis.make_model);
        }
      } catch (err) {
        console.error('Vision analysis error', err);
      } finally {
        setAnalyzingPhoto(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: plate.trim().toUpperCase(),
          reason: `${reason} [Vehicle: ${color} ${vehicleModel}] (${location})`,
          severity: severity,
          description: `Citizen emergency incident reported via Delhi SafeCity PWA mobile portal at ${new Date().toLocaleTimeString()}`,
        }),
      });
      const data = await res.json();
      setSuccessMsg(data.message || `Plate ${plate} enrolled into live surveillance watchlist.`);
      onReportSubmitted(plate.trim().toUpperCase());
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2200);
    } catch (err) {
      console.error('Citizen report failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Mobile Frame Container */}
      <div className="relative w-full max-w-sm bg-white rounded-[36px] p-2.5 border-4 border-slate-300 shadow-2xl flex flex-col overflow-hidden max-h-[92vh] font-sans">
        {/* Notch */}
        <div className="w-24 h-4 bg-slate-200 rounded-full mx-auto mb-2 flex items-center justify-center">
          <div className="w-8 h-1 bg-slate-400 rounded-full" />
        </div>

        {/* PWA App Content */}
        <div className="flex-1 bg-white rounded-[26px] overflow-hidden flex flex-col border border-slate-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wide">DELHI CITIZEN SOS</h4>
                <p className="text-[10px] text-rose-100 font-medium">Live Watchlist Uplink</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs text-slate-700">
            {successMsg ? (
              <div className="py-12 text-center space-y-3 animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900">INCIDENT DISPATCHED</h4>
                <p className="text-xs text-slate-600 font-mono px-4">{successMsg}</p>
                <span className="text-[10.5px] text-emerald-600 font-medium block">
                  Enrolled directly into Delhi Traffic Police live command grid.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    Upload photo to auto-fill car color, plate & make via AI vision, or enter manually.
                  </span>
                </div>

                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="p-3 border border-dashed border-slate-300 hover:border-rose-400 rounded-xl text-center bg-slate-50 space-y-1 cursor-pointer transition"
                >
                  {photoPreview ? (
                    <div className="space-y-1">
                      <img src={photoPreview} alt="Evidence" className="h-20 mx-auto rounded-lg object-contain" />
                      <div className="text-[10px] text-emerald-600 font-medium flex items-center justify-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{analyzingPhoto ? 'Analyzing Car Paint & Plate...' : 'AI Extraction Complete'}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mx-auto text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-700 block">Capture or Upload Car Photo</span>
                      <span className="text-[9.5px] text-slate-400 block">Auto-detects plate, color and model</span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                      Plate Number
                    </label>
                    <input
                      type="text"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      placeholder="e.g. DL 1C TS 9901"
                      required
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                      Paint Color
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Dark Grey"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    Identified Model
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Toyota Fortuner (SUV)"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="CRITICAL">CRITICAL (Hit-and-Run / Flight)</option>
                    <option value="HIGH">HIGH (Stolen / Reckless)</option>
                    <option value="MEDIUM">MEDIUM (Suspicious Patrol)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                    Location & Heading
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Report to Police Grid</span>
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-around text-[10px] text-slate-500">
            <span className="text-rose-600 font-bold">● SOS Portal</span>
            <span>Helpline: 112</span>
            <span>Delhi Police</span>
          </div>
        </div>
      </div>
    </div>
  );
};
