/**
 * Centralized REST API Service for TraceX Platform.
 */
import { CameraItem, VehicleSighting, WatchlistRecord, AlibiResult } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status} (${endpoint}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export const ApiService = {
  async getCameras(): Promise<CameraItem[]> {
    return fetchJson<CameraItem[]>('/api/cameras');
  },

  async getRecentSightings(limit = 50): Promise<VehicleSighting[]> {
    return fetchJson<VehicleSighting[]>(`/api/sightings?limit=${limit}`);
  },

  async getWatchlist(): Promise<WatchlistRecord[]> {
    return fetchJson<WatchlistRecord[]>('/api/watchlist');
  },

  async queryVehicleTrajectory(plate: string) {
    return fetchJson(`/api/trajectory/${encodeURIComponent(plate)}`);
  },

  async verifyAlibi(payload: {
    plate_number: string;
    claimed_location: string;
    claimed_lat: number;
    claimed_lon: number;
    claimed_time_sec: number;
  }): Promise<AlibiResult> {
    return fetchJson<AlibiResult>('/api/alibi', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
