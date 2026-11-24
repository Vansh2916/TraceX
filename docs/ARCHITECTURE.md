# TraceX Architectural Blueprint

## 🏛️ System Topology

TraceX operates as a distributed real-time municipal surveillance pipeline:

```
[ CCTV / RTSP Feeds ] ---> [ Stream Worker / YOLO ANPR ] ---> [ FastAPI Ingestion ]
                                                                       |
       +-----------------------+----------------------+----------------+
       |                       |                      |
[ SQLite WAL Engine ]   [ Dijkstra Engine ]   [ WebSocket Hub ]
       |                       |                      |
[ DB Persistence ]      [ Anomaly Detector ]  [ Leaflet React UI ]
```

## 📐 Anomaly Detection Formulations

1. **Velocity Upper Bound Violation:**
   $$v = \frac{d_{\text{haversine}}(p_1, p_2)}{\Delta t}$$
   If $v > 140\text{ km/h}$, flag as `PHYSICALLY_IMPOSSIBLE_SPEED` (Ghost Plate / Counterfeit).

2. **Convoy Correlation Metric:**
   $$C(v_1, v_2) = \sum_{j \in J} \mathbb{I}(|t_{1,j} - t_{2,j}| < \tau)$$
   Where $\tau = 120\text{ seconds}$ and minimum shared junctions $|J| \ge 3$.
