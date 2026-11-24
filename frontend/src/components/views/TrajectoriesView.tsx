import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera } from '../../types';
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
  const [activePlate, setActivePlate] = useState(selectedPlate);

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
  };

  const curr = trajectoriesData[activePlate] || trajectoriesData.DL8CAF2381;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const firstPt = curr.checkpoints[0];
    const map = L.map(mapContainerRef.current, {
      center: [firstPt.lat, firstPt.lon],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // High Res Aerial Satellite Tiles
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        className: 'satellite-night-tiles',
      }
    ).addTo(map);

    // Road lines
    L.tileLayer(
      'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        opacity: 0.65,
      }
    ).addTo(map);

    // Build route coordinates
    const routePoints: [number, number][] = curr.checkpoints.map((c: any) => [c.lat, c.lon]);
    if (curr.projected) {
      routePoints.push([curr.projected.lat, curr.projected.lon]);
    }

    // Historical Glowing Polyline
    const histPoints: [number, number][] = curr.checkpoints.map((c: any) => [c.lat, c.lon]);
    L.polyline(histPoints, {
      color: '#0284c7',
      weight: 7,
      opacity: 0.45,
      lineCap: 'round',
    }).addTo(map);

    L.polyline(histPoints, {
      color: '#38bdf8',
      weight: 3.5,
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(map);

    // Projected Dashed Polyline
    if (curr.projected) {
      const lastHist = histPoints[histPoints.length - 1];
      const projPoints: [number, number][] = [lastHist, [curr.projected.lat, curr.projected.lon]];
      L.polyline(projPoints, {
        color: '#f59e0b',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);
    }

    // Checkpoint Markers
    curr.checkpoints.forEach((cp: any, idx: number) => {
      const isLast = idx === curr.checkpoints.length - 1;
      const markerHtml = isLast
        ? `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 rounded-full bg-cyan-400/40 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-cyan-300 text-white font-bold flex items-center justify-center text-xs shadow-lg">
              ${idx + 1}
            </div>
            <div class="absolute -top-6 whitespace-nowrap bg-black/90 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-cyan-500/60">
              LOCKED
            </div>
          </div>
        `
        : `
          <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white text-white font-bold flex items-center justify-center text-[10px] shadow-md">
            ${idx + 1}
          </div>
        `;

      const icon = L.divIcon({
        className: 'custom-wp-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([cp.lat, cp.lon], { icon }).addTo(map).bindTooltip(
        `<div class="text-xs font-sans font-bold">${cp.cam}: ${cp.name}</div><div class="text-[10px] font-mono text-slate-300">${cp.time} • ${cp.speed}</div>`,
        { direction: 'top', className: 'custom-tooltip' }
      );
    });

    // Projected Target Marker
    if (curr.projected) {
      const projIcon = L.divIcon({
        className: 'proj-marker',
        html: `
          <div class="w-7 h-7 rounded-full bg-amber-500/90 border-2 border-amber-200 text-slate-900 font-bold flex items-center justify-center text-xs shadow-lg animate-pulse">
            ★
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([curr.projected.lat, curr.projected.lon], { icon: projIcon }).addTo(map).bindTooltip(
        `<div class="text-xs font-bold text-amber-300">Projected Next: ${curr.projected.name}</div><div class="text-[10px] font-mono">P=${curr.projected.prob} • ETA: ${curr.projected.eta}</div>`,
        { direction: 'top', className: 'custom-tooltip' }
      );
    }

    map.fitBounds(L.latLngBounds(routePoints), { padding: [50, 50] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [activePlate]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-5 overflow-y-auto">
      {/* Top Banner & Vehicle Selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                Corridor Trajectories & Pursuit Intelligence
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                MARKOV INTERCEPTION
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-camera spatio-temporal route reconstruction and predictive next-junction intercept vector.
            </p>
          </div>
        </div>

        {/* Plate Switcher Tabs */}
        <div className="flex items-center space-x-2">
          {Object.keys(trajectoriesData).map((p) => (
            <button
              key={p}
              onClick={() => {
                setActivePlate(p);
                onSelectPlate?.(p);
              }}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center space-x-1.5 ${
                activePlate === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{p}</span>
              {activePlate === p && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2 Column Split */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-[500px]">
        {/* Left 8 Cols: Map Canvas */}
        <div className="col-span-8 bg-slate-950 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs relative flex flex-col">
          <div ref={mapContainerRef} className="w-full h-full min-h-[460px]" />

          {/* Map Overlay Header */}
          <div className="absolute top-3 left-3 z-[400] flex items-center space-x-2">
            <div className="bg-slate-900/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-slate-700/60 font-semibold flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Live Trajectory: {activePlate}</span>
            </div>
          </div>

          {/* Map Floating Legend */}
          <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur border border-slate-700/60 rounded-xl px-3 py-2 text-[11px] text-slate-200 flex items-center space-x-4 shadow-lg">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-cyan-400 inline-block rounded" />
              <span>Traversed Path</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-amber-400 inline-block rounded border-dashed" />
              <span>Projected Next Path</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Camera Waypoints</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Trajectory Telemetry & Checkpoint Timeline */}
        <div className="col-span-4 flex flex-col space-y-4">
          {/* Target Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Target Vehicle
                </span>
                <div className="text-[18px] font-black font-mono text-slate-900 leading-tight">
                  {curr.plate}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Confidence
                </span>
                <div className="text-[14px] font-bold text-emerald-600">
                  {curr.confidence}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {curr.vehicle}
            </p>

            {/* Metric Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Distance</span>
                <span className="text-xs font-black text-slate-800 font-mono">{curr.totalDistance}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Avg Speed</span>
                <span className="text-xs font-black text-slate-800 font-mono">{curr.avgSpeed}</span>
              </div>
              <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                <span className="text-[9.5px] font-bold text-rose-600 uppercase block">Max Speed</span>
                <span className="text-xs font-black text-rose-700 font-mono">{curr.maxSpeed}</span>
              </div>
            </div>
          </div>

          {/* Sequential Checkpoints Timeline */}
          <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Sequential Camera Checkpoints</span>
              <span className="text-[10px] font-mono text-slate-400">{curr.checkpoints.length} STATIONS</span>
            </div>

            <div className="space-y-2.5 my-3 overflow-y-auto max-h-[220px] pr-1">
              {curr.checkpoints.map((cp: any, idx: number) => (
                <div
                  key={cp.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 transition flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-800">{cp.cam}</span>
                        <span className="text-[10px] font-medium text-slate-400">• {cp.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate max-w-[180px]">{cp.name}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {cp.speed}
                  </span>
                </div>
              ))}
            </div>

            {/* Projected Next Target Card */}
            {curr.projected && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Next Intercept Projection</span>
                  </div>
                  <span className="text-[10.5px] font-bold text-amber-700 font-mono bg-white px-1.5 py-0.2 rounded border border-amber-200">
                    Prob: {curr.projected.prob}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 mt-1">
                  {curr.projected.cam} • {curr.projected.name}
                </div>
                <div className="text-[11px] text-amber-800 font-mono mt-0.5">
                  Arrival ETA: {curr.projected.eta}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
