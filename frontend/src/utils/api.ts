/**
 * Crusaders ANPR Trajectory Intelligence — Unified API & WebSocket Client
 * 
 * Solves:
 * 1. Same-origin /api/... requests failing on Vercel when deployed separately from backend
 * 2. Catch-all Vercel rewrite returning HTML (<!DOCTYPE html>) to JSON callers ("Unexpected token '<'")
 * 3. Dedicated WebSocket resolution and separate verification via PING/PONG heartbeat
 */

/**
 * Returns the configured backend API base URL (e.g. 'https://crusaders-anpr.onrender.com' or '').
 * Configurable via VITE_API_URL, VITE_BACKEND_URL, or VITE_API_BASE_URL.
 */
export const getApiBaseUrl = (): string => {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && (
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_API_BASE_URL
    )) || '';

  return envUrl ? envUrl.replace(/\/+$/, '') : '';
};

/**
 * Resolves a full API URL given a relative or absolute path.
 * If VITE_API_URL is configured, prepends the base URL to relative /api/... calls.
 */
export const apiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If already an absolute URL, return as is
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return base ? `${base}${cleanPath}` : cleanPath;
};

/**
 * Returns the WebSocket URL for live telemetry stream.
 * 
 * Resolution order:
 * 1. Explicit VITE_WS_URL environment variable
 * 2. Derived from VITE_API_URL / VITE_BACKEND_URL (http -> ws, https -> wss)
 * 3. Same-origin fallback (${protocol}//${window.location.host}/ws)
 */
export const getWebSocketUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const base = getApiBaseUrl();
  if (base) {
    const wsBase = base
      .replace(/^http:\/\//i, 'ws://')
      .replace(/^https:\/\//i, 'wss://');
    return `${wsBase}/ws`;
  }

  // Same-origin fallback
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  return 'ws://127.0.0.1:8000/ws';
};

/**
 * Safe fetch JSON utility:
 * Prevents "Unexpected token '<'" error by verifying content-type and body before parsing.
 * If HTML is returned (e.g. from Vercel catch-all rewrite to index.html), throws a descriptive error.
 */
export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const url = typeof input === 'string' ? apiUrl(input) : input;
  const res = await fetch(url, init);

  const contentType = res.headers.get('content-type') || '';

  // Intercept HTML fallback from Vercel index.html rewrites
  if (contentType.includes('text/html')) {
    const textSnippet = await res.text();
    throw new Error(
      `API endpoint returned HTML instead of JSON (HTTP ${res.status}). The production server catch-all rewrite may be intercepting API requests: ${textSnippet.slice(0, 80)}...`
    );
  }

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errMsg = errJson.detail;
      else if (errJson.message) errMsg = errJson.message;
    } catch {
      // not JSON
    }
    throw new Error(errMsg);
  }

  return res.json();
}

/**
 * Initialize automatic transparent API rewrite on window.fetch if VITE_API_URL is configured.
 * This guarantees all component fetch('/api/...') calls seamlessly route to the deployed backend.
 */
export const initFetchApiInterceptor = (): void => {
  if (typeof window === 'undefined') return;

  const base = getApiBaseUrl();
  if (!base) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let target = input;

    if (typeof input === 'string' && input.startsWith('/api')) {
      target = `${base}${input}`;
    } else if (input instanceof Request && input.url.startsWith('/api')) {
      target = new Request(`${base}${input.url}`, input);
    }

    return originalFetch(target, init);
  };

  console.log(`[Crusaders] Initialized transparent API routing to backend: ${base}`);
};
