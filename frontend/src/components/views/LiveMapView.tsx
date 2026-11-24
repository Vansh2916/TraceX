import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera } from '../../types';
import { MapPin, Video, Search, ChevronDown, Crosshair, Plus, Minus, Layers, Radio } from 'lucide-react';

interface LiveMapViewProps {
  cameras: Camera[];
  onOpenFeed?: (camId: string) => void;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({ cameras, onOpenFeed }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [28.6190, 77.2250],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Esri Aerial Satellite
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        className: 'satellite-night-tiles',
      }
    ).addTo(map);

    // Reference roads
    L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.65,
      }
    ).addTo(map);

    // Add 12 camera markers
    const cameraIcon = L.divIcon({
      className: 'custom-camera-marker',
      html: `
        <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-125 transition-transform">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="m22 8-6 4 6 4V8Z"/>
            <rect width="14" height="12" x="2" y="6" rx="2"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    cameras.forEach((cam) => {
      const marker = L.marker([cam.lat, cam.lon], { icon: cameraIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedCam(cam.id);
        if (onOpenFeed) onOpenFeed(cam.id);
      });
      marker.bindTooltip(
        `<div class="text-xs font-bold font-sans">${cam.id}: ${cam.name}</div><div class="text-[10px] text-emerald-400 font-mono">● LIVE 1080p • Speed: ${cam.speed_limit} km/h</div>`,
        { direction: 'top', className: 'custom-tooltip' }
      );
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [cameras]);

  const handleFocusCamera = (cam: Camera) => {
    setSelectedCam(cam.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cam.lat, cam.lon], 15, { animate: true });
    }
  };

  const filteredCameras = cameras.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex-1 flex h-full bg-[#f4f7fb] p-6 space-y-4 overflow-hidden relative">
      {/* Left Expanded Map Canvas */}
      <div className="flex-1 h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs relative">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Top Controls Overlay */}
        <div className="absolute top-4 left-4 z-[400] flex items-center space-x-2">
          <div className="bg-slate-900/90 backdrop-blur text-white text-xs px-3.5 py-1.5 rounded-full border border-slate-700/60 font-semibold flex items-center space-x-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Delhi NCR Live Surveillance Grid (12 / 12 Active)</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-16 left-4 z-[400] flex flex-col space-y-1.5">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-xl bg-slate-900/90 backdrop-blur text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow transition text-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-xl bg-slate-900/90 backdrop-blur text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow transition text-sm"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.setView([28.6190, 77.2250], 13)}
            className="w-8 h-8 rounded-xl bg-slate-900/90 backdrop-blur text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow transition text-sm"
          >
            <Crosshair className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Right Camera Directory Panel */}
      <div className="w-[320px] shrink-0 ml-4 h-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Camera Directory</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              12 ONLINE
            </span>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Filter cameras..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-slate-700 placeholder-slate-400 text-xs"
            />
          </div>

          {/* Camera List */}
          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
            {filteredCameras.map((cam) => (
              <div
                key={cam.id}
                onClick={() => handleFocusCamera(cam)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                  selectedCam === cam.id
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/60 hover:bg-slate-100 border-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-blue-700">{cam.id}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">● 1080p</span>
                  </div>
                  <p className="text-[11.5px] font-semibold text-slate-800 truncate max-w-[190px] mt-0.5">
                    {cam.name}
                  </p>
                  <span className="text-[10px] text-slate-400">{cam.zone}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenFeed) onOpenFeed(cam.id);
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white transition text-[10px] font-bold"
                >
                  Live
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => onOpenFeed?.('CAM_01')}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
        >
          Open Multi-Camera Stream
        </button>
      </div>
    </div>
  );
};
