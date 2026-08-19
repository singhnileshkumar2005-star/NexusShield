/**
 * NexusSecure Universal Agent SDK - Types & Interface Definitions
 * High-performance, collaborative threat intelligence mesh for modern web applications.
 */

/**
 * Standardized threat classification categories recognized across the NexusSecure Mesh.
 */
export type ThreatCategory =
  | 'brute_force'
  | 'honeypot_probe'
  | 'rate_abuse'
  | 'sqli_xss'
  | 'scanner'
  | 'manual_block'
  | (string & {});

/**
 * Represents an active blocked IP entry stored in the local memory cache.
 */
export interface BlockEntry {
  /** Attacker IP address (IPv4 or IPv6) */
  ip: string;
  /** Primary category responsible for the block */
  category: ThreatCategory;
  /** Confidence score between 0.00 and 1.00 */
  confidence: number;
  /** Expiration timestamp in milliseconds since UNIX epoch */
  expiresAt: number;
  /** Human-readable rationale or detector trigger details */
  reason?: string;
  /** Number of independent mesh nodes corroborating this threat (if received from Hub) */
  corroborationCount?: number;
  /** Origin of this block record */
  source?: 'local' | 'hub_sse' | 'hub_poll' | 'manual';
  /** Creation timestamp in milliseconds */
  createdAt?: number;
}

/**
 * Represents an IP or CIDR range exempt from blocking.
 */
export interface WhitelistEntry {
  /** IP address (e.g. "127.0.0.1") or CIDR range (e.g. "10.0.0.0/8") */
  ipOrCidr: string;
  /** Optional descriptive label or owner */
  description?: string;
  /** Expiration timestamp in milliseconds (optional, 0 or undefined for permanent) */
  expiresAt?: number;
}

/**
 * Payload sent to Hub /v1/report when a local heuristic detects malicious behavior.
 * Preserves strict victim anonymity: never sends URLs, parameter values, or victim identities.
 */
export interface ThreatReportPayload {
  /** Attacker IP address */
  ip: string;
  /** Threat category */
  category: ThreatCategory;
  /** Confidence score (0.0 to 1.0) */
  confidence: number;
  /** Optional high-level metadata (sanitized, non-identifying) */
  details?: {
    method?: string;
    detectedAt?: string;
    subCategory?: string;
    [key: string]: any;
  };
}

/**
 * Payload sent to Hub /v1/heartbeat to maintain node liveness & aggregate telemetry.
 */
export interface HeartbeatPayload {
  /** API key of the member site */
  apiKey: string;
  /** Total number of attacks mitigated since agent startup */
  totalMitigations: number;
  /** Agent SDK semantic version */
  agentVersion: string;
  /** Agent uptime in seconds */
  uptimeSeconds: number;
  /** Number of active blocked IPs held in memory */
  activeBlocklistSize: number;
  /** System memory usage in megabytes */
  memoryUsageMb?: number;
  /** Optional site name or identifier */
  siteName?: string;
}

/**
 * Hub SSE / Poll Block Item format received from the Hub server.
 */
export interface HubBlockItem {
  ip: string;
  category: ThreatCategory;
  confidence: number;
  expires_at: string | number;
  corroboration_count?: number;
  reason?: string;
}

/**
 * Logging interface for custom logging integrations.
 */
export interface LoggerInterface {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Logging verbosity levels.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Normalized HTTP request context evaluated by detectors.
 */
export interface RequestContext {
  /** Client IP address */
  ip: string;
  /** Request path (e.g. "/api/v1/users" or "/.env") */
  path: string;
  /** HTTP method (e.g. "GET", "POST") */
  method: string;
  /** HTTP headers (lowercase keys) */
  headers: Record<string, string | string[] | undefined>;
  /** Parsed query parameters or query string */
  query?: Record<string, any> | string;
  /** Parsed request body or raw string body */
  body?: any;
  /** Full URL if available */
  url?: string;
  /** Original untampered path before routing */
  originalUrl?: string;
}

/**
 * Detection verdict emitted by a local detector.
 */
export interface DetectionResult {
  /** True if detector flagged this request as malicious */
  detected: boolean;
  /** Category of the detected threat */
  category: ThreatCategory;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  /** Detailed reason explaining the heuristic trigger */
  reason: string;
  /** Suggested block duration in milliseconds */
  blockDurationMs?: number;
}

/**
 * Result of inspecting an incoming request via `agent.inspect(req)`.
 */
export interface InspectionResult {
  /** Whether the request must be blocked (403 Forbidden) */
  blocked: boolean;
  /** Whether the client IP is in the local or private allowlist */
  whitelisted: boolean;
  /** Whether an active threat was newly detected during this request */
  threatDetected?: boolean;
  /** Threat category if blocked or detected */
  category?: ThreatCategory;
  /** Human-readable explanation */
  reason?: string;
  /** Confidence score */
  confidence?: number;
  /** Client IP address evaluated */
  ip: string;
  /** Block entry metadata if blocked */
  blockEntry?: BlockEntry;
}

/**
 * Sliding window rate limit and brute-force tracker configuration.
 */
export interface SlidingWindowConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum allowed occurrences within the window */
  maxCount: number;
}

/**
 * Configuration options for Brute Force Detector.
 */
export interface BruteForceDetectorConfig {
  /** Enable or disable brute force detector (default: true) */
  enabled?: boolean;
  /** Max failed attempts allowed before temporary block (default: 5) */
  maxAttempts?: number;
  /** Time window in milliseconds to track failed attempts (default: 60,000ms / 1 min) */
  windowMs?: number;
  /** Duration in milliseconds to block the offending IP (default: 1,800,000ms / 30 mins) */
  blockDurationMs?: number;
  /** Sensitive auth paths to monitor (e.g. ['/api/auth/login', '/login', '/wp-login.php']) */
  loginPaths?: string[];
  /** HTTP status codes that indicate authentication failure (default: [401, 403]) */
  failureStatusCodes?: number[];
}

/**
 * Configuration options for Honeypot Trap Detector.
 */
export interface HoneypotDetectorConfig {
  /** Enable or disable honeypot detector (default: true) */
  enabled?: boolean;
  /** Custom list of honeypot / recon paths to trap */
  trapPaths?: string[];
  /** Whether to perform case-sensitive path matching (default: false) */
  caseSensitive?: boolean;
  /** Duration in milliseconds to block offending IP (default: 86,400,000ms / 24 hours) */
  blockDurationMs?: number;
}

/**
 * Configuration options for Burst / Rate Abuse Detector.
 */
export interface RateAbuseDetectorConfig {
  /** Enable or disable rate abuse detector (default: true) */
  enabled?: boolean;
  /** Maximum requests allowed per window (default: 50 req/sec) */
  maxRequests?: number;
  /** Sliding window duration in milliseconds (default: 1,000ms / 1 sec) */
  windowMs?: number;
  /** Duration to block abusive IP (default: 600,000ms / 10 mins) */
  blockDurationMs?: number;
}

/**
 * Configuration options for SQL Injection and XSS Pattern Detector.
 */
export interface SqliXssDetectorConfig {
  /** Enable or disable SQLi/XSS pattern inspection (default: true) */
  enabled?: boolean;
  /** Whether to inspect query parameters (default: true) */
  inspectQueryParams?: boolean;
  /** Whether to inspect HTTP headers (default: true) */
  inspectHeaders?: boolean;
  /** Whether to inspect URL path (default: true) */
  inspectPath?: boolean;
  /** Whether to inspect request body if present (default: true) */
  inspectBody?: boolean;
  /** Duration in milliseconds to block offending IP (default: 3,600,000ms / 1 hour) */
  blockDurationMs?: number;
  /** Custom additional regex patterns to flag */
  customPatterns?: RegExp[];
}

/**
 * Overall detectors configuration group.
 */
export interface DetectorsConfig {
  bruteForce?: BruteForceDetectorConfig;
  honeypot?: HoneypotDetectorConfig;
  rateAbuse?: RateAbuseDetectorConfig;
  sqliXss?: SqliXssDetectorConfig;
}

/**
 * Comprehensive Agent configuration.
 */
export interface AgentConfig {
  /** API key issued by the NexusSecure Hub */
  apiKey: string;
  /** Base URL of the NexusSecure Hub (e.g. "https://hub.nexussecure.network") */
  hubUrl?: string;
  /** Optional human-readable site name */
  siteName?: string;
  /** Master switch to enable or disable the agent (default: true) */
  enabled?: boolean;
  /** Interval in milliseconds for polling blocklist updates (default: 60,000ms / 60s) */
  syncIntervalMs?: number;
  /** Interval in milliseconds for sending telemetry heartbeat (default: 30,000ms / 30s) */
  heartbeatIntervalMs?: number;
  /** Maximum number of block entries to store in LRU cache (default: 50,000) */
  maxCacheSize?: number;
  /** Default block duration in milliseconds for local detections (default: 3,600,000ms / 1h) */
  defaultBlockTtlMs?: number;
  /** Custom user-provided IP addresses or CIDR ranges to always allow */
  whitelist?: string[];
  /** Whether to trust proxy headers (e.g. X-Forwarded-For, CF-Connecting-IP) (default: true) */
  trustProxy?: boolean | number | string[];
  /** Custom IP extractor function */
  customIpExtractor?: (req: any) => string | undefined;
  /** Logging verbosity level (default: 'info') */
  logLevel?: LogLevel;
  /** Custom logger implementation */
  logger?: LoggerInterface;
  /** Action to take when a request is blocked: 'block' (403), 'log_only', or 'custom' */
  blockAction?: 'block' | 'log_only' | 'custom';
  /** Custom block response handler */
  customBlockResponse?: (req: any, res: any, blockInfo: BlockEntry) => void | Promise<void>;
  /** Granular configuration for built-in threat detectors */
  detectors?: DetectorsConfig;
  /** Callback fired when an IP is blocked */
  onBlock?: (ip: string, entry: BlockEntry, req?: any) => void;
  /** Callback fired when a threat heuristic fires */
  onThreatDetected?: (report: ThreatReportPayload) => void;
  /** Enable or disable real-time SSE stream (default: true) */
  enableSse?: boolean;
  /** Enable or disable fallback polling (default: true) */
  enablePolling?: boolean;
  /** Enable or disable heartbeat telemetry (default: true) */
  enableHeartbeat?: boolean;
  /** Enable or disable automated threat reporting to Hub (default: true) */
  enableReporting?: boolean;
}

/**
 * Cache metrics and telemetry counters.
 */
export interface CacheStats {
  totalEntries: number;
  activeBlocks: number;
  expiredEntries: number;
  whitelistedRules: number;
  lookupCount: number;
  hitCount: number;
  missCount: number;
  prunedCount: number;
}

/**
 * Overall Agent runtime statistics.
 */
export interface AgentStats {
  siteName?: string;
  agentVersion: string;
  uptimeSeconds: number;
  totalMitigations: number;
  totalThreatsDetected: number;
  activeBlocks: number;
  whitelistedIps: number;
  sseConnected: boolean;
  lastSyncTime: number | null;
  lastHeartbeatTime: number | null;
  cache: CacheStats;
}
