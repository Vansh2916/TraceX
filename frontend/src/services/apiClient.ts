/**
 * Centralized, Robust API Client for TraceX Platform.
 * 
 * Guarantees:
 * 1. Base URL resolution from VITE_API_BASE_URL or relative origin.
 * 2. Strict validation of Content-Type before parsing JSON (prevents <!doctype HTML syntax crashes).
 * 3. Structured error classification (HTML fallback, HTTP error, Network failure, Timeout).
 * 4. Distinct OCR outcome contract (plate_detected, no_frame, no_plate_detected, service_failure).
 */

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
  isHtmlFallback?: boolean;
}

export type OcrOutcome = 'plate_detected' | 'no_frame' | 'no_plate_detected' | 'service_failure';

export interface OcrScanResult {
  success: boolean;
  outcome: OcrOutcome;
  plate?: string;
  camera_id?: string;
  camera_name?: string;
  capture_time?: string;
  confidence?: number;
  vehicle_type?: string;
  color?: string;
  make_model?: string;
  error?: string;
}

export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string) || '';
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
};

export const getWsUrl = (path: string = '/ws'): string => {
  const envWs = (import.meta.env.VITE_WS_URL as string) || '';
  if (envWs && envWs.trim()) {
    return envWs.trim();
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${protocol}//${host}${cleanPath}`;
};

export async function safeFetchJson<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Reject HTML doctypes and non-JSON payloads
    if (!isJson) {
      const text = await res.text().catch(() => '');
      const isHtml = text.trim().toLowerCase().startsWith('<!doctype') || text.includes('<html');
      return {
        success: false,
        status: res.status,
        error: isHtml
          ? `API endpoint returned HTML (SPA fallback / missing backend proxy) instead of JSON.`
          : `Expected application/json response but received ${contentType || 'unknown'} (status ${res.status}).`,
        isHtmlFallback: isHtml,
      };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        status: res.status,
        error: errJson.detail || errJson.error || `HTTP ${res.status} ${res.statusText}`,
      };
    }

    const data = (await res.json()) as T;
    return {
      success: true,
      status: res.status,
      data,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        status: 408,
        error: `Request to ${endpoint} timed out after ${timeoutMs / 1000}s.`,
      };
    }
    return {
      success: false,
      status: 0,
      error: err.message || 'Network connection failed.',
    };
  }
}
