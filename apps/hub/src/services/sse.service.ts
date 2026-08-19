import { Response, Request } from 'express';
import config from '../config';

interface ClientConnection {
  id: string;
  res: Response;
  connectedAt: Date;
  ip: string;
}

export class SseService {
  private static clients: Map<string, ClientConnection> = new Map();
  private static heartbeatTimer: NodeJS.Timeout | null = null;

  /**
   * Initializes periodic heartbeat timer
   */
  static init(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, config.sseHeartbeatIntervalMs);

    // Don't keep the process open solely for timer if all sockets close
    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  /**
   * Registers a new SSE client connection
   */
  static registerClient(req: Request, res: Response): string {
    this.init();

    const clientId = `sse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Set mandatory SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    });

    res.flushHeaders?.();

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    const client: ClientConnection = {
      id: clientId,
      res,
      connectedAt: new Date(),
      ip: clientIp,
    };

    this.clients.set(clientId, client);

    // Send initial handshake
    this.sendToClient(client, 'connected', {
      status: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
      activeClients: this.clients.size,
    });

    // Cleanup on disconnect
    req.on('close', () => {
      this.removeClient(clientId);
    });

    res.on('error', (err) => {
      console.warn(`⚠️ SSE client socket error (${clientId}):`, err.message);
      this.removeClient(clientId);
    });

    return clientId;
  }

  /**
   * Removes a disconnected client
   */
  private static removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        if (!client.res.writableEnded) {
          client.res.end();
        }
      } catch {
        // Ignore close errors
      }
      this.clients.delete(clientId);
    }
  }

  /**
   * Sends an SSE event to a specific client
   */
  private static sendToClient(client: ClientConnection, event: string, data: any): boolean {
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      client.res.write(`event: ${event}\ndata: ${payload}\n\n`);
      return true;
    } catch {
      this.removeClient(client.id);
      return false;
    }
  }

  /**
   * Broadcasts an SSE event to all connected clients
   */
  static broadcast(event: string, data: any): number {
    let sentCount = 0;
    const deadClientIds: string[] = [];

    for (const [clientId, client] of this.clients.entries()) {
      try {
        const success = this.sendToClient(client, event, data);
        if (success) {
          sentCount++;
        } else {
          deadClientIds.push(clientId);
        }
      } catch {
        deadClientIds.push(clientId);
      }
    }

    for (const deadId of deadClientIds) {
      this.removeClient(deadId);
    }

    return sentCount;
  }

  /**
   * Sends periodic ping to keep persistent connections active
   */
  private static sendHeartbeat(): void {
    if (this.clients.size === 0) return;

    this.broadcast('ping', {
      timestamp: new Date().toISOString(),
      activeClients: this.clients.size,
    });
  }

  /**
   * Returns current active connection count
   */
  static getActiveClientsCount(): number {
    return this.clients.size;
  }
}
