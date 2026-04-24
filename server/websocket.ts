import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { parse as parseCookie } from "cookie";
import { pool } from "./db";

interface WSClient {
  ws: WebSocket;
  userId: string;
  userRole: string;
  organizationId?: string;
}

const clients = new Map<string, WSClient>();
let wss: WebSocketServer | null = null;

export type WSEventType =
  | "borrower_created"
  | "borrower_updated"
  | "credit_account_created"
  | "credit_account_updated"
  | "approval_pending"
  | "approval_completed"
  | "login_event"
  | "data_upload"
  | "system_alert"
  | "score_computed"
  | "fraud_alert"
  | "anchor_created"
  | "collection_sla_breach"
  | "lien_approved"
  | "lien_rejected";

export interface WSEvent {
  type: WSEventType;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  severity?: "info" | "warning" | "critical";
  timestamp: string;
  data?: Record<string, unknown>;
}

async function extractSessionFromRequest(req: IncomingMessage): Promise<{ userId: string; userRole: string; organizationId?: string } | null> {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = parseCookie(cookieHeader);
    const sessionCookieName = Object.keys(cookies).find(k => k.startsWith("connect.sid") || k === "connect.sid");
    if (!sessionCookieName) return null;

    const rawSid = cookies[sessionCookieName];
    if (!rawSid) return null;
    let sid = rawSid.startsWith("s:") ? rawSid.slice(2).split(".")[0] : rawSid;

    const result = await pool.query(
      `SELECT sess FROM "session" WHERE sid = $1 AND expire > NOW()`,
      [sid]
    );

    if (result.rows.length === 0) return null;

    const sess = typeof result.rows[0].sess === "string"
      ? JSON.parse(result.rows[0].sess)
      : result.rows[0].sess;

    if (!sess.userId) return null;

    return {
      userId: sess.userId,
      userRole: sess.userRole || "viewer",
      organizationId: sess.organizationId,
    };
  } catch (e) {
    return null;
  }
}

export function initWebSocket(httpServer: Server): void {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const session = await extractSessionFromRequest(req);
    if (!session) {
      ws.close(4001, "Unauthorized");
      return;
    }

    const clientId = `${session.userId}-${Date.now()}`;
    clients.set(clientId, {
      ws,
      userId: session.userId,
      userRole: session.userRole,
      organizationId: session.organizationId,
    });

    ws.send(JSON.stringify({
      type: "connected",
      message: "Real-time notifications active",
      timestamp: new Date().toISOString(),
    }));

    ws.on("pong", () => {});

    ws.on("close", () => {
      clients.delete(clientId);
    });

    ws.on("error", () => {
      clients.delete(clientId);
    });
  });

  const heartbeat = setInterval(() => {
    clients.forEach((client, id) => {
      if (client.ws.readyState !== WebSocket.OPEN) {
        clients.delete(id);
        return;
      }
      client.ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeat);
  });

  console.log("[WebSocket] Server initialized on /ws");
}

export function broadcastEvent(event: WSEvent, filter?: { roles?: string[]; organizationId?: string; userId?: string }): void {
  if (!wss) return;

  const payload = JSON.stringify(event);

  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    if (filter) {
      if (filter.userId && client.userId !== filter.userId) return;
      if (filter.roles && !filter.roles.includes(client.userRole)) return;
      if (filter.organizationId && client.organizationId !== filter.organizationId) return;
    }

    try {
      client.ws.send(payload);
    } catch (e) {}
  });
}

export function getConnectedClientsCount(): number {
  return clients.size;
}
