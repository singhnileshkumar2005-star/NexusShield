/**
 * NexusSecure Universal Agent SDK
 * Collaborative, Privacy-Preserving Attack-Defense Network for Modern Web Applications.
 */

// Core Agent
export { NexusAgent } from './agent.js';

// In-Memory Cache
export { CacheOptions, MemoryCache } from './cache.js';

// Background Sync Worker
export { SyncWorker, SyncWorkerOptions } from './sync.js';

// Local Heuristic Detectors
export {
  BruteForceDetector,
  DEFAULT_HONEYPOT_PATHS,
  Detector,
  HoneypotDetector,
  RateAbuseDetector,
  SQLI_PATTERNS,
  SlidingWindowCounter,
  SqliXssDetector,
  XSS_PATTERNS,
} from './detectors/index.js';

// Framework Middlewares
export {
  NexusExpressMiddleware,
  NexusExpressOptions,
  nexusSecureExpress,
} from './middleware/express.js';
export {
  NexusFastifyOptions,
  nexusSecureFastify,
} from './middleware/fastify.js';
export {
  HttpHandler,
  NexusHttpOptions,
  createNexusSecureHttpWrapper,
  nexusSecureHttp,
} from './middleware/http.js';
export {
  NexusNextOptions,
  getOrCreateNextAgent,
  inspectNextRequest,
  nexusSecureNext,
} from './middleware/next.js';

// IP & Network Utilities
export {
  PRIVATE_AND_LOOPBACK_RANGES,
  extractClientIp,
  ipInCidr,
  ipv4ToNumber,
  ipv6ToBigInt,
  isPrivateOrLoopbackIp,
  matchIpAgainstList,
  normalizeIp,
} from './utils/ip.js';

// Logger
export { Logger } from './utils/logger.js';

// Types
export type {
  AgentConfig,
  AgentStats,
  BlockEntry,
  BruteForceDetectorConfig,
  CacheStats,
  DetectionResult,
  DetectorsConfig,
  HeartbeatPayload,
  HoneypotDetectorConfig,
  HubBlockItem,
  InspectionResult,
  LogLevel,
  LoggerInterface,
  RateAbuseDetectorConfig,
  RequestContext,
  SlidingWindowConfig,
  SqliXssDetectorConfig,
  ThreatCategory,
  ThreatReportPayload,
  WhitelistEntry,
} from './types.js';
