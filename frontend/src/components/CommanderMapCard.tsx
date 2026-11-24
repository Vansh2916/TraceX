import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera } from '../types';
import { ChevronDown, Crosshair, Plus, Minus, Video, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

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
  const layersRef = useRef<{
    camerasLayer: L.LayerGroup;
    trajectoryLayer: L.LayerGroup;
    vehicleLockLayer: L.LayerGroup;
  } | null>(null);

  const [activeZone, setActiveZone] = useState('ALL');

  // 1. Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.6210, 77.2240],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // High-Resolution CartoDB Dark Matter / Satellite
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map);

    // Subtle dark boundary overlay
    L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.35,
      }
    ).addTo(map);

    // Initialize dedicated layer groups
    const camerasLayer = L.layerGroup().addTo(map);
    const trajectoryLayer = L.layerGroup().addTo(map);
    const vehicleLockLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      camerasLayer,
      trajectoryLayer,
      vehicleLockLayer,
    };

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersRef.current = null;
    };
  }, []);

  // 2. Update Camera Markers without destroying map
  useEffect(() => {
    if (!layersRef.current) return;
    const { camerasLayer } = layersRef.current;
    camerasLayer.clearLayers();

    const cameraIcon = L.divIcon({
      className: 'custom-camera-marker',
      html: `
        <div class="relative group cursor-pointer">
          <div class="w-7 h-7 rounded-full bg-blue-600/90 border-2 border-blue-300 shadow-lg shadow-blue-500/40 flex items-center justify-center text-white transition-all duration-200 group-hover:scale-125 group-hover:bg-blue-500">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="m22 8-6 4 6 4V8Z"/>
              <rect width="14" height="12" x="2" y="6" rx="2"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-pulse"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    cameras.forEach((cam) => {
      const marker = L.marker([cam.lat, cam.lon], { icon: cameraIcon });
      marker.on('click', () => {
        onSelectCamera(cam.id);
      });
      marker.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="text-[11px] font-bold text-white flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ${cam.id}: ${cam.name}
          </div>
          <div class="text-[9.5px] text-slate-300 font-mono mt-0.5">${cam.landmark || 'Delhi Corridor'}</div>
          <div class="text-[9px] text-cyan-400 font-mono mt-0.5">Speed Limit: ${cam.speed_limit} km/h • ACTIVE</div>
        </div>`,
        { direction: 'top', className: 'tactical-map-tooltip' }
      );
      marker.addTo(camerasLayer);
    });
  }, [cameras, onSelectCamera]);

  // 3. Update Trajectory Route & Vehicle Radar Lock
  useEffect(() => {
    if (!layersRef.current) return;
    const { trajectoryLayer, vehicleLockLayer } = layersRef.current;
    trajectoryLayer.clearLayers();
    vehicleLockLayer.clearLayers();

    // Connaught Place -> Barakhamba -> Janpath -> Rajpath -> India Gate
    const trajectoryCoords: [number, number][] = [
      [28.6328, 77.2197], // CAM_01 CP
      [28.6295, 77.2230], // Barakhamba Rd
      [28.6240, 77.2215], // Janpath
      [28.6180, 77.2180], // Rajpath (Current Vehicle lock)
      [28.6160, 77.2220], // Kartavya Path
      [28.6129, 77.2295], // CAM_02 India Gate
    ];

    // Background glowing pulse line
    L.polyline(trajectoryCoords, {
      color: '#0284c7',
      weight: 6,
      opacity: 0.35,
      lineCap: 'round',
    }).addTo(trajectoryLayer);

    // Foreground tactical neon route line
    L.polyline(trajectoryCoords, {
      color: '#38bdf8',
      weight: 3,
      opacity: 0.9,
      dashArray: '6, 6',
      lineCap: 'round',
    }).addTo(trajectoryLayer);

    // Glowing Radar lock for selectedPlate
    const vehicleLockIcon = L.divIcon({
      className: 'target-vehicle-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <!-- Pulsing Radar Waves -->
          <div class="absolute w-14 h-14 rounded-full bg-cyan-400/25 animate-ping"></div>
          <div class="absolute w-9 h-9 rounded-full border border-cyan-400/60 animate-pulse"></div>
          
          <!-- Car Marker Circle -->
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-cyan-500 border-2 border-cyan-200 shadow-xl shadow-cyan-500/50 flex items-center justify-center text-white z-10">
            <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C1.4 10.8 1 11.4 1 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>

          <!-- License Plate Callout HUD Tag -->
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950/95 text-cyan-300 border border-cyan-500/80 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold tracking-wider whitespace-nowrap shadow-xl pointer-events-none flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            ${selectedPlate}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    L.marker([28.6180, 77.2180], { icon: vehicleLockIcon, zIndexOffset: 1000 }).addTo(vehicleLockLayer);
  }, [selectedPlate]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([28.6210, 77.2240], 13);
    }
  };

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-950">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        {/* City Dropdown Pill */}
        <div className="pointer-events-auto flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md text-white text-[11.5px] font-medium px-3 py-1.5 rounded-full border border-slate-700/70 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wide">Delhi NCR Radar</span>
          <span className="text-[10px] text-slate-400 font-mono">({cameras.length || 12} nodes)</span>
        </div>

        {/* Live Feed Pill */}
        <button
          onClick={onOpenLiveFeed}
          className="pointer-events-auto flex items-center space-x-1.5 bg-blue-600/90 hover:bg-blue-500 text-white text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full border border-blue-400/50 shadow-lg transition-all cursor-pointer active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span>Live 2-Cam Feed</span>
        </button>
      </div>

      {/* Floating Left Controls */}
      <div className="absolute top-14 left-3 z-[400] flex flex-col space-y-1.5 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 rounded-lg bg-slate-900/90 backdrop-blur text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow-md transition text-sm cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 rounded-lg bg-slate-900/90 backdrop-blur text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow-md transition text-sm cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleRecenter}
          className="w-7 h-7 rounded-lg bg-slate-900/90 backdrop-blur text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/60 shadow-md transition text-sm cursor-pointer"
          title="Recenter Central Corridor"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>

      {/* Floating Bottom-Left Tactical Legend */}
      <div className="absolute bottom-3 left-3 z-[400] pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-2 text-[10.5px] font-medium text-slate-300 flex flex-col space-y-1 shadow-2xl">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
          <span>Active Target: <span className="font-mono text-cyan-300 font-bold">{selectedPlate}</span></span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          <span>Camera Nodes: <span className="font-mono text-white">{cameras.length || 12} Registered</span></span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>Corridor Flow: <span className="text-emerald-300 font-semibold">Normal (48 km/h)</span></span>
        </div>
      </div>
    </div>
  );
};
