import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Key, Check, X, MapPin } from 'lucide-react';
import { Camera, NetworkEdge, Sighting, Alert, PCRUnit } from '../types';

interface MapComponentProps {
  cameras: Camera[];
  edges: NetworkEdge[];
  sightings: Sighting[];
  alerts: Alert[];
  pcrUnits: PCRUnit[];
  selectedCamera: string | null;
  onSelectCamera: (camId: string) => void;
  nlPins?: Array<{ lat: number; lon: number; label: string; plate?: string }>;
  focusedCoord?: [number, number] | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  cameras,
  edges,
  sightings,
  alerts,
  pcrUnits,
  selectedCamera,
  onSelectCamera,
  nlPins = [],
  focusedCoord = null,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [provider, setProvider] = useState<string>('OSM');
  const [apiKey, setApiKey] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const layersRef = useRef<{
    edgesLayer: L.LayerGroup;
    camerasLayer: L.LayerGroup;
    trajectoriesLayer: L.LayerGroup;
    pcrLayer: L.LayerGroup;
    nlPinsLayer: L.LayerGroup;
  } | null>(null);

  // Apply Tile Layer Function (Google Maps Dark Default)
  const applyTileLayer = (map: L.Map, prov: string, key: string) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let layer: L.TileLayer;
    const cleanKey = key.trim();

    if (prov === 'GOOGLE_DARK') {
      const url = `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${cleanKey ? `&key=${cleanKey}` : ''}`;
      layer = L.tileLayer(url, {
        maxZoom: 20,
        subdomains: '0123',
        className: 'dark-tactical-tiles',
        attribution: '© Google Maps',
      });
    } else if (prov === 'GOOGLE_HYBRID' || prov === 'GOOGLE_MAPS') {
      const url = `https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${cleanKey ? `&key=${cleanKey}` : ''}`;
      layer = L.tileLayer(url, {
        maxZoom: 20,
        subdomains: '0123',
        attribution: '© Google Maps Satellite',
      });
    } else if (prov === 'GOOGLE_ROADMAP') {
      const url = `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${cleanKey ? `&key=${cleanKey}` : ''}`;
      layer = L.tileLayer(url, {
        maxZoom: 20,
        subdomains: '0123',
        attribution: '© Google Maps',
      });
    } else if (prov === 'GOOGLE_TERRAIN') {
      const url = `https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}${cleanKey ? `&key=${cleanKey}` : ''}`;
      layer = L.tileLayer(url, {
        maxZoom: 20,
        subdomains: '0123',
        attribution: '© Google Maps Terrain',
      });
    } else if (prov === 'MAPBOX' && cleanKey) {
      layer = L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${cleanKey}`,
        { maxZoom: 19, attribution: '© Mapbox' }
      );
    } else if (prov === 'MAPBOX_SAT' && cleanKey) {
      layer = L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${cleanKey}`,
        { maxZoom: 19, attribution: '© Mapbox Satellite' }
      );
    } else if (prov === 'MAPTILER' && cleanKey) {
      layer = L.tileLayer(
        `https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=${cleanKey}`,
        { maxZoom: 19, attribution: '© MapTiler' }
      );
    } else if (prov === 'STADIA' && cleanKey) {
      layer = L.tileLayer(
        `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${cleanKey}`,
        { maxZoom: 19, attribution: '© Stadia Maps' }
      );
    } else if (prov === 'CARTO' && cleanKey) {
      layer = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${cleanKey}`,
        { maxZoom: 19, subdomains: 'abcd', attribution: '© CARTO Dark Matter' }
      );
    } else if (prov === 'OSM') {
      layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
    } else {
      // Default: Google Maps Dark Radar (Cyber theme, no watermark, fast)
      layer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: '0123',
        className: 'dark-tactical-tiles',
        attribution: '© Google Maps',
      });
    }

    layer.addTo(map);
    tileLayerRef.current = layer;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Delhi center
    const map = L.map(mapContainerRef.current, {
      center: [28.6180, 77.2050],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    // Default to Google Maps Dark, migrating away from unkeyed CARTO
    let storedProv = localStorage.getItem('crusaders_map_provider');
    const storedKey = localStorage.getItem('crusaders_map_key') || '';
    if (!storedProv || (storedProv === 'CARTO' && !storedKey)) {
      storedProv = 'GOOGLE_DARK';
      localStorage.setItem('crusaders_map_provider', 'GOOGLE_DARK');
    }
    setProvider(storedProv);
    setApiKey(storedKey);

    applyTileLayer(map, storedProv, storedKey);

    // Also sync with backend /api/config/map
    fetch('/api/config/map')
      .then((r) => r.json())
      .then((cfg) => {
        let activeProv = cfg?.provider || storedProv || 'GOOGLE_DARK';
        if (activeProv === 'CARTO' && !storedKey) {
          activeProv = 'GOOGLE_DARK';
        }
        setProvider(activeProv);
        applyTileLayer(map, activeProv, storedKey);
      })
      .catch(() => {
        applyTileLayer(map, storedProv || 'GOOGLE_DARK', storedKey);
      });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Layer groups
    const edgesLayer = L.layerGroup().addTo(map);
    const trajectoriesLayer = L.layerGroup().addTo(map);
    const camerasLayer = L.layerGroup().addTo(map);
    const pcrLayer = L.layerGroup().addTo(map);
    const nlPinsLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      edgesLayer,
      camerasLayer,
      trajectoriesLayer,
      pcrLayer,
      nlPinsLayer,
    };

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleSaveMapKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving...');
    localStorage.setItem('crusaders_map_provider', provider);
    localStorage.setItem('crusaders_map_key', apiKey.trim());

    if (mapRef.current) {
      applyTileLayer(mapRef.current, provider, apiKey.trim());
    }

    try {
      await fetch('/api/config/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, api_key: apiKey.trim() }),
      });
      setSaveStatus('Saved & Applied!');
      setTimeout(() => {
        setSaveStatus('');
        setShowConfig(false);
      }, 900);
    } catch {
      setSaveStatus('Applied locally');
      setTimeout(() => {
        setSaveStatus('');
        setShowConfig(false);
      }, 900);
    }
  };

  // Handle focused coordinate animation
  useEffect(() => {
    if (mapRef.current && focusedCoord) {
      mapRef.current.flyTo(focusedCoord, 14, { duration: 1.2 });
    }
  }, [focusedCoord]);

  // Render Directed NetworkX Edges
  useEffect(() => {
    if (!layersRef.current) return;
    const { edgesLayer } = layersRef.current;
    edgesLayer.clearLayers();

    edges.forEach((edge) => {
      const poly = L.polyline([edge.from_coord, edge.to_coord], {
        color: '#2563eb',
        weight: 3.5,
        opacity: 0.8,
        dashArray: '5, 8',
        className: 'animated-dash-edge',
      });

      poly.bindTooltip(
        `<div class="text-xs font-mono bg-slate-900 text-white p-2 rounded shadow-lg border border-slate-700">
          <span class="text-sky-400 font-bold">${edge.from_cam} ➔ ${edge.to_cam}</span><br/>
          <span class="text-slate-200">${edge.road_name}</span><br/>
          <span class="text-amber-400">Min Time: <b>${edge.min_time_sec}s</b> (${edge.length_km}km)</span>
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      edgesLayer.addLayer(poly);
    });
  }, [edges]);

  // Render Camera Nodes
  useEffect(() => {
    if (!layersRef.current) return;
    const { camerasLayer } = layersRef.current;
    camerasLayer.clearLayers();

    cameras.forEach((cam) => {
      const isSelected = selectedCamera === cam.id;
      const shortName = cam.name.replace(" Junction", "").replace(" Interchange", "").replace(" Flyover", "");

      // Custom HTML Marker with Pulse ring
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-9 h-9 rounded-full bg-cyan-500/25 animate-radar"></div>
          <div class="w-6 h-6 rounded-full ${isSelected ? 'bg-amber-400 border-2 border-white scale-125' : 'bg-slate-950 border-2 border-cyan-400'} flex items-center justify-center shadow-xl transition-transform duration-200">
            <div class="w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-black' : 'bg-cyan-400'}"></div>
          </div>
          <div class="absolute -bottom-6 px-2 py-0.5 rounded-md bg-slate-950/95 border border-cyan-500/60 text-[10px] font-mono text-cyan-200 font-bold whitespace-nowrap shadow-xl">
            ${cam.id}: ${shortName}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-camera-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([cam.lat, cam.lon], { icon: customIcon });

      const popupHtml = `
        <div class="p-2 space-y-1 font-sans">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1">
            <span class="font-bold text-sky-400 font-mono text-sm">${cam.id}</span>
            <span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">ONLINE</span>
          </div>
          <div class="text-xs font-semibold text-white">${cam.name}</div>
          <div class="text-[11px] text-slate-400">${cam.landmark}</div>
          <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 font-mono">
            <span>Zone: <b class="text-slate-200">${cam.zone}</b></span>
            <span>Speed Limit: <b class="text-amber-400">${cam.speed_limit} km/h</b></span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => onSelectCamera(cam.id));
      camerasLayer.addLayer(marker);
    });
  }, [cameras, selectedCamera, onSelectCamera]);

  // Render PCR Police Units
  useEffect(() => {
    if (!layersRef.current) return;
    const { pcrLayer } = layersRef.current;
    pcrLayer.clearLayers();

    pcrUnits.forEach((pcr) => {
      const pcrHtml = `
        <div class="relative flex items-center justify-center cursor-pointer">
          <div class="w-6 h-6 rounded-md bg-blue-600 border border-blue-300 text-white flex items-center justify-center shadow-lg text-[10px] font-mono font-black">
            PCR
          </div>
          <div class="absolute -bottom-4 px-1 py-0.2 rounded bg-blue-950/90 text-[9px] font-mono text-blue-200 whitespace-nowrap border border-blue-800">
            ${pcr.callsign}
          </div>
        </div>
      `;

      const pcrIcon = L.divIcon({
        html: pcrHtml,
        className: 'pcr-custom-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([pcr.lat, pcr.lon], { icon: pcrIcon });
      marker.bindPopup(`
        <div class="p-2 space-y-1 font-sans">
          <div class="flex items-center justify-between border-b border-blue-800 pb-1">
            <span class="font-bold text-blue-400 font-mono text-xs">POLICE PATROL</span>
            <span class="text-[10px] text-slate-300 font-mono">${pcr.id}</span>
          </div>
          <div class="text-xs font-bold text-white">${pcr.callsign} (${pcr.vehicle})</div>
          <div class="text-[11px] text-slate-400">Station: ${pcr.station}</div>
          <div class="text-[11px] text-slate-300">Officer In-charge: <b class="text-white">${pcr.officer}</b></div>
        </div>
      `);
      pcrLayer.addLayer(marker);
    });
  }, [pcrUnits]);

  // Render Animated Glowing Vehicle Trajectories & Sighting Pulses
  useEffect(() => {
    if (!layersRef.current || cameras.length === 0) return;
    const { trajectoriesLayer } = layersRef.current;
    trajectoriesLayer.clearLayers();

    const camMap = new Map(cameras.map((c) => [c.id, c]));

    // 1. Group recent sightings by plate to construct multi-junction trajectories
    const plateTracks = new Map<string, Sighting[]>();
    // Sort chronological
    const sortedSightings = [...sightings].sort((a, b) => a.timestamp_sec - b.timestamp_sec);
    sortedSightings.forEach((s) => {
      const arr = plateTracks.get(s.plate) || [];
      arr.push(s);
      plateTracks.set(s.plate, arr);
    });

    plateTracks.forEach((track, plate) => {
      if (track.length < 2) return;
      const coords: [number, number][] = [];
      let isGhost = false;
      let isWatchlist = false;
      let isSpeeding = false;

      track.forEach((s) => {
        const c = camMap.get(s.camera_id);
        if (c) coords.push([c.lat, c.lon]);
        if (s.flags.includes('GHOST_ALERT')) isGhost = true;
        if (s.flags.includes('WATCHLIST_MATCH')) isWatchlist = true;
        if (s.flags.includes('SPEED_VIOLATION')) isSpeeding = true;
      });

      if (coords.length < 2) return;

      // Color scheme based on anomaly priority
      let pathColor = '#10b981'; // Green for normal valid
      let glowClass = 'glow-path-green';

      if (isGhost) {
        pathColor = '#ef4444'; // Red for Ghost / Cloned
        glowClass = 'glow-path-red';
      } else if (isWatchlist) {
        pathColor = '#f43f5e'; // Crimson for Watchlist Hit
        glowClass = 'glow-path-red';
      } else if (isSpeeding) {
        pathColor = '#f59e0b'; // Amber for speed violation
        glowClass = 'glow-path-amber';
      }

      const polyline = L.polyline(coords, {
        color: pathColor,
        weight: isGhost || isWatchlist ? 4.5 : 3,
        opacity: 0.9,
        className: glowClass,
      });

      polyline.bindTooltip(
        `<div class="font-mono text-xs">
          <span class="font-bold text-white">${plate}</span><br/>
          <span class="text-slate-300">Sightings: ${track.length}</span><br/>
          <span class="${isGhost ? 'text-red-400 font-bold' : isWatchlist ? 'text-rose-400 font-bold' : 'text-emerald-400'}">
            ${isGhost ? '⚠️ GHOST CLONE ALERT' : isWatchlist ? '🚨 WATCHLIST TARGET' : 'VALID TRAJECTORY'}
          </span>
        </div>`,
        { sticky: true }
      );

      trajectoriesLayer.addLayer(polyline);

      // Render projected Markov prediction vector if present on latest sighting
      const latest = track[track.length - 1];
      if (latest && latest.prediction && latest.prediction.top_predictions.length > 0) {
        const topPred = latest.prediction.top_predictions[0];
        const lastCam = camMap.get(latest.camera_id);
        if (lastCam) {
          const predPoly = L.polyline([[lastCam.lat, lastCam.lon], topPred.coordinates], {
            color: '#a855f7', // Purple for Markov prediction
            weight: 2.5,
            dashArray: '6, 6',
            opacity: 0.85,
            className: 'glow-path-purple',
          });

          predPoly.bindTooltip(
            `<div class="font-mono text-xs text-purple-300">
              <b>Markov Projected Exit:</b> ${topPred.camera_name}<br/>
              Probability: <b>${Math.round(topPred.probability * 100)}%</b> | ETA: ${topPred.eta_seconds}s
            </div>`,
            { sticky: true }
          );

          trajectoriesLayer.addLayer(predPoly);
        }
      }
    });
  }, [sightings, cameras]);

  // Render NL Query Pins
  useEffect(() => {
    if (!layersRef.current) return;
    const { nlPinsLayer } = layersRef.current;
    nlPinsLayer.clearLayers();

    if (nlPins.length === 0) return;

    nlPins.forEach((pin, idx) => {
      const pinHtml = `
        <div class="relative flex items-center justify-center animate-bounce">
          <div class="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white text-slate-900 font-bold flex items-center justify-center shadow-2xl text-xs font-mono">
            ${idx + 1}
          </div>
          <div class="absolute -bottom-5 px-1 py-0.5 rounded bg-slate-900 border border-emerald-500 text-[10px] font-mono text-emerald-300 whitespace-nowrap shadow-md">
            ${pin.plate || pin.label}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: pinHtml,
        className: 'nl-pin-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([pin.lat, pin.lon], { icon });
      marker.bindPopup(`
        <div class="p-1 font-mono text-xs">
          <b class="text-emerald-400">NL Query Match #${idx + 1}</b><br/>
          <span class="text-white">${pin.label}</span>
          ${pin.plate ? `<br/><span class="text-slate-300">Plate: ${pin.plate}</span>` : ''}
        </div>
      `);
      nlPinsLayer.addLayer(marker);
    });
  }, [nlPins]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Legend & Status Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs shadow-2xl space-y-2 pointer-events-auto max-w-xs">
        <div className="flex items-center justify-between pb-1 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono font-bold tracking-wider text-slate-100">DELHI TELEMETRY GRID</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-semibold">12/12 CAMERAS</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-emerald-400 rounded-full"></span>
            <span className="text-slate-300">Valid Trajectory</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded-full"></span>
            <span className="text-slate-300">Ghost / Watchlist</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-amber-400 rounded-full"></span>
            <span className="text-slate-300">Speed Violation</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-purple-400 rounded-full"></span>
            <span className="text-slate-300">Markov Next ETA</span>
          </div>
        </div>

        <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
          <span>Tile: <b className="text-slate-200">{provider}</b></span>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center space-x-1 underline decoration-dotted"
          >
            <Key className="w-2.5 h-2.5 inline" />
            <span>Map Key</span>
          </button>
        </div>
      </div>

      {/* Floating Quick Layer Switcher & Key Config (Top-Right) */}
      <div className="absolute top-4 right-4 z-[400] pointer-events-auto flex items-center space-x-1 bg-slate-900/90 p-1 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur">
        <button
          type="button"
          onClick={() => {
            const next = 'GOOGLE_DARK';
            setProvider(next);
            localStorage.setItem('crusaders_map_provider', next);
            if (mapRef.current) applyTileLayer(mapRef.current, next, apiKey);
          }}
          className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all ${
            provider === 'GOOGLE_DARK'
              ? 'bg-sky-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Google Maps Dark Radar (Cyber Theme)"
        >
          Google Dark
        </button>
        <button
          type="button"
          onClick={() => {
            const next = 'GOOGLE_HYBRID';
            setProvider(next);
            localStorage.setItem('crusaders_map_provider', next);
            if (mapRef.current) applyTileLayer(mapRef.current, next, apiKey);
          }}
          className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all ${
            provider === 'GOOGLE_HYBRID' || provider === 'GOOGLE_MAPS'
              ? 'bg-sky-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Google Maps Satellite Hybrid"
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={() => {
            const next = 'GOOGLE_ROADMAP';
            setProvider(next);
            localStorage.setItem('crusaders_map_provider', next);
            if (mapRef.current) applyTileLayer(mapRef.current, next, apiKey);
          }}
          className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all ${
            provider === 'GOOGLE_ROADMAP'
              ? 'bg-sky-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Google Maps Roadmap (Streets & Arteries)"
        >
          Streets
        </button>
        <button
          type="button"
          onClick={() => {
            const next = 'OSM';
            setProvider(next);
            localStorage.setItem('crusaders_map_provider', next);
            if (mapRef.current) applyTileLayer(mapRef.current, next, apiKey);
          }}
          className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all ${
            provider === 'OSM'
              ? 'bg-sky-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="OpenStreetMap Standard"
        >
          OSM
        </button>
        <button
          type="button"
          onClick={() => setShowConfig(true)}
          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors ml-0.5"
          title="Configure Map Providers & Custom API Keys"
        >
          <Key className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map API Key & Provider Configuration Modal */}
      {showConfig && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100">Map Tile Provider & API Key</h3>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMapKey} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">Select Map Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="GOOGLE_DARK">Google Maps Dark Radar (Free / Cyber Aesthetic)</option>
                  <option value="GOOGLE_HYBRID">Google Maps Satellite Hybrid (Free / Aerial Imagery)</option>
                  <option value="GOOGLE_ROADMAP">Google Maps Roadmap (Free / High Detail Streets)</option>
                  <option value="GOOGLE_TERRAIN">Google Maps Terrain (Free / Topography)</option>
                  <option value="OSM">OpenStreetMap Standard (Free / Open Source)</option>
                  <option value="MAPBOX">Mapbox Dark v11 (Requires Access Token)</option>
                  <option value="MAPBOX_SAT">Mapbox Satellite Streets (Requires Token)</option>
                  <option value="MAPTILER">MapTiler Dataviz Dark (Requires API Key)</option>
                  <option value="STADIA">Stadia Maps Smooth Dark (Requires API Key)</option>
                  <option value="CARTO">CARTO Dark Matter (Requires Carto API Key)</option>
                </select>
              </div>

              {provider.startsWith('GOOGLE_') ? (
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">
                    Google Maps API Key (Optional)
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Optional — works out-of-the-box without key"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs font-mono"
                  />
                  <p className="mt-1 text-[11px] text-emerald-400 font-sans">
                    ✓ Google Maps is active and operational. Key is optional.
                  </p>
                </div>
              ) : provider === 'CARTO' ? (
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">
                    CARTO API Key (Required)
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Carto API key..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs font-mono"
                  />
                  <p className="mt-1 text-[11px] text-amber-400 font-sans">
                    Carto requires an API key. For free dark radar with no key, choose "Google Maps Dark Radar".
                  </p>
                </div>
              ) : provider !== 'OSM' && (
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">
                    {provider.startsWith('MAPBOX') ? 'Mapbox Access Token (pk.eyJ...)' : `${provider} API Key`}
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      provider.startsWith('MAPBOX')
                        ? 'pk.eyJ1IjoieW91ci11c2VybmFtZSI...'
                        : 'Enter your API key...'
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-400 font-sans">
                    Saved to local storage and synchronized with backend environment.
                  </p>
                </div>
              )}

              {saveStatus && (
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>{saveStatus}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setProvider('GOOGLE_DARK');
                    setApiKey('');
                    localStorage.setItem('crusaders_map_provider', 'GOOGLE_DARK');
                    localStorage.removeItem('crusaders_map_key');
                    if (mapRef.current) applyTileLayer(mapRef.current, 'GOOGLE_DARK', '');
                    setShowConfig(false);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Reset to Google Maps Dark
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs shadow-md transition-colors"
                >
                  Save & Apply Layer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
