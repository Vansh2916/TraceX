import os
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

import json
from typing import Dict, Any, List

try:
    from backend.engine import DELHI_CAMERAS, PCR_UNITS, city_engine
except ImportError:
    from engine import DELHI_CAMERAS, PCR_UNITS, city_engine

def get_standalone_map_html() -> str:
    """
    Returns a full self-contained, high-performance dark-mode Leaflet map HTML
    with CartoDB / Mapbox / MapTiler Dark Matter tiles, live WebSocket telemetry, 12 camera nodes,
    directed NetworkX arterial corridors, PCR patrol units, and trajectory animations.
    """
    try:
        from backend.llm_client import load_keys
    except ImportError:
        from llm_client import load_keys
    load_keys()

    provider = os.environ.get("MAP_PROVIDER", "GOOGLE_DARK").upper()
    map_key = (
        os.environ.get("MAP_API_KEY") or
        os.environ.get("GOOGLE_MAPS_API_KEY") or
        os.environ.get("MAPBOX_ACCESS_TOKEN") or
        os.environ.get("MAPTILER_API_KEY") or
        os.environ.get("STADIA_API_KEY") or ""
    )

    key_arg = f"&key={map_key}" if map_key else ""
    if provider in ("GOOGLE_MAPS", "GOOGLE_HYBRID"):
        tile_layer_code = f"L.tileLayer('https://mt{{s}}.google.com/vt/lyrs=y&x={{x}}&y={{y}}&z={{z}}{key_arg}', {{ maxZoom: 20, subdomains: '0123', attribution: '© Google Maps Satellite' }}).addTo(map);"
    elif provider == "GOOGLE_DARK":
        tile_layer_code = f"L.tileLayer('https://mt{{s}}.google.com/vt/lyrs=m&x={{x}}&y={{y}}&z={{z}}{key_arg}', {{ maxZoom: 20, subdomains: '0123', className: 'dark-tactical-tiles', attribution: '© Google Maps' }}).addTo(map);"
    elif provider == "GOOGLE_ROADMAP":
        tile_layer_code = f"L.tileLayer('https://mt{{s}}.google.com/vt/lyrs=m&x={{x}}&y={{y}}&z={{z}}{key_arg}', {{ maxZoom: 20, subdomains: '0123', attribution: '© Google Maps' }}).addTo(map);"
    elif provider == "GOOGLE_TERRAIN":
        tile_layer_code = f"L.tileLayer('https://mt{{s}}.google.com/vt/lyrs=p&x={{x}}&y={{y}}&z={{z}}{key_arg}', {{ maxZoom: 20, subdomains: '0123', attribution: '© Google Maps Terrain' }}).addTo(map);"
    elif provider == "MAPBOX" and map_key:
        tile_layer_code = f"L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{{z}}/{{x}}/{{y}}?access_token={map_key}', {{ maxZoom: 19, attribution: '© Mapbox' }}).addTo(map);"
    elif provider == "MAPTILER" and map_key:
        tile_layer_code = f"L.tileLayer('https://api.maptiler.com/maps/dataviz-dark/{{z}}/{{x}}/{{y}}.png?key={map_key}', {{ maxZoom: 19, attribution: '© MapTiler' }}).addTo(map);"
    elif provider == "STADIA" and map_key:
        tile_layer_code = f"L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{{z}}/{{x}}/{{y}}{{r}}.png?api_key={map_key}', {{ maxZoom: 19, attribution: '© Stadia Maps' }}).addTo(map);"
    elif provider == "CARTO" and map_key:
        tile_layer_code = f"L.tileLayer('https://{{s}}.basemaps.cartocdn.com/dark_all/{{z}}/{{x}}/{{y}}{{r}}.png?api_key={map_key}', {{ maxZoom: 19, subdomains: 'abcd', attribution: '© CARTO Dark Matter' }}).addTo(map);"
    elif provider == "OSM":
        tile_layer_code = "L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);"
    else:
        # Default: Google Maps Dark Tactical Radar (Zero watermark, high reliability)
        tile_layer_code = "L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: '0123', className: 'dark-tactical-tiles', attribution: '© Google Maps' }).addTo(map);"
    cameras_json = json.dumps(list(DELHI_CAMERAS.values()))
    edges_json = json.dumps(city_engine.get_network_edges())
    pcr_json = json.dumps(PCR_UNITS)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crusaders — City-Wide ANPR Map API</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body, html {{ width: 100%; height: 100%; overflow: hidden; background: #080b11; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; color: #f1f5f9; }}
    #map {{ width: 100%; height: 100%; background: #0a0e17; }}
    .dark-tactical-tiles {{ filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }}
    .leaflet-tooltip, .tactical-map-tooltip {{
      background: #0f172a !important;
      color: #f8fafc !important;
      border: 1px solid #334155 !important;
      border-radius: 8px !important;
      padding: 6px 10px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
    }}
    .leaflet-tooltip-top:before {{ border-top-color: #334155 !important; }}
    .leaflet-tooltip-bottom:before {{ border-bottom-color: #334155 !important; }}
    .leaflet-tooltip-left:before {{ border-left-color: #334155 !important; }}
    .leaflet-tooltip-right:before {{ border-right-color: #334155 !important; }}

    /* Pulsing radar for camera nodes */
    @keyframes radar {{
      0% {{ transform: scale(0.8); opacity: 0.9; }}
      70% {{ transform: scale(2.2); opacity: 0; }}
      100% {{ transform: scale(2.2); opacity: 0; }}
    }}
    .radar-ring {{
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(6, 182, 212, 0.25);
      animation: radar 2s infinite ease-out;
      pointer-events: none;
    }}
    .cam-dot {{
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0f172a;
      border: 2px solid #38bdf8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
    }}
    .cam-dot-inner {{
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
    }}
    .cam-label {{
      position: absolute;
      bottom: -20px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid #334155;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 9px;
      color: #38bdf8;
      font-weight: bold;
      white-space: nowrap;
    }}

    /* PCR marker */
    .pcr-marker {{
      width: 22px;
      height: 22px;
      background: #2563eb;
      border: 1.5px solid #93c5fd;
      border-radius: 4px;
      color: white;
      font-size: 8px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.7);
    }}

    /* HUD overlay */
    .hud-panel {{
      position: absolute;
      top: 14px;
      left: 14px;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(8px);
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 11px;
      box-shadow: 0 15px 30px rgba(0,0,0,0.6);
      max-width: 320px;
    }}
    .hud-title {{
      font-size: 13px;
      font-weight: bold;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      border-bottom: 1px solid #334155;
      padding-bottom: 6px;
    }}
    .hud-stat {{
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      color: #cbd5e1;
    }}
    .hud-controls {{
      margin-top: 10px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }}
    .hud-btn {{
      background: #1e293b;
      border: 1px solid #334155;
      color: #f1f5f9;
      padding: 4px 8px;
      border-radius: 5px;
      font-size: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }}
    .hud-btn:hover {{
      background: #38bdf8;
      color: #0f172a;
    }}
    .hud-btn.danger:hover {{
      background: #ef4444;
      color: #fff;
    }}

    /* Leaflet popup styling */
    .leaflet-popup-content-wrapper {{
      background: #0f172a !important;
      color: #f8fafc !important;
      border: 1px solid #334155;
      border-radius: 8px;
    }}
    .leaflet-popup-tip {{ background: #0f172a !important; }}

    /* Trajectory Glows */
    .glow-green {{ filter: drop-shadow(0 0 6px #10b981); }}
    .glow-red {{ filter: drop-shadow(0 0 8px #ef4444); }}
    .glow-amber {{ filter: drop-shadow(0 0 6px #f59e0b); }}
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- HUD Control Overlay -->
  <div class="hud-panel">
    <div class="hud-title">
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
      CRUSADERS ANPR MAP API
    </div>
    <div class="hud-stat">
      <span>Delhi Cameras:</span> <b style="color: #38bdf8;">12 Active Nodes</b>
    </div>
    <div class="hud-stat">
      <span>PCR Units:</span> <b style="color: #60a5fa;">6 Interceptors</b>
    </div>
    <div class="hud-stat">
      <span>Status:</span> <b id="ws-status" style="color: #10b981;">WS Connected</b>
    </div>
    <div class="hud-stat">
      <span>Live Sightings:</span> <b id="sighting-count" style="color: #f8fafc;">0</b>
    </div>

    <div class="hud-controls">
      <button class="hud-btn" onclick="triggerSimTick()">⚡ Sim Traffic</button>
      <button class="hud-btn danger" onclick="triggerHitRun()">🚨 Hit & Run</button>
      <button class="hud-btn" style="border-color: #a855f7;" onclick="triggerGhost()">👻 Ghost Plate</button>
    </div>
  </div>

  <script>
    const cameras = {cameras_json};
    const edges = {edges_json};
    const pcrUnits = {pcr_json};

    // Initialize Leaflet Map centered on Delhi
    const map = L.map('map', {{
      center: [28.6180, 77.2050],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    }});

    // Base Tile Layer (Configurable via MAP_PROVIDER & API Key)
    {tile_layer_code}

    const edgesLayer = L.layerGroup().addTo(map);
    const camerasLayer = L.layerGroup().addTo(map);
    const pcrLayer = L.layerGroup().addTo(map);
    const trajectoriesLayer = L.layerGroup().addTo(map);

    const camMap = new Map();
    cameras.forEach(c => camMap.set(c.id, c));

    // Render Arterial Corridors (Directed Edges)
    edges.forEach(e => {{
      const poly = L.polyline([e.from_coord, e.to_coord], {{
        color: '#1e293b',
        weight: 2.5,
        opacity: 0.7,
        dashArray: '4, 8'
      }});
      poly.bindTooltip(`<b>${{e.from_cam}} ➔ ${{e.to_cam}}</b><br/>${{e.road_name}}<br/>Min Time: ${{e.min_time_sec}}s (${{e.length_km}}km)`);
      edgesLayer.addLayer(poly);
    }});

    // Render Camera Nodes with Pulse Ring
    cameras.forEach(c => {{
      const icon = L.divIcon({{
        className: 'cam-wrapper',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div class="radar-ring"></div>
            <div class="cam-dot">
              <div class="cam-dot-inner"></div>
              <div class="cam-label">${{c.id}}</div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      }});

      const marker = L.marker([c.lat, c.lon], {{ icon }});
      marker.bindPopup(`
        <div style="font-size: 11px; line-height: 1.4;">
          <b style="color: #38bdf8; font-size: 13px;">${{c.id}} - ${{c.name}}</b><br/>
          <span style="color: #94a3b8;">${{c.landmark}}</span><br/>
          <span>Zone: <b>${{c.zone}}</b></span><br/>
          <span>Speed Limit: <b style="color: #f59e0b;">${{c.speed_limit}} km/h</b></span>
        </div>
      `);
      camerasLayer.addLayer(marker);
    }});

    // Render PCR Units
    pcrUnits.forEach(p => {{
      const icon = L.divIcon({{
        className: 'pcr-wrap',
        html: `<div class="pcr-marker">PCR</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      }});
      const marker = L.marker([p.lat, p.lon], {{ icon }});
      marker.bindPopup(`
        <div style="font-size: 11px;">
          <b style="color: #60a5fa;">POLICE PATROL: ${{p.callsign}}</b><br/>
          <span>Station: ${{p.station}}</span><br/>
          <span>Officer: ${{p.officer}}</span><br/>
          <span>Vehicle: ${{p.vehicle}}</span>
        </div>
      `);
      pcrLayer.addLayer(marker);
    }});

    // Track Sightings & Trajectories
    let totalSightings = 0;
    const plateTracks = new Map();

    function updateTrajectories() {{
      trajectoriesLayer.clearLayers();
      plateTracks.forEach((track, plate) => {{
        if (track.length < 2) return;
        const coords = [];
        let isGhost = false;
        let isSpeed = false;

        track.forEach(s => {{
          const c = camMap.get(s.camera_id);
          if (c) coords.push([c.lat, c.lon]);
          if (s.flags && s.flags.includes('GHOST_ALERT')) isGhost = true;
          if (s.flags && s.flags.includes('SPEED_VIOLATION')) isSpeed = true;
        }});

        if (coords.length < 2) return;

        let color = '#10b981';
        let cls = 'glow-green';
        if (isGhost) {{
          color = '#ef4444';
          cls = 'glow-red';
        }} else if (isSpeed) {{
          color = '#f59e0b';
          cls = 'glow-amber';
        }}

        const poly = L.polyline(coords, {{
          color,
          weight: isGhost ? 4 : 3,
          opacity: 0.9,
          className: cls
        }});
        poly.bindTooltip(`<b>${{plate}}</b><br/>Sightings: ${{track.length}}`);
        trajectoriesLayer.addLayer(poly);
      }});
    }}

    // Fetch initial sightings
    fetch('/api/sightings?limit=40')
      .then(r => r.json())
      .then(d => {{
        if (d.sightings) {{
          totalSightings = d.sightings.length;
          document.getElementById('sighting-count').innerText = totalSightings;
          d.sightings.reverse().forEach(s => {{
            const arr = plateTracks.get(s.plate) || [];
            arr.push(s);
            plateTracks.set(s.plate, arr);
          }});
          updateTrajectories();
        }}
      }});

    // Live WebSocket Telemetry
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${{protocol}}//${{window.location.host}}/ws`);

    ws.onopen = () => {{
      document.getElementById('ws-status').innerText = 'WS LIVE';
      document.getElementById('ws-status').style.color = '#10b981';
    }};

    ws.onmessage = (event) => {{
      try {{
        const msg = JSON.parse(event.data);
        if (msg.type === 'NEW_SIGHTING') {{
          totalSightings++;
          document.getElementById('sighting-count').innerText = totalSightings;
          const s = msg.data;
          const arr = plateTracks.get(s.plate) || [];
          arr.push(s);
          plateTracks.set(s.plate, arr);
          updateTrajectories();

          // Flash camera point
          const c = camMap.get(s.camera_id);
          if (c) {{
            const pulse = L.circleMarker([c.lat, c.lon], {{
              radius: 18,
              color: s.flags.includes('GHOST_ALERT') ? '#ef4444' : '#10b981',
              weight: 2,
              fillOpacity: 0.3
            }}).addTo(map);
            setTimeout(() => map.removeLayer(pulse), 2500);
          }}
        }}
      }} catch (err) {{}}
    }};

    ws.onclose = () => {{
      document.getElementById('ws-status').innerText = 'RECONNECTING';
      document.getElementById('ws-status').style.color = '#f59e0b';
    }};

    // Demo triggers
    function triggerSimTick() {{
      fetch('/api/simulate/tick', {{ method: 'POST' }});
    }}
    function triggerHitRun() {{
      fetch('/api/simulate/hit-and-run', {{ method: 'POST' }});
    }}
    function triggerGhost() {{
      fetch('/api/simulate/ghost-plate', {{ method: 'POST' }});
    }}
  </script>
</body>
</html>
"""
    return html
