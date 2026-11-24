import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, PCRUnit } from '../../types';
import {
  MapPin,
  Video,
  Search,
  Crosshair,
  Plus,
  Minus,
  Radio,
  Shield,
  Activity,
  Layers,
  Car,
  Filter,
} from 'lucide-react';

interface LiveMapViewProps {
  cameras: Camera[];
  onOpenFeed?: (camId: string) => void;
}

const DEFAULT_PCR_UNITS: PCRUnit[] = [
  { id: 'PCR_01', callsign: 'Sher-1 (Connaught Place)', station: 'Barakhamba PS', lat: 28.6310, lon: 77.2210, officer: 'SI Rajesh Kumar', vehicle: 'Toyota Innova' },
  { id: 'PCR_02', callsign: 'Sher-2 (India Gate)', station: 'Tilak Marg PS', lat: 28.6140, lon: 77.2310, officer: 'ASI Vikram Singh', vehicle: 'Mahindra Scorpio' },
  { id: 'PCR_03', callsign: 'Cheetah-1 (Dhaula Kuan)', station: 'Delhi Cantt PS', lat: 28.5910, lon: 77.1650, officer: 'Insp. Amit Sharma', vehicle: 'Maruti Ertiga' },
  { id: 'PCR_04', callsign: 'Cheetah-2 (AIIMS Ring Road)', station: 'Hauz Khas PS', lat: 28.5680, lon: 77.2080, officer: 'HC Pradeep', vehicle: 'Toyota Innova' },
];

export const LiveMapView: React.FC<LiveMapViewProps> = ({ cameras, onOpenFeed }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    camerasLayer: L.LayerGroup;
    pcrLayer: L.LayerGroup;
    edgesLayer: L.LayerGroup;
  } | null>(null);

  const [selectedCam, setSelectedCam] = useState<Camera | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  // 1. Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.6190, 77.2250],
      zoom: 12.5,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // CartoDB Dark Matter Base
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map);

    // Street overlay
    L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.35,
      }
    ).addTo(map);

    const edgesLayer = L.layerGroup().addTo(map);
    const camerasLayer = L.layerGroup().addTo(map);
    const pcrLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      camerasLayer,
      pcrLayer,
      edgesLayer,
    };

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersRef.current = null;
    };
  }, []);

  // 2. Draw Camera Nodes and Network Arteries
  useEffect(() => {
    if (!layersRef.current || cameras.length === 0) return;
    const { camerasLayer, edgesLayer, pcrLayer } = layersRef.current;
    camerasLayer.clearLayers();
    edgesLayer.clearLayers();
    pcrLayer.clearLayers();

    // Filter cameras based on search and zone
    const filteredCameras = cameras.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.id.toLowerCase().includes(searchFilter.toLowerCase());
      const matchZone = zoneFilter === 'ALL' || c.zone === zoneFilter;
      return matchSearch && matchZone;
    });

    // Draw connecting arterial corridors
    for (let i = 0; i < cameras.length - 1; i++) {
      const c1 = cameras[i];
      const c2 = cameras[i + 1];
      L.polyline([[c1.lat, c1.lon], [c2.lat, c2.lon]], {
        color: '#1e3a8a',
        weight: 2,
        opacity: 0.4,
        dashArray: '4, 4',
      }).addTo(edgesLayer);
    }

    // Camera Icon Div
    const cameraIcon = (isSelected: boolean) =>
      L.divIcon({
        className: 'custom-camera-marker',
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-cyan-500 scale-125 ring-4 ring-cyan-400/50' : 'bg-blue-600 hover:bg-blue-500 hover:scale-110'} border-2 border-white shadow-xl flex items-center justify-center text-white transition-all">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="m22 8-6 4 6 4V8Z"/>
                <rect width="14" height="12" x="2" y="6" rx="2"/>
              </svg>
            </div>
            <div class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-pulse"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

    // Place filtered cameras
    filteredCameras.forEach((cam) => {
      const marker = L.marker([cam.lat, cam.lon], {
        icon: cameraIcon(selectedCam?.id === cam.id),
      });

      marker.on('click', () => {
        setSelectedCam(cam);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([cam.lat, cam.lon], 14, { duration: 0.8 });
        }
      });

      marker.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="text-[11px] font-bold text-white flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ${cam.id}: ${cam.name}
          </div>
          <div class="text-[9.5px] text-slate-300 font-mono mt-0.5">${cam.zone} • Speed: ${cam.speed_limit} km/h</div>
        </div>`,
        { direction: 'top', className: 'tactical-map-tooltip' }
      );
      marker.addTo(camerasLayer);
    });

    // Draw PCR Patrol Units with flashing blue-red beacon
    const pcrIcon = (callsign: string) =>
      L.divIcon({
        className: 'custom-pcr-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
            <div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-blue-400 shadow-lg flex items-center justify-center text-cyan-300 z-10">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              </svg>
            </div>
            <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-950/90 text-blue-300 border border-blue-500/50 px-1.5 py-0.2 rounded text-[8.5px] font-mono whitespace-nowrap shadow-md pointer-events-none">
              ${callsign.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

    DEFAULT_PCR_UNITS.forEach((unit) => {
      const marker = L.marker([unit.lat, unit.lon], { icon: pcrIcon(unit.callsign) });
      marker.bindTooltip(
        `<div class="p-1 font-sans">
          <div class="text-[11px] font-bold text-cyan-300">🚓 ${unit.callsign}</div>
          <div class="text-[9.5px] text-slate-300 font-mono">${unit.station} • ${unit.officer}</div>
          <div class="text-[9px] text-emerald-400 font-mono">STATUS: ON PATROL (FAST INTERCEPT)</div>
        </div>`,
        { direction: 'top', className: 'tactical-map-tooltip' }
      );
      marker.addTo(pcrLayer);
    });
  }, [cameras, searchFilter, zoneFilter, selectedCam]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    mapInstanceRef.current?.setView([28.6190, 77.2250], 12.5);
    setSelectedCam(null);
  };

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden flex flex-col select-none">
      {/* Top Filter & Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-between pointer-events-none gap-3">
        {/* Search Input */}
        <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3.5 py-1.5 shadow-xl w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search junction / camera..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Zone Filters */}
        <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full p-1 shadow-xl">
          {['ALL', 'Central Delhi', 'South Delhi', 'Outer Ring Road'].map((zone) => (
            <button
              key={zone}
              onClick={() => setZoneFilter(zone)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                zoneFilter === zone
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {zone === 'ALL' ? 'All Corridors' : zone}
            </button>
          ))}
        </div>

        {/* Tactical Feed Pill */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3 py-1.5 shadow-xl text-xs text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-bold">{cameras.length || 12} Cameras Active</span>
          <span className="text-slate-400">•</span>
          <span className="font-mono text-cyan-300">4 PCR Units</span>
        </div>
      </div>

      {/* Map Surface */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full" />

      {/* Floating Left Zoom & Recenter Controls */}
      <div className="absolute top-20 left-4 z-[400] flex flex-col space-y-1.5 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-slate-900/90 backdrop-blur text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/70 shadow-lg transition text-sm cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-slate-900/90 backdrop-blur text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/70 shadow-lg transition text-sm cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-lg bg-slate-900/90 backdrop-blur text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center border border-slate-700/70 shadow-lg transition text-sm cursor-pointer"
          title="Recenter Map"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Floating Bottom Left Legend */}
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-slate-300 flex flex-col space-y-1.5 shadow-2xl">
        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">Tactical Overlays</div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-600 border border-white flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          <span>12 ANPR Camera Stations</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span>PCR Patrol Units (Active Telemetry)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-5 h-0.5 bg-blue-500/60 inline-block border-t border-dashed border-blue-400" />
          <span>Arterial Corridor Interconnects</span>
        </div>
      </div>

      {/* Selected Camera Drawer / HUD Modal */}
      {selectedCam && (
        <div className="absolute bottom-4 right-4 z-[400] pointer-events-auto w-84 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedCam.id}</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">{selectedCam.name}</h4>
              <p className="text-[11px] text-slate-400 font-mono">{selectedCam.landmark}</p>
            </div>
            <button
              onClick={() => setSelectedCam(null)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Speed Limit</span>
              <span className="font-mono text-sm font-black text-amber-400">{selectedCam.speed_limit} km/h</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Optical Status</span>
              <span className="font-mono text-sm font-black text-emerald-400">99.2% OCR</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenFeed) onOpenFeed(selectedCam.id);
            }}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Open High-Speed Live Feed</span>
          </button>
        </div>
      )}
    </div>
  );
};
