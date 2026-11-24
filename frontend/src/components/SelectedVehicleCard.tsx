import React from 'react';
import {
  ShieldCheck,
  Clock,
  MapPin,
  Car,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface SelectedVehicleCardProps {
  plate?: string;
  confidence?: number;
  timeStr?: string;
  location?: string;
  vehicleModel?: string;
  onViewDetails?: () => void;
  onViewAllAlerts?: () => void;
}

export const SelectedVehicleCard: React.FC<SelectedVehicleCardProps> = ({
  plate = 'DL8CAF2381',
  confidence = 98.7,
  timeStr = '17:42:15 • 21 Nov 2026',
  location = 'Rajpath Rd, New Delhi',
  vehicleModel = 'Toyota Corolla • White',
  onViewDetails,
  onViewAllAlerts,
}) => {
  return (
    <div className="w-full h-[400px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h3 className="text-[13px] font-bold text-slate-800">
            Selected Vehicle
          </h3>
        </div>
        <button
          onClick={onViewDetails}
          className="text-[11.5px] font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-0.5 group"
        >
          <span>View Details</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Vehicle Rear Photo with Plate Bounding Box */}
      <div className="relative w-full h-[145px] rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 group">
        <img
          src="/mockup_assets/selected_vehicle_corolla.jpg"
          alt="Toyota Corolla Rear"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/sample_city_silver.jpg';
          }}
        />
        {/* Optical Plate Detection Bounding Box */}
        <div className="absolute top-[58%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-16 h-5 border-2 border-cyan-400 rounded-xs shadow-sm shadow-cyan-400/50 pointer-events-none" />
      </div>

      {/* License Plate Banner */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5">
        <div className="flex items-center space-x-2">
          {/* IND Blue Strip */}
          <div className="bg-blue-700 text-white text-[8px] font-black px-1 py-0.5 rounded-xs flex flex-col items-center justify-center leading-none">
            <span>🇮🇳</span>
            <span>IND</span>
          </div>
          {/* Plate Number */}
          <span className="font-mono text-[15px] font-black tracking-wider text-slate-900">
            {plate}
          </span>
        </div>
        {/* Confidence Badge */}
        <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2 py-0.5 rounded-md text-[11px] font-bold">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{confidence}%</span>
        </div>
      </div>

      {/* Telemetry Row */}
      <div className="space-y-1 text-[11.5px] text-slate-600">
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{timeStr}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-800">{location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{vehicleModel}</span>
        </div>
      </div>

      {/* Priority Alert Box */}
      <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                Priority Alert
              </span>
            </div>
            <p className="text-[11.5px] font-bold text-rose-800 leading-tight">
              Ghost Plate Detected
            </p>
            <p className="text-[10px] text-rose-600/80 font-mono">
              CAM_03 • 17:41:52
            </p>
          </div>
        </div>

        <button
          onClick={onViewAllAlerts}
          className="text-[10.5px] font-bold text-rose-700 hover:text-rose-900 flex items-center space-x-0.5 shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
