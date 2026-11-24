# TraceX — Hackathon Presentation Playbook

## 🎯 3-Minute Judging Pitch Outline

### 1. The Hook (30 seconds)
- Urban police departments in Delhi monitor thousands of CCTV cameras, but rely on manual retro-active review after a crime occurs.
- **TraceX** turns passive video streams into proactive city-wide trajectory intelligence.

### 2. Live Demo: Physical Impossibility & Ghost Vehicles (60 seconds)
- Open Command Center UI at `/`.
- Show vehicle `DL01GH0571` being sighted at Connaught Place and Ashram Chowk within 15 seconds.
- Point out Dijkstra speed limit violation flag: physical limit 50 km/h vs actual 2,880 km/h.
- Immediate trigger: cloned number plate / synthetic counterfeit alert dispatched!

### 3. Live Demo: Convoy Detection & Sliding-Window Graph (45 seconds)
- Switch to Convoy Analysis View (`/convoys`).
- Demonstrate 3 vehicles detected traveling across 3 consecutive Delhi junctions within 12 seconds of each other.
- Show automated PCR intercept dispatch recommendation.

### 4. Technical Architecture & Tech Stack (45 seconds)
- **Frontend:** React 18, Leaflet Dark Matter, WebSockets.
- **Backend:** FastAPI, NetworkX directed graph of Delhi arterials, SQLite WAL mode.
- **AI Intelligence:** Gemini 2.5 Flash NL-to-SQL + local heuristic fallback.
