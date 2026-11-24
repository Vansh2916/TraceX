export interface Camera {
  id: string;
  name: string;
  landmark: string;
  lat: number;
  lon: number;
  zone: string;
  speed_limit: number;
}

export interface NetworkEdge {
  from_cam: string;
  to_cam: string;
  from_coord: [number, number];
  to_coord: [number, number];
  min_time_sec: number;
  length_km: number;
  road_name: string;
}

export interface PCRUnit {
  id: string;
  callsign: string;
  station: string;
  lat: number;
  lon: number;
  officer: string;
  vehicle: string;
  distance_km?: number;
  intercept_eta_min?: number;
}

export interface PredictionCandidate {
  camera_id: string;
  camera_name: string;
  probability: number;
  eta_seconds: number;
  coordinates: [number, number];
  road: string;
}

export interface PredictionData {
  top_predictions: PredictionCandidate[];
  recommended_interception: {
    intercept_camera: string;
    intercept_camera_name: string;
    nearest_pcr: PCRUnit;
  };
}

export interface Sighting {
  id?: number;
  plate: string;
  camera_id: string;
  camera_name?: string;
  lat?: number;
  lon?: number;
  timestamp_sec: number;
  iso_time: string;
  speed_kmh: number;
  confidence: number;
  vehicle_type?: string;
  color?: string;
  flags: string[];
  prediction?: PredictionData;
  prev_camera_id?: string | null;
}

export interface Alert {
  id: number;
  alert_type: 'GHOST_ALERT' | 'SPEED_VIOLATION' | 'WATCHLIST_HIT' | 'CONVOY_DETECTED';
  plate: string;
  camera_id: string;
  camera_name?: string;
  timestamp_sec: number;
  iso_time: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  details: any;
  status: string;
}

export interface ConvoyEvent {
  camera_id: string;
  camera_name: string;
  t1: number;
  t2: number;
  dt_sec: number;
}

export interface Convoy {
  plates: [string, string];
  co_occurrence_count: number;
  cameras_traversed: string[];
  junction_names: string[];
  events: ConvoyEvent[];
  confidence_score: number;
  risk_assessment: string;
}

export interface WatchlistItem {
  plate: string;
  reason: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  added_at: string;
  description?: string;
  status: string;
}

export interface AlibiResult {
  plate: string;
  status: 'CONFIRMED' | 'BROKEN' | 'INCONCLUSIVE';
  discrepancy_km: number;
  time_delta_sec: number;
  claimed_coords: [number, number];
  closest_sighting?: {
    camera_id: string;
    camera_name: string;
    timestamp_sec: number;
    speed_kmh: number;
  };
  explanation: string;
}

export interface NLQueryResult {
  success?: boolean;
  found?: boolean;
  query_type?: string;
  requested_plate?: string;
  normalized_plate?: string;
  user_query: string;
  generated_sql: string;
  mode: string;
  results_count: number;
  results: any[];
  explanation: string;
  message?: string;
  error?: string | null;
}
