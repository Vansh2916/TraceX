import React from 'react';
import { Camera } from '../../types';
import { Video, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

interface CameraNetworkViewProps {
  cameras: Camera[];
  onOpenFeed?: (camId: string) => void;
}

export const CameraNetworkView: React.FC<CameraNetworkViewProps> = ({ cameras, onOpenFeed }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-4 overflow-y-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                Camera Network Grid & Optical RTSP Sensors
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                12 / 12 CAMERAS ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live optical CCTV video streams across Connaught Place, India Gate, Dhaula Kuan, and Delhi NCR arterial corridors.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenFeed?.('CAM_01')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
        >
          Consecutive Corridors Feed
        </button>
      </div>

      {/* 12 Cameras Grid */}
      <div className="grid grid-cols-4 gap-4 pb-6">
        {cameras.map((cam, idx) => (
          <div
            key={cam.id}
            onClick={() => onOpenFeed?.(cam.id)}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
          >
            {/* Camera Video / Photo Stream Box */}
            <div className="relative w-full h-[120px] rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
              <img
                src={
                  idx % 3 === 0
                    ? '/mockup_assets/cam01_thumb.jpg'
                    : idx % 3 === 1
                    ? '/mockup_assets/cam07_thumb.jpg'
                    : '/mockup_assets/cam12_thumb.jpg'
                }
                alt={cam.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[9.5px] font-mono text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE 1080p</span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[9.5px] font-mono text-slate-300">
                24 FPS
              </div>
            </div>

            {/* Info */}
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700 text-xs">{cam.id}</span>
                <span className="text-[10px] text-slate-500 font-mono">Limit: {cam.speed_limit} km/h</span>
              </div>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{cam.name}</p>
              <p className="text-[10.5px] text-slate-400 truncate">{cam.landmark} • {cam.zone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
