/**
 * Resilient WebSocket Client for Real-time Surveillance Feeds.
 */
type MessageCallback = (data: any) => void;

export class TraceXWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscribers: Set<MessageCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private shouldReconnect = true;

  constructor(url?: string) {
    const defaultUrl = (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:8000/ws';
    this.url = url || defaultUrl;
  }

  public connect() {
    this.shouldReconnect = true;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[TraceX WS] Connected to feed');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.subscribers.forEach((cb) => cb(parsed));
        } catch (e) {
          console.warn('[TraceX WS] Non-JSON payload received:', event.data);
        }
      };

      this.ws.onclose = () => {
        if (this.shouldReconnect) {
          const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelay);
          console.log(`[TraceX WS] Disconnected. Reconnecting in ${delay}ms...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[TraceX WS] Socket error:', err);
      };
    } catch (e) {
      console.error('[TraceX WS] Connection initialization failed:', e);
    }
  }

  public subscribe(cb: MessageCallback): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }
}
