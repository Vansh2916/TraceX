export interface CameraItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  speed_limit: number;
  status?: string;
}

export interface VehicleSighting {
  id: number;
  plate_number: string;
  camera_id: string;
  camera_name?: string;
  timestamp_sec: number;
  confidence: number;
  flag?: string;
}

export interface WatchlistRecord {
  plate_number: string;
  reason: string;
  severity: string;
  registered_owner?: string;
}

export interface AlibiResult {
  plate_number: string;
  is_consistent: boolean;
  discrepancy_km?: number;
  explanation: string;
}
