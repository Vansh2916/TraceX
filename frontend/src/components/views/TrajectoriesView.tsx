import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera } from '../../types';
import { getGoogleTileUrl, GOOGLE_TILE_OPTIONS } from '../../utils/mapConfig';
import {
  Route,
  Navigation,
  Clock,
  MapPin,
  ShieldAlert,
  Gauge,
  ArrowRight,
  TrendingUp,
  Radio,
  CheckCircle2,
  Calendar,
  Sparkles,
  Search,
  Eye,
  Crosshair,
  Plus,
  Minus,
} from 'lucide-react';

interface TrajectoriesViewProps {
  cameras: Camera[];
  selectedPlate?: string;
  onSelectPlate?: (plate: string) => void;
  onOpenLiveFeed?: () => void;
}

export const TrajectoriesView: React.FC<TrajectoriesViewProps> = ({
  cameras,
  selectedPlate = 'DL8CAF2381',
  onSelectPlate,
  onOpenLiveFeed,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    routeLayer: L.LayerGroup;
    checkpointsLayer: L.LayerGroup;
  } | null>(null);

  const [activePlate, setActivePlate] = useState(selectedPlate);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (selectedPlate) setActivePlate(selectedPlate);
  }, [selectedPlate]);

  const trajectoriesData: Record<string, any> = {
    DL8CAF2381: {
      plate: 'DL8CAF2381',
      vehicle: 'Toyota Corolla (White Sedan)',
      status: 'CRITICAL ALERT: GHOST SUSPECT',
      confidence: '98.7%',
      totalDistance: '6.42 km',
      avgSpeed: '53.8 km/h',
      maxSpeed: '78.2 km/h',
      checkpoints: [
        { id: 'CP_01', cam: 'CAM_01', name: 'Connaught Place Radial 1', time: '17:34:10', speed: '52 km/h', lat: 28.6328, lon: 77.2197, status: 'NORMAL' },
        { id: 'CP_02', cam: 'CAM_03', name: 'Barakhamba Road Junction', time: '17:37:25', speed: '68 km/h', lat: 28.6295, lon: 77.2240, status: 'OVERSPEED' },
        { id: 'CP_03', cam: 'CAM_03', name: 'ITO Intersection / Vikas Marg', time: '17:39:50', speed: '55 km/h', lat: 28.6289, lon: 77.2410, status: 'GHOST_CLONE' },
        { id: 'CP_04', cam: 'CAM_07', name: 'Rajpath Rd (Near Janpath)', time: '17:42:15', speed: '42 km/h', lat: 28.6180, lon: 77.2180, status: 'RADAR_LOCK' },
      ],
      projected: {
        cam: 'CAM_02',
        name: 'India Gate C-Hexagon',
        eta: '17:44:00 (In 105s)',
        prob: '84%',
        lat: 28.6129,
        lon: 77.2295,
      },
    },
    HR26DK9723: {
      plate: 'HR26DK9723',
      vehicle: 'Hyundai Creta (Silver SUV)',
      status: 'UNDER SURVEILLANCE',
      confidence: '96.2%',
      totalDistance: '12.8 km',
      avgSpeed: '58.4 km/h',
      maxSpeed: '82.0 km/h',
      checkpoints: [
        { id: 'CP_11', cam: 'CAM_06', name: 'Dhaula Kuan NH-48', time: '17:20:00', speed: '78 km/h', lat: 28.5921, lon: 77.1616, status: 'NORMAL' },
        { id: 'CP_12', cam: 'CAM_09', name: 'Moti Bagh Junction', time: '17:28:15', speed: '64 km/h', lat: 28.5833, lon: 77.1744, status: 'NORMAL' },
        { id: 'CP_13', cam: 'CAM_05', name: 'AIIMS Ring Road Flyover', time: '17:34:40', speed: '51 km/h', lat: 28.5672, lon: 77.2100, status: 'NORMAL' },
        { id: 'CP_14', cam: 'CAM_01', name: 'Connaught Place Inner Circle', time: '17:40:00', speed: '54 km/h', lat: 28.6328, lon: 77.2197, status: 'NORMAL' },
      ],
      projected: {
        cam: 'CAM_04',
        name: 'Kashmere Gate ISBT',
        eta: '17:48:30 (In 480s)',
        prob: '62%',
        lat: 28.6665,
        lon: 77.2332,
      },
    },
    UP16BT4097: {
      plate: 'UP16BT4097',
      vehicle: 'Maruti Swift (Red Hatchback)',
      status: 'CORRIDOR TRACKED',
      confidence: '95.4%',
      totalDistance: '4.9 km',
      avgSpeed: '46.1 km/h',
      maxSpeed: '61.5 km/h',
      checkpoints: [
        { id: 'CP_21', cam: 'CAM_08', name: 'Ashram Chowk Underpass', time: '17:22:10', speed: '48 km/h', lat: 28.5707, lon: 77.2588, status: 'NORMAL' },
        { id: 'CP_22', cam: 'CAM_12', name: 'Sarai Kale Khan RRTS Hub', time: '17:29:45', speed: '52 km/h', lat: 28.5885, lon: 77.2550, status: 'NORMAL' },
        { id: 'CP_23', cam: 'CAM_03', name: 'ITO Junction Vikas Marg', time: '17:35:10', speed: '48 km/h', lat: 28.6289, lon: 77.2410, status: 'NORMAL' },
      ],
      projected: {
        cam: 'CAM_02',
        name: 'India Gate Outer Circle',
        eta: '17:41:00',
        prob: '72%',
        lat: 28.6129,
        lon: 77.2295,
      },
    },
    'DL 1C WX 0007': {
      plate: 'DL 1C WX 0007',
      vehicle: 'Dark Grey Toyota Fortuner 4x4',
      status: 'CRITICAL ALERT: HIT-AND-RUN SUSPECT',
      confidence: '99.1%',
      totalDistance: '8.15 km',
      avgSpeed: '64.2 km/h',
      maxSpeed: '91.0 km/h',
      checkpoints: [
        { id: 'CP_31', cam: 'CAM_02', name: 'India Gate C-Hexagon', time: '17:15:30', speed: '72 km/h', lat: 28.6129, lon: 77.2295, status: 'HIT_AND_RUN' },
        { id: 'CP_32', cam: 'CAM_03', name: 'ITO Junction (Fled North)', time: '17:21:00', speed: '88 km/h', lat: 28.6289, lon: 77.2410, status: 'OVERSPEED' },
        { id: 'CP_33', cam: 'CAM_04', name: 'Kashmere Gate Outer Ring', time: '17:27:45', speed: '62 km/h', lat: 28.6665, lon: 77.2332, status: 'RADAR_LOCK' },
      ],
      projected: {
        cam: 'CAM_11',
        name: 'Karol Bagh Radial Corridor',
        eta: '17:32:00',
        prob: '89%',
        lat: 28.6515,
        lon: 77.1905,
      },
    },
    'DL 8C AB 9110': {
      plate: 'DL 8C AB 9110',
      vehicle: 'Silver Honda City',
      status: 'CRITICAL: SYNTHETIC CLONED PLATE',
      confidence: '99.4%',
      totalDistance: '14.5 km',
      avgSpeed: '3480 km/h (PHYSICALLY IMPOSSIBLE)',
      maxSpeed: '3480 km/h',
      checkpoints: [
        { id: 'CP_41', cam: 'CAM_01', name: 'Connaught Place Outer Circle', time: '17:39:45', speed: '48 km/h', lat: 28.6328, lon: 77.2197, status: 'NORMAL' },
        { id: 'CP_42', cam: 'CAM_07', name: 'IGI Airport T3 Terminal', time: '17:40:00', speed: '52 km/h', lat: 28.5562, lon: 77.1000, status: 'GHOST_CLONE' },
      ],
      projected: {
        cam: 'CAM_06',
        name: 'Dhaula Kuan Intercept Point',
        eta: 'IMMEDIATE POLICE DISPATCH',
        prob: '96%',
        lat: 28.5921,
        lon: 77.1616,
      },
    },
  };

  const curr = trajectoriesData[activePlate] || null;

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

    // Google Maps Dark Tactical Radar with user API key
    L.tileLayer(
      getGoogleTileUrl('m'),
      {
        ...GOOGLE_TILE_OPTIONS,
        className: 'dark-tactical-tiles',
      }
    ).addTo(map);

    L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.35,
      }
    ).addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const checkpointsLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      routeLayer,
      checkpointsLayer,
    };

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersRef.current = null;
    };
  }, []);

  // 2. Update Trajectory Graphics when active plate changes
  useEffect(() => {
    if (!layersRef.current || !mapInstanceRef.current) return;
    const { routeLayer, checkpointsLayer } = layersRef.current;
    routeLayer.clearLayers();
    checkpointsLayer.clearLayers();

    // If no records found for activePlate, don't invent a route or substitute another vehicle
    if (!curr) return;

    const histPoints: [number, number][] = curr.checkpoints.map((c: any) => [c.lat, c.lon]);

    // Historical Glowing Line
    L.polyline(histPoints, {
      color: '#0284c7',
      weight: 7,
      opacity: 0.4,
      lineCap: 'round',
    }).addTo(routeLayer);

    L.polyline(histPoints, {
      color: '#38bdf8',
      weight: 3.5,
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(routeLayer);

    // Projected Dashed Polyline
    if (curr.projected) {
      const lastHist = histPoints[histPoints.length - 1];
      const projPoints: [number, number][] = [lastHist, [curr.projected.lat, curr.projected.lon]];
      L.polyline(projPoints, {
        color: '#f59e0b',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(routeLayer);
    }

    // Place Checkpoints
    curr.checkpoints.forEach((cp: any, idx: number) => {
      const isLast = idx === curr.checkpoints.length - 1;
      const isGhost = cp.status === 'GHOST_CLONE';
      const isSpeed = cp.status === 'OVERSPEED';

      const dotIcon = L.divIcon({
        className: 'custom-checkpoint-marker',
        html: `
          <div class="relative flex items-center justify-center">
            ${isLast ? '<div class="absolute w-10 h-10 rounded-full bg-cyan-400/30 animate-ping"></div>' : ''}
            <div class="w-7 h-7 rounded-full ${
              isGhost
                ? 'bg-purple-600 border-2 border-purple-300'
                : isSpeed
                ? 'bg-rose-600 border-2 border-rose-300'
                : isLast
                ? 'bg-cyan-500 border-2 border-white'
                : 'bg-blue-600 border-2 border-white'
            } shadow-lg flex items-center justify-center text-white text-[11px] font-bold z-10">
              ${idx + 1}
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/90 text-slate-200 border border-slate-700 px-1.5 py-0.2 rounded text-[8.5px] font-mono whitespace-nowrap shadow-md pointer-events-none">
              ${cp.time}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([cp.lat, cp.lon], { icon: dotIcon });
      const badgeStyle = isGhost
        ? 'color: #d8b4fe; background-color: rgba(88, 28, 135, 0.45); border: 1px solid #a855f7;'
        : isSpeed
        ? 'color: #fca5a5; background-color: rgba(159, 18, 57, 0.45); border: 1px solid #f43f5e;'
        : 'color: #86efac; background-color: rgba(6, 78, 59, 0.45); border: 1px solid #10b981;';

      marker.bindTooltip(
        `<div style="background-color: #090d16; color: #f8fafc; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); min-width: 175px; font-family: inherit;">
          <div style="font-size: 11.5px; font-weight: 700; color: #ffffff; margin-bottom: 3px; line-height: 1.3;">${cp.name}</div>
          <div style="font-size: 10px; color: #cbd5e1; font-family: monospace; margin-bottom: 4px;">
            Time: <span style="color: #38bdf8; font-weight: 600;">${cp.time}</span> • Speed: <span style="color: #fbbf24; font-weight: 600;">${cp.speed}</span>
          </div>
          <div style="font-size: 9.5px; font-weight: 700; font-family: monospace; text-transform: uppercase; display: inline-block; padding: 2px 7px; border-radius: 4px; ${badgeStyle}">
            ${cp.status}
          </div>
        </div>`,
        { direction: 'top', className: 'tactical-map-tooltip' }
      );
      marker.addTo(checkpointsLayer);
    });

    // Place Projected Destination Marker
    if (curr.projected) {
      const projIcon = L.divIcon({
        className: 'custom-proj-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-9 h-9 rounded-full bg-amber-400/20 animate-pulse"></div>
            <div class="w-7 h-7 rounded-full bg-amber-500 border-2 border-amber-200 shadow-lg flex items-center justify-center text-slate-950 text-xs font-black z-10">
              ETA
            </div>
            <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-950/95 text-amber-300 border border-amber-500/80 px-2 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-md pointer-events-none">
              ${curr.projected.eta}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([curr.projected.lat, curr.projected.lon], { icon: projIcon })
        .bindTooltip(
          `<div style="background-color: #090d16; color: #f8fafc; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); min-width: 175px; font-family: inherit;">
            <div style="font-size: 11.5px; font-weight: 700; color: #fbbf24; margin-bottom: 3px;">Projected Intercept: ${curr.projected.name}</div>
            <div style="font-size: 10px; color: #cbd5e1; font-family: monospace;">Markov Confidence: <span style="color: #38bdf8; font-weight: 600;">${curr.projected.prob}</span></div>
          </div>`,
          { direction: 'top', className: 'tactical-map-tooltip' }
        )
        .addTo(checkpointsLayer);
    }

    // Auto fit bounds smoothly
    if (histPoints.length > 0) {
      const allPoints = curr.projected ? [...histPoints, [curr.projected.lat, curr.projected.lon]] : histPoints;
      const bounds = L.latLngBounds(allPoints as [number, number][]);
      mapInstanceRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
    }
  }, [activePlate, curr]);

  const handleSelectPlateInternal = (plate: string) => {
    setActivePlate(plate);
    if (onSelectPlate) onSelectPlate(plate);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (clean && trajectoriesData[clean]) {
      handleSelectPlateInternal(clean);
      setSearchInput('');
    } else if (clean) {
      handleSelectPlateInternal(clean);
      setSearchInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] overflow-hidden select-none">
      {/* Top Banner Toolbar */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                Trajectory & Predictive Intercept Engine
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                MARKOV + DIJKSTRA
              </span>
            </div>
            <p className="text-[11.5px] font-medium text-slate-500">
              Spatiotemporal tracking of flagged vehicles across Delhi arterial checkpoints
            </p>
          </div>
        </div>

        {/* Quick Plate Switcher Buttons */}
        <div className="flex items-center space-x-2">
          {Object.keys(trajectoriesData).slice(0, 4).map((p) => (
            <button
              key={p}
              onClick={() => handleSelectPlateInternal(p)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                activePlate === p
                  ? 'bg-slate-900 text-cyan-300 shadow-md border border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Trajectory Split View: Map (Left 65%) + Telemetry Drawer (Right 35%) */}
      <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-hidden">
        {/* Left Map Card */}
        <div className="col-span-8 bg-slate-950 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden relative flex flex-col">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map Top Floating Overlay */}
          <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-lg">
              <span className={`w-2 h-2 rounded-full ${curr ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{curr ? `Target Locked: ${activePlate}` : `Target: ${activePlate}`}</span>
              {curr && <span className="text-slate-400">({curr.vehicle})</span>}
            </div>

            {curr && (
              <button
                onClick={onOpenLiveFeed}
                className="pointer-events-auto bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                <span>CCTV Intercept Feed</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Telemetry & Checkpoints Panel */}
        <div className="col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between overflow-y-auto">
          {curr ? (
            <div className="space-y-4">
              {/* Header info */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Telemetry Dossier
                  </span>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {curr.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 font-mono mt-1">{curr.plate}</h3>
                <p className="text-xs text-slate-600 font-medium">{curr.vehicle}</p>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Distance</span>
                  <span className="text-xs font-black text-slate-900 font-mono">{curr.totalDistance}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Avg Speed</span>
                  <span className="text-xs font-black text-blue-600 font-mono">{curr.avgSpeed}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Confidence</span>
                  <span className="text-xs font-black text-emerald-600 font-mono">{curr.confidence}</span>
                </div>
              </div>

              {/* Checkpoints Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center justify-between">
                  <span>Traversed Junctions ({curr.checkpoints.length})</span>
                  <span className="text-[10px] text-slate-400 font-mono">Real CCTV Logs</span>
                </h4>

                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {curr.checkpoints.map((cp: any, idx: number) => (
                    <div
                      key={cp.id}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 leading-tight">{cp.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {cp.time} • Speed: {cp.speed}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded ${
                          cp.status === 'GHOST_CLONE'
                            ? 'bg-purple-100 text-purple-700'
                            : cp.status === 'OVERSPEED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {cp.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projected Intercept Section */}
              {curr.projected && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>AI Projected Interception Point</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{curr.projected.name}</div>
                      <div className="text-[10px] font-mono text-amber-700 mt-0.5">
                        Estimated Arrival: {curr.projected.eta}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-black text-amber-600 bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-xs">
                      {curr.projected.prob}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={onOpenLiveFeed}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer mt-3"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Launch Consecutive Camera Tracking Feed</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">No vehicle records found</h4>
                <p className="text-xs text-slate-600 font-mono">
                  No sightings are currently available for{' '}
                  <span className="text-rose-600 font-bold">{activePlate}</span>.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Please verify the registration number or try another search.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
