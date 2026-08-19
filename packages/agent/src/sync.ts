/**
 * NexusSecure Background Sync Worker
 * Real-time SSE listener + Fallback Polling + Heartbeat Telemetry + Async Threat Reporting Queue.
 */
import { MemoryCache } from './cache.js';
import { BlockEntry, HeartbeatPayload, HubBlockItem, ThreatReportPayload } from './types.js';
import { Logger } from './utils/logger.js';

export interface SyncWorkerOptions {
  apiKey: string;
  hubUrl?: string;
  siteName?: string;
  cache: MemoryCache;
  syncIntervalMs?: number;
  heartbeatIntervalMs?: number;
  enableSse?: boolean;
  enablePolling?: boolean;
  enableHeartbeat?: boolean;
  enableReporting?: boolean;
  logger?: Logger;
  onBlockReceived?: (entry: BlockEntry) => void;
  onUnblockReceived?: (ip: string) => void;
}

export class SyncWorker {
  private readonly apiKey: string;
  private readonly hubUrl: string;
  private readonly siteName?: string;
  private readonly cache: MemoryCache;
  private readonly syncIntervalMs: number;
  private readonly heartbeatIntervalMs: number;
  private readonly enableSse: boolean;
  private readonly enablePolling: boolean;
  private readonly enableHeartbeat: boolean;
  private readonly enableReporting: boolean;
  private readonly logger?: Logger;
  private readonly onBlockReceived?: (entry: BlockEntry) => void;
  private readonly onUnblockReceived?: (ip: string) => void;

  private isRunning = false;
  private sseConnected = false;
  private sseAbortController: AbortController | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private sseReconnectTimer: NodeJS.Timeout | null = null;
  private reportFlushTimer: NodeJS.Timeout | null = null;

  private lastSyncTime: number = 0;
  private lastHeartbeatTime: number | null = null;
  private totalMitigations = 0;
  private readonly startTime = Date.now();
  private sseReconnectAttempts = 0;

  // Asynchronous Threat Reporting Queue
  private reportQueue: ThreatReportPayload[] = [];
  private isFlushingReports = false;

  constructor(options: SyncWorkerOptions) {
    this.apiKey = options.apiKey;
    this.hubUrl = (options.hubUrl || 'http://localhost:3000').replace(/\/+$/, '');
    this.siteName = options.siteName;
    this.cache = options.cache;
    this.syncIntervalMs = options.syncIntervalMs ?? 60_000; // 60s fallback polling
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30_000; // 30s heartbeat
    this.enableSse = options.enableSse ?? true;
    this.enablePolling = options.enablePolling ?? true;
    this.enableHeartbeat = options.enableHeartbeat ?? true;
    this.enableReporting = options.enableReporting ?? true;
    this.logger = options.logger;
    this.onBlockReceived = options.onBlockReceived;
    this.onUnblockReceived = options.onUnblockReceived;
  }

  /**
   * Starts the background sync worker.
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.logger?.info(`Starting NexusSecure Sync Worker (Hub: ${this.hubUrl})...`);

    // Initial blocklist fetch
    try {
      await this.pollBlocklist();
    } catch (err: any) {
      this.logger?.warn(`Initial blocklist sync failed (continuing with local cache): ${err?.message || err}`);
    }

    // Connect to SSE stream
    if (this.enableSse) {
      this.connectSse();
    }

    // Start fallback polling interval
    if (this.enablePolling && this.syncIntervalMs > 0) {
      this.pollTimer = setInterval(() => {
        this.pollBlocklist().catch((err) => {
          this.logger?.warn(`Blocklist poll failed: ${err?.message || err}`);
        });
      }, this.syncIntervalMs);
      if (this.pollTimer.unref) this.pollTimer.unref();
    }

    // Start heartbeat interval
    if (this.enableHeartbeat && this.heartbeatIntervalMs > 0) {
      // Send initial heartbeat
      this.sendHeartbeat().catch(() => {});

      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeat().catch((err) => {
          this.logger?.debug(`Heartbeat dispatch failed: ${err?.message || err}`);
        });
      }, this.heartbeatIntervalMs);
      if (this.heartbeatTimer.unref) this.heartbeatTimer.unref();
    }
  }

  /**
   * Stops the background worker and cleans up all timers and connections.
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    this.sseConnected = false;

    if (this.sseAbortController) {
      this.sseAbortController.abort();
      this.sseAbortController = null;
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.sseReconnectTimer) {
      clearTimeout(this.sseReconnectTimer);
      this.sseReconnectTimer = null;
    }

    if (this.reportFlushTimer) {
      clearTimeout(this.reportFlushTimer);
      this.reportFlushTimer = null;
    }

    // Flush any pending threat reports before shutdown
    if (this.reportQueue.length > 0) {
      await this.flushReportQueue().catch(() => {});
    }

    this.logger?.info('NexusSecure Sync Worker stopped.');
  }

  /**
   * Increments the local mitigation counter (called when a request is blocked).
   */
  public incrementMitigation(): void {
    this.totalMitigations++;
  }

  /**
   * Queues an anonymized threat report for non-blocking asynchronous transmission to the Hub.
   */
  public queueThreatReport(report: ThreatReportPayload): void {
    if (!this.enableReporting || !this.isRunning) return;

    this.reportQueue.push(report);

    // Limit maximum queue size to avoid unbounded memory
    if (this.reportQueue.length > 1000) {
      this.reportQueue.splice(0, this.reportQueue.length - 1000);
    }

    // Schedule batch flush
    if (!this.reportFlushTimer) {
      this.reportFlushTimer = setTimeout(() => {
        this.reportFlushTimer = null;
        this.flushReportQueue().catch((err) => {
          this.logger?.debug(`Threat report flush error: ${err?.message || err}`);
        });
      }, 500); // Debounced 500ms
      if (this.reportFlushTimer.unref) this.reportFlushTimer.unref();
    }
  }

  /**
   * Connects to the real-time SSE stream with exponential backoff on disconnect.
   */
  private async connectSse(): Promise<void> {
    if (!this.isRunning || !this.enableSse) return;

    if (this.sseAbortController) {
      this.sseAbortController.abort();
    }
    this.sseAbortController = new AbortController();

    const sseUrl = `${this.hubUrl}/v1/events`;
    this.logger?.debug(`Connecting to SSE stream: ${sseUrl}`);

    try {
      const response = await fetch(sseUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.sseAbortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE endpoint responded with status ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('SSE response body is empty or not streamable');
      }

      this.sseConnected = true;
      this.sseReconnectAttempts = 0;
      this.logger?.info('Connected to NexusSecure real-time threat mesh (SSE active).');

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (this.isRunning) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const message of parts) {
          this.handleSseMessage(message);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;

      this.sseConnected = false;
      this.logger?.warn(`SSE stream disconnected (${err?.message || err}). Reconnecting with backoff...`);
      this.scheduleSseReconnect();
    }
  }

  /**
   * Schedules an SSE reconnection attempt with exponential backoff and jitter.
   */
  private scheduleSseReconnect(): void {
    if (!this.isRunning || !this.enableSse) return;

    if (this.sseReconnectTimer) {
      clearTimeout(this.sseReconnectTimer);
    }

    this.sseReconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s + jitter
    const baseDelay = Math.min(1000 * 2 ** (this.sseReconnectAttempts - 1), 30_000);
    const jitter = Math.floor(Math.random() * 1000);
    const delay = baseDelay + jitter;

    this.logger?.debug(`Scheduling SSE reconnect in ${delay}ms (attempt #${this.sseReconnectAttempts})`);

    this.sseReconnectTimer = setTimeout(() => {
      this.sseReconnectTimer = null;
      this.connectSse();
    }, delay);
    if (this.sseReconnectTimer.unref) this.sseReconnectTimer.unref();
  }

  /**
   * Parses and routes an individual SSE event block.
   */
  private handleSseMessage(rawBlock: string): void {
    const lines = rawBlock.split('\n');
    let eventType = 'message';
    let dataStr = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue; // Ignore comments and empty lines

      if (trimmed.startsWith('event:')) {
        eventType = trimmed.substring(6).trim();
      } else if (trimmed.startsWith('data:')) {
        dataStr += (dataStr ? '\n' : '') + trimmed.substring(5).trim();
      }
    }

    if (!dataStr) return;

    try {
      const payload = JSON.parse(dataStr);
      this.processSseEvent(eventType, payload);
    } catch (err: any) {
      this.logger?.debug(`Failed to parse SSE payload: ${dataStr} (${err?.message})`);
    }
  }

  /**
   * Dispatches parsed SSE event to the local cache and callbacks.
   */
  private processSseEvent(eventType: string, payload: any): void {
    switch (eventType) {
      case 'block':
      case 'threat_block': {
        const ip = payload.ip || payload.attacker_ip;
        if (!ip) break;

        const expiresAt = typeof payload.expires_at === 'string'
          ? new Date(payload.expires_at).getTime()
          : (typeof payload.expires_at === 'number' ? payload.expires_at : Date.now() + 86_400_000);

        const entry: BlockEntry = {
          ip,
          category: payload.category || 'mesh_broadcast',
          confidence: payload.confidence ?? 0.95,
          expiresAt,
          reason: payload.reason || 'Broadcast from NexusSecure Mesh',
          corroborationCount: payload.corroboration_count ?? 1,
          source: 'hub_sse',
        };

        this.cache.block(ip, entry);
        this.onBlockReceived?.(entry);
        this.logger?.info(`[SSE Mesh Push] Blocked attacker IP: ${ip} (Category: ${entry.category})`);
        break;
      }

      case 'unblock': {
        const ip = payload.ip || payload.attacker_ip;
        if (ip) {
          this.cache.unblock(ip);
          this.onUnblockReceived?.(ip);
          this.logger?.info(`[SSE Mesh Push] Unblocked IP: ${ip}`);
        }
        break;
      }

      case 'sync_full': {
        if (Array.isArray(payload.blocks)) {
          this.cache.loadBlocklist(
            payload.blocks.map((b: any) => ({
              ip: b.ip || b.attacker_ip,
              category: b.category || 'mesh_broadcast',
              confidence: b.confidence ?? 0.9,
              expiresAt: typeof b.expires_at === 'string' ? new Date(b.expires_at).getTime() : b.expires_at,
              reason: b.reason || 'Full sync from Hub',
              source: 'hub_sse',
            }))
          );
          this.logger?.info(`[SSE Sync] Synchronized ${payload.blocks.length} active mesh blocks.`);
        }
        break;
      }

      case 'ping':
      case 'heartbeat_ack':
        this.logger?.debug('Received heartbeat acknowledgement from Hub.');
        break;

      default:
        this.logger?.debug(`Received SSE event '${eventType}':`, payload);
        break;
    }
  }

  /**
   * Resilient fallback polling mechanism: queries `/v1/blocklist?since=...`.
   */
  public async pollBlocklist(): Promise<void> {
    const url = new URL(`${this.hubUrl}/v1/blocklist`);
    if (this.lastSyncTime > 0) {
      url.searchParams.set('since', new Date(this.lastSyncTime).toISOString());
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { blocks?: HubBlockItem[]; timestamp?: string };
    this.lastSyncTime = Date.now();

    if (data.blocks && Array.isArray(data.blocks)) {
      let count = 0;
      for (const item of data.blocks) {
        if (!item || !item.ip) continue;
        const exp = typeof item.expires_at === 'string'
          ? new Date(item.expires_at).getTime()
          : (typeof item.expires_at === 'number' ? item.expires_at : Date.now() + 86_400_000);

        this.cache.block(item.ip, {
          ip: item.ip,
          category: item.category || 'mesh_sync',
          confidence: item.confidence ?? 0.9,
          expiresAt: exp,
          reason: item.reason || 'Polled from NexusSecure Hub',
          corroborationCount: item.corroboration_count ?? 1,
          source: 'hub_poll',
        });
        count++;
      }

      if (count > 0) {
        this.logger?.info(`[Polling Sync] Synced ${count} active block entries from Hub.`);
      }
    }
  }

  /**
   * Asynchronously sends node heartbeat and telemetry metrics to `/v1/heartbeat`.
   */
  public async sendHeartbeat(): Promise<void> {
    const stats = this.cache.getStats();
    let memoryUsageMb: number | undefined;

    if (typeof process !== 'undefined' && process.memoryUsage) {
      memoryUsageMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
    }

    const payload: HeartbeatPayload = {
      apiKey: this.apiKey,
      totalMitigations: this.totalMitigations,
      agentVersion: '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      activeBlocklistSize: stats.activeBlocks,
      memoryUsageMb,
      siteName: this.siteName,
    };

    const res = await fetch(`${this.hubUrl}/v1/heartbeat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      this.lastHeartbeatTime = Date.now();
      this.logger?.debug(`Heartbeat transmitted successfully (Mitigations: ${this.totalMitigations}, Active Blocks: ${stats.activeBlocks}).`);
    } else {
      this.logger?.debug(`Heartbeat returned HTTP ${res.status}`);
    }
  }

  /**
   * Flushes queued threat reports in a single batch to `/v1/report`.
   */
  private async flushReportQueue(): Promise<void> {
    if (this.isFlushingReports || this.reportQueue.length === 0) return;
    this.isFlushingReports = true;

    const reportsToSend = [...this.reportQueue];
    this.reportQueue = [];

    try {
      for (const report of reportsToSend) {
        // Send anonymized threat report
        const res = await fetch(`${this.hubUrl}/v1/report`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ip: report.ip,
            category: report.category,
            confidence: report.confidence,
            details: report.details,
          }),
        });

        if (!res.ok) {
          this.logger?.debug(`Hub /v1/report rejected threat (${report.ip}): HTTP ${res.status}`);
        } else {
          this.logger?.debug(`Successfully reported threat (${report.ip}, ${report.category}) to Hub.`);
        }
      }
    } catch (err: any) {
      this.logger?.warn(`Failed to dispatch threat reports to Hub: ${err?.message || err}`);
    } finally {
      this.isFlushingReports = false;
    }
  }

  /**
   * Returns runtime state of the sync worker.
   */
  public getState(): {
    sseConnected: boolean;
    lastSyncTime: number | null;
    lastHeartbeatTime: number | null;
    totalMitigations: number;
    queuedReports: number;
  } {
    return {
      sseConnected: this.sseConnected,
      lastSyncTime: this.lastSyncTime > 0 ? this.lastSyncTime : null,
      lastHeartbeatTime: this.lastHeartbeatTime,
      totalMitigations: this.totalMitigations,
      queuedReports: this.reportQueue.length,
    };
  }
}
