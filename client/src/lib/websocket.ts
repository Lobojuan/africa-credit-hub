type WSEventHandler = (event: WSEvent) => void;

export interface WSEvent {
  type: string;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  severity?: "info" | "warning" | "critical";
  timestamp: string;
  data?: Record<string, unknown>;
}

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;
const handlers = new Set<WSEventHandler>();

function getWSUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

export function connectWebSocket(): void {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    socket = new WebSocket(getWSUrl());

    socket.onopen = () => {
      reconnectAttempts = 0;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSEvent;
        handlers.forEach((handler) => {
          try {
            handler(data);
          } catch {}
        });
      } catch {}
    };

    socket.onclose = (event) => {
      socket = null;
      if (event.code !== 4001) {
        scheduleReconnect();
      }
    };

    socket.onerror = () => {
      socket?.close();
    };
  } catch {
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, delay);
}

export function disconnectWebSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.close(1000, "Client disconnect");
    socket = null;
  }
  reconnectAttempts = 0;
}

export function onWSEvent(handler: WSEventHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function isConnected(): boolean {
  return socket?.readyState === WebSocket.OPEN;
}
