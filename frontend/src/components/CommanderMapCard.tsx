import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera } from '../types';
import { ChevronDown, Crosshair, Plus, Minus } from 'lucide-react';

interface CommanderMapCardProps {
  cameras: Camera[];
  onSelectCamera: (camId: string) => void;
  onOpenLiveFeed: () => void;
  selectedPlate?: string;
}

export const CommanderMapCard: React.FC<CommanderMapCardProps> = ({
  cameras,
  onSelectCamera,
  onOpenLiveFeed,
  selectedPlate = 'DL8CAF2381',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on New Delhi Rajpath / Connaught Place corridor
    const map = L.map(mapContainerRef.current, {
      center: [28.6190, 77.2250],
      zoom: 13.5,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // High-Resolution Aerial Satellite Map (No API Key Required, No Watermark)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        className: 'satellite-night-tiles',
      }
    ).addTo(map);

    // Subtle dark road overlay
    L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.65,
      }
    ).addTo(map);

    // Add camera markers
    const cameraIcon = L.divIcon({
      className: 'custom-camera-marker',
      html: `
        <div class="relative group cursor-pointer">
          <div class="w-7 h-7 rounded-full bg-blue-600 border-2 border-white/90 shadow-md flex items-center justify-center text-white transition-transform hover:scale-125">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="m22 8-6 4 6 4V8Z"/>
              <rect width="14" height="12" x="2" y="6" rx="2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    cameras.forEach((cam) => {
      const marker = L.marker([cam.lat, cam.lon], { icon: cameraIcon }).addTo(map);
      marker.on('click', () => {
        onSelectCamera(cam.id);
      });
      marker.bindTooltip(
        `<div class="text-[11px] font-sans font-bold">${cam.id}: ${cam.name}</div>`,
        { direction: 'top', className: 'custom-tooltip' }
      );
    });

    // Trajectory Route Polyline (Connaught Place -> Barakhamba -> Rajpath -> India Gate)
    const trajectoryCoords: [number, number][] = [
      [28.6328, 77.2197], // CAM_01 CP
      [28.6295, 77.2230], // Barakhamba Rd
      [28.6240, 77.2215], // Janpath
      [28.6180, 77.2180], // Rajpath (Current Vehicle lock)
      [28.6160, 77.2220], // Kartavya Path
      [28.6129, 77.2295], // CAM_02 India Gate
    ];

    // Background glowing line
    L.polyline(trajectoryCoords, {
      color: '#0284c7',
      weight: 6,
      opacity: 0.45,
      lineCap: 'round',
    }).addTo(map);

    // Foreground route line
    L.polyline(trajectoryCoords, {
      color: '#38bdf8',
      weight: 3,
      opacity: 0.95,
      dashArray: '6, 6',
      lineCap: 'round',
    }).addTo(map);

    // Glowing Radar lock for DL8CAF2381 at Rajpath
    const vehicleLockIcon = L.divIcon({
      className: 'target-vehicle-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <!-- Pulsing Radar Rings -->
          <div class="absolute w-14 h-14 rounded-full bg-cyan-400/40 animate-ping"></div>
          <div class="absolute w-10 h-10 rounded-full border border-cyan-400/80 animate-pulse"></div>
          
          <!-- Car Circle -->
          <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-cyan-300 shadow-lg shadow-cyan-500/50 flex items-center justify-center text-white z-10">
            <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C1.4 10.8 1 11.4 1 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>

          <!-- License Plate Callout Tag -->
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950/95 text-cyan-300 border border-cyan-500/80 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold tracking-wider whitespace-nowrap shadow-md pointer-events-none">
            ${selectedPlate}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    L.marker([28.6180, 77.2180], { icon: vehicleLockIcon, zIndexOffset: 1000 }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [cameras, selectedPlate, onSelectCamera]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([28.6190, 77.2250], 13.5);
    }
  };

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-950">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        {/* City Dropdown Pill */}
        <div className="pointer-events-auto flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md text-white text-[11.5px] font-medium px-3 py-1.5 rounded-full border border-slate-700/60 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Delhi, India</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </div>

        {/* Live Feed Pill */}
        <button
          onClick={onOpenLiveFeed}
          className="pointer-events-auto flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md hover:bg-slate-800 text-white text-[11.5px] font-medium px-3 py-1.5 rounded-full border border-slate-700/60 shadow-md transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Feed</span>
        </button>
      </div>

      {/* Floating Left Controls */}
      <div className="absolute top-14 left-3 z-[400] flex flex-col space-y-1.5 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 rounded-lg bg-slate-900/85 backdrop-blur text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow transition text-sm"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 rounded-lg bg-slate-900/85 backdrop-blur text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow transition text-sm"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleRecenter}
          className="w-7 h-7 rounded-lg bg-slate-900/85 backdrop-blur text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow transition text-sm"
          title="Recenter Radar"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>

      {/* Floating Bottom-Left Legend */}
      <div className="absolute bottom-3 left-3 z-[400] pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-2 text-[10.5px] font-medium text-slate-300 flex flex-col space-y-1 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span>Tracked Vehicle</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span>Alert Vehicle</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          <span>Camera</span>
        </div>
      </div>
    </div>
  );
};
