import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Configuration options for NexusShield WAF middleware.
 */
export interface NexusWafConfig {
  /**
   * Unique client/tenant identifier used for multi-tenant telemetry and logging.
   * @default 'default' (or process.env.CLIENT_ID)
   */
  clientId?: string;

  /**
   * URL of the Central Threat Hub.
   * @default 'http://127.0.0.1:8000' (or process.env.HUB_URL)
   */
  hubUrl?: string;

  /**
   * API Key for authenticating reports and telemetry to the Central Threat Hub.
   * @default 'nexus_dev_key_2026' (or process.env.NEXUS_API_KEY)
   */
  apiKey?: string;
}

/**
 * ThreatShield middleware function interface with attached utility functions and state.
 */
export interface ThreatShieldWaf {
  /**
   * Creates configured WAF middleware instance.
   * @param options Configuration object or client ID string.
   */
  (options?: NexusWafConfig | string): RequestHandler;

  /**
   * Directly handles an Express request as default WAF middleware.
   */
  (req: Request, res: Response, next: NextFunction): void;

  /**
   * Factory method to create a new WAF middleware handler.
   */
  createWafInstance(config?: NexusWafConfig | string): RequestHandler;

  /**
   * Default pre-configured WAF middleware instance.
   */
  wafMiddleware: RequestHandler;

  /**
   * Synchronizes the local in-memory blocked IP set with the Central Threat Hub.
   */
  syncBlocklist(hubUrl?: string, apiKey?: string): Promise<void>;

  /**
   * Alias for syncBlocklist.
   */
  fetchGlobalBlocklist(hubUrl?: string, apiKey?: string): Promise<void>;

  /**
   * In-memory Set of currently blocked IP addresses.
   */
  blockedIPs: Set<string>;

  /**
   * Alias for blockedIPs set.
   */
  localBlockedIPs: Set<string>;

  /**
   * Normalizes client IP addresses (stripping IPv6 mapping and localhost variants).
   */
  normalizeIP(rawIp?: string | null): string;

  /**
   * Inspects request URL, query, body, and headers for SQLi, XSS, and Path Traversal vectors.
   * @returns Detected threat vector name, or null if clean.
   */
  detectThreatVector(req: Request | any): string | null;
}

declare const threatShield: ThreatShieldWaf;

export default threatShield;
export = threatShield;
