/**
 * NexusSecure Universal Threat Defense Agent
 * Coordinates high-speed in-memory cache, local heuristic threat detectors,
 * real-time SSE sync with the NexusSecure Mesh, and cross-framework middleware.
 */
import { MemoryCache } from './cache.js';
import {
  BruteForceDetector,
  HoneypotDetector,
  RateAbuseDetector,
  SqliXssDetector,
} from './detectors/index.js';
import { SyncWorker } from './sync.js';
import {
  AgentConfig,
  AgentStats,
  BlockEntry,
  InspectionResult,
  RequestContext,
  ThreatCategory,
  ThreatReportPayload,
} from './types.js';
import { extractClientIp, normalizeIp } from './utils/ip.js';
import { Logger } from './utils/logger.js';

export class NexusAgent {
  public readonly config: AgentConfig;
  public readonly logger: Logger;
  public readonly cache: MemoryCache;
  public readonly syncWorker: SyncWorker;

  // Local Detectors
  public readonly bruteForceDetector: BruteForceDetector;
  public readonly honeypotDetector: HoneypotDetector;
  public readonly rateAbuseDetector: RateAbuseDetector;
  public readonly sqliXssDetector: SqliXssDetector;

  private totalThreatsDetected = 0;
  private readonly startTime = Date.now();
  private isStarted = false;

  constructor(config: AgentConfig) {
    if (!config || !config.apiKey) {
      throw new Error('[NexusSecure] Missing required configuration parameter: `apiKey` is mandatory.');
    }

    this.config = {
      enabled: true,
      logLevel: 'info',
      trustProxy: true,
      blockAction: 'block',
      ...config,
    };

    // Initialize Logger
    this.logger = new Logger(this.config.logLevel, this.config.logger);

    // Initialize High-Speed In-Memory Cache
    this.cache = new MemoryCache({
      maxSize: this.config.maxCacheSize ?? 50_000,
      pruneIntervalMs: 30_000,
      initialWhitelist: this.config.whitelist,
      logger: this.logger,
    });

    // Map top-level convenience properties to detector config
    const detectorsConfig = {
      bruteForce: {
        enabled: (config as any).enableBruteForce ?? config.detectors?.bruteForce?.enabled ?? true,
        loginPaths: (config as any).sensitiveAuthPaths ?? config.detectors?.bruteForce?.loginPaths,
        maxAttempts: (config as any).maxFailedLogins ?? config.detectors?.bruteForce?.maxAttempts,
        windowMs: (config as any).failedLoginWindowSec ? (config as any).failedLoginWindowSec * 1000 : config.detectors?.bruteForce?.windowMs,
        ...config.detectors?.bruteForce,
      },
      honeypot: {
        enabled: (config as any).enableHoneypots ?? config.detectors?.honeypot?.enabled ?? true,
        ...config.detectors?.honeypot,
      },
      rateAbuse: {
        enabled: (config as any).enableRateLimiting ?? config.detectors?.rateAbuse?.enabled ?? true,
        maxRequests: (config as any).maxRequestsPerSec ?? config.detectors?.rateAbuse?.maxRequests,
        ...config.detectors?.rateAbuse,
      },
      sqliXss: {
        enabled: (config as any).enableSqliXssFilter ?? config.detectors?.sqliXss?.enabled ?? true,
        ...config.detectors?.sqliXss,
      },
    };

    // Initialize Local Detectors
    this.bruteForceDetector = new BruteForceDetector(detectorsConfig.bruteForce);
    this.honeypotDetector = new HoneypotDetector(detectorsConfig.honeypot);
    this.rateAbuseDetector = new RateAbuseDetector(detectorsConfig.rateAbuse);
    this.sqliXssDetector = new SqliXssDetector(detectorsConfig.sqliXss);

    const syncIntervalMs = (config as any).syncIntervalSec
      ? (config as any).syncIntervalSec * 1000
      : this.config.syncIntervalMs;

    // Initialize Background Sync Worker
    this.syncWorker = new SyncWorker({
      apiKey: this.config.apiKey,
      hubUrl: this.config.hubUrl,
      siteName: this.config.siteName,
      cache: this.cache,
      syncIntervalMs: syncIntervalMs,
      heartbeatIntervalMs: this.config.heartbeatIntervalMs,
      enableSse: this.config.enableSse,
      enablePolling: this.config.enablePolling,
      enableHeartbeat: this.config.enableHeartbeat,
      enableReporting: this.config.enableReporting,
      logger: this.logger,
      onBlockReceived: (entry) => {
        this.config.onBlock?.(entry.ip, entry);
      },
    });
  }

  /**
   * Starts background synchronizers, real-time SSE mesh streams, and telemetry timers.
   */
  public async start(): Promise<void> {
    if (this.isStarted || this.config.enabled === false) return;
    this.isStarted = true;
    await this.syncWorker.start();
  }

  /**
   * Shuts down sync workers, timers, and cleans up open connections.
   */
  public async stop(): Promise<void> {
    if (!this.isStarted) return;
    this.isStarted = false;
    await this.syncWorker.stop();
    this.cache.destroy();
    this.bruteForceDetector.destroy();
    this.rateAbuseDetector.destroy();
  }

  /**
   * Core request inspection pipeline.
   * Runs in < 0.1ms for cached lookups and executes zero-allocation heuristic scans.
   */
  public inspect(contextOrReq: RequestContext | any): InspectionResult {
    // If agent is disabled, fail-safe open immediately
    if (this.config.enabled === false) {
      return { blocked: false, whitelisted: false, ip: '127.0.0.1' };
    }

    try {
      const context = this.normalizeRequestContext(contextOrReq);
      const ip = context.ip;

      // 1. Check Allowlist & Private / Loopback Immunity
      if (this.cache.isWhitelisted(ip)) {
        return {
          blocked: false,
          whitelisted: true,
          ip,
        };
      }

      // 2. Check High-Speed In-Memory Blocklist Cache (< 0.1ms)
      const existingBlock = this.cache.getBlockEntry(ip);
      if (existingBlock) {
        this.syncWorker.incrementMitigation();
        this.config.onBlock?.(ip, existingBlock, contextOrReq);
        return {
          blocked: this.config.blockAction !== 'log_only',
          whitelisted: false,
          threatDetected: false,
          category: existingBlock.category,
          reason: existingBlock.reason,
          confidence: existingBlock.confidence,
          ip,
          blockEntry: existingBlock,
        };
      }

      // 3. Local Heuristic Scans
      // 3a. Honeypot / Recon Probe Detector
      const honeypotResult = this.honeypotDetector.inspect(context);
      if (honeypotResult?.detected) {
        return this.handleThreatDetection(ip, honeypotResult, contextOrReq);
      }

      // 3b. Rate Abuse / Burst Detector
      const rateResult = this.rateAbuseDetector.inspect(context);
      if (rateResult?.detected) {
        return this.handleThreatDetection(ip, rateResult, contextOrReq);
      }

      // 3c. SQLi & XSS Heuristic Detector
      const sqliXssResult = this.sqliXssDetector.inspect(context);
      if (sqliXssResult?.detected) {
        return this.handleThreatDetection(ip, sqliXssResult, contextOrReq);
      }

      // 3d. Brute-Force Tracker
      const bruteForceResult = this.bruteForceDetector.inspect(context);
      if (bruteForceResult?.detected) {
        return this.handleThreatDetection(ip, bruteForceResult, contextOrReq);
      }

      // Passed all defenses cleanly
      return {
        blocked: false,
        whitelisted: false,
        threatDetected: false,
        ip,
      };
    } catch (err: any) {
      // Fail-Safe Guarantee: Never crash host application on unexpected error
      this.logger.error(`Error in request inspection pipeline: ${err?.message || err}`);
      return {
        blocked: false,
        whitelisted: false,
        ip: '127.0.0.1',
      };
    }
  }

  /**
   * Handles a freshly detected threat: caches the block, queues an anonymized report to Hub,
   * increments mitigation telemetry, and fires registered callbacks.
   */
  private handleThreatDetection(
    ip: string,
    detection: { category: ThreatCategory; confidence: number; reason: string; blockDurationMs?: number },
    reqContext?: any
  ): InspectionResult {
    this.totalThreatsDetected++;
    const now = Date.now();
    const duration = detection.blockDurationMs ?? this.config.defaultBlockTtlMs ?? 3_600_000;
    const expiresAt = now + duration;

    const blockEntry: BlockEntry = {
      ip,
      category: detection.category,
      confidence: detection.confidence,
      expiresAt,
      reason: detection.reason,
      source: 'local',
      createdAt: now,
    };

    // Store in local memory cache
    this.cache.block(ip, blockEntry);
    this.syncWorker.incrementMitigation();

    // Fire local threat report callback
    const reportPayload: ThreatReportPayload = {
      ip,
      category: detection.category,
      confidence: detection.confidence,
      details: {
        detectedAt: new Date().toISOString(),
      },
    };

    this.config.onThreatDetected?.(reportPayload);

    // Queue for Hub distribution
    this.syncWorker.queueThreatReport(reportPayload);

    // Fire block callback
    this.config.onBlock?.(ip, blockEntry, reqContext);

    this.logger.warn(`Threat Mitigated: [${detection.category.toUpperCase()}] IP: ${ip} - ${detection.reason}`);

    return {
      blocked: this.config.blockAction !== 'log_only',
      whitelisted: false,
      threatDetected: true,
      category: detection.category,
      reason: detection.reason,
      confidence: detection.confidence,
      ip,
      blockEntry,
    };
  }

  /**
   * Manually records an authentication or login failure for an IP (e.g. from an Express 401 response).
   */
  public recordFailedAttempt(ip: string, _category: ThreatCategory = 'brute_force'): void {
    const normIp = normalizeIp(ip);
    if (!normIp || this.cache.isWhitelisted(normIp)) return;

    const detection = this.bruteForceDetector.recordFailure(normIp);
    if (detection?.detected) {
      this.handleThreatDetection(normIp, detection);
    }
  }

  /**
   * Records a manual mitigation count.
   */
  public recordMitigation(_ip: string, _category: ThreatCategory = 'manual_block'): void {
    this.syncWorker.incrementMitigation();
  }

  /**
   * Manually blocks an IP address with customizable TTL and metadata.
   */
  public block(ip: string, options: Partial<BlockEntry> = {}): void {
    const normIp = normalizeIp(ip);
    if (!normIp) return;

    this.cache.block(normIp, {
      ...options,
      ip: normIp,
      category: options.category || 'manual_block',
      confidence: options.confidence ?? 1.0,
      reason: options.reason || 'Manually added to local blocklist',
    });
  }

  /**
   * Manually unblocks an IP.
   */
  public unblock(ip: string): boolean {
    return this.cache.unblock(ip);
  }

  /**
   * Checks whether an IP is currently blocked.
   */
  public isBlocked(ip: string): boolean {
    return this.cache.isBlocked(ip);
  }

  /**
   * Adds an IP or CIDR to the whitelist.
   */
  public whitelist(ipOrCidr: string, description?: string, expiresAt?: number): void {
    this.cache.addWhitelist(ipOrCidr, description, expiresAt);
  }

  /**
   * Removes an IP or CIDR from the whitelist.
   */
  public removeWhitelist(ipOrCidr: string): boolean {
    return this.cache.removeWhitelist(ipOrCidr);
  }

  /**
   * Checks whether an IP is whitelisted.
   */
  public isWhitelisted(ip: string): boolean {
    return this.cache.isWhitelisted(ip);
  }

  /**
   * Dispatches a custom threat report directly to the Hub.
   */
  public reportThreat(report: ThreatReportPayload): void {
    this.syncWorker.queueThreatReport(report);
  }

  /**
   * Extracts client IP using configured trust proxy rules and extractors.
   */
  public extractIp(req: any): string {
    return extractClientIp(req, this.config.trustProxy, this.config.customIpExtractor);
  }

  /**
   * Returns comprehensive operational statistics of the agent.
   */
  public getStats(): AgentStats {
    const syncState = this.syncWorker.getState();
    const cacheStats = this.cache.getStats();

    return {
      siteName: this.config.siteName,
      agentVersion: '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalMitigations: syncState.totalMitigations,
      totalThreatsDetected: this.totalThreatsDetected,
      activeBlocks: cacheStats.activeBlocks,
      whitelistedIps: cacheStats.whitelistedRules,
      sseConnected: syncState.sseConnected,
      lastSyncTime: syncState.lastSyncTime,
      lastHeartbeatTime: syncState.lastHeartbeatTime,
      cache: cacheStats,
    };
  }

  /**
   * Normalizes disparate request objects (Node HTTP, Express, Fastify, Next.js Request)
   * into a uniform `RequestContext`.
   */
  private normalizeRequestContext(req: any): RequestContext {
    if (!req) {
      return { ip: '127.0.0.1', path: '/', method: 'GET', headers: {} };
    }

    // Already a normalized RequestContext
    if (typeof req.ip === 'string' && typeof req.path === 'string' && typeof req.headers === 'object' && !req.socket) {
      return req as RequestContext;
    }

    const ip = this.extractIp(req);
    const path = req.path || req.pathname || (req.url ? req.url.split('?')[0] : '/') || '/';
    const method = (req.method || 'GET').toUpperCase();
    const headers = req.headers || {};
    const query = req.query || this.extractQuery(req.url);
    const body = req.body;
    const url = req.url || path;
    const originalUrl = req.originalUrl || url;

    return {
      ip,
      path,
      method,
      headers,
      query,
      body,
      url,
      originalUrl,
    };
  }

  private extractQuery(rawUrl?: string): Record<string, string> | undefined {
    if (!rawUrl || !rawUrl.includes('?')) return undefined;
    try {
      const qIndex = rawUrl.indexOf('?');
      const search = rawUrl.substring(qIndex + 1);
      const params = new URLSearchParams(search);
      const res: Record<string, string> = {};
      params.forEach((v, k) => {
        res[k] = v;
      });
      return res;
    } catch {
      return undefined;
    }
  }
}
