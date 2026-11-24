// Centralized Map Configuration & Tile Helpers
export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBwJdDaWIh6xLcALBQOk3pK-M63ACDOTWE';

export type MapProviderType =
  | 'GOOGLE_DARK'
  | 'GOOGLE_HYBRID'
  | 'GOOGLE_ROADMAP'
  | 'GOOGLE_TERRAIN';

export function getGoogleTileUrl(
  layerType: 'm' | 'y' | 'p' = 'm',
  apiKey: string = GOOGLE_MAPS_API_KEY
): string {
  const cleanKey = apiKey?.trim();
  return `https://mt{s}.google.com/vt/lyrs=${layerType}&x={x}&y={y}&z={z}${cleanKey ? `&key=${cleanKey}` : ''}`;
}

export const GOOGLE_TILE_OPTIONS = {
  maxZoom: 20,
  subdomains: '0123',
  attribution: '© Google Maps',
};
