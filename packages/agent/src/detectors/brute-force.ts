/**
 * NexusSecure Threat Detector: Brute Force & Credential Stuffing
 * Tracks failed authentication attempts across a sliding time window per IP.
 */
import { BruteForceDetectorConfig, DetectionResult, RequestContext, ThreatCategory } from '../types.js';
import { normalizeIp } from '../utils/ip.js';
import { Detector, SlidingWindowCounter } from './base.js';

const DEFAULT_LOGIN_PATHS: readonly string[] = [
  '/login',
  '/signin',
  '/api/login',
  '/api/signin',
  '/api/auth/login',
  '/api/auth/signin',
  '/api/auth/token',
  '/oauth/token',
  '/wp-login.php',
  '/admin/login',
  '/user/login',
  '/auth/session',
  '/session',
];

export class BruteForceDetector implements Detector {
  public readonly name = 'BruteForceDetector';
  public readonly category: ThreatCategory = 'brute_force';

  private readonly enabled: boolean;
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;
  private readonly loginPaths: string[];
  private readonly failureStatusCodes: Set<number>;
  private readonly counter: SlidingWindowCounter;

  constructor(config: BruteForceDetectorConfig = {}) {
    this.enabled = config.enabled ?? true;
    this.maxAttempts = config.maxAttempts ?? 5;
    this.windowMs = config.windowMs ?? 60_000; // 60s
    this.blockDurationMs = config.blockDurationMs ?? 1_800_000; // 30 minutes
    this.loginPaths = (config.loginPaths || DEFAULT_LOGIN_PATHS).map((p) => p.toLowerCase());
    this.failureStatusCodes = new Set(config.failureStatusCodes ?? [401, 403]);

    this.counter = new SlidingWindowCounter(this.windowMs, this.maxAttempts);
  }

  /**
   * Checks whether a request path matches known authentication/login endpoints.
   */
  public isAuthPath(path: string): boolean {
    if (!path) return false;
    const lowerPath = path.toLowerCase();
    return this.loginPaths.some((p) => lowerPath === p || lowerPath.startsWith(p + '/') || lowerPath.includes(p));
  }

  /**
   * Records a failed authentication attempt for an IP.
   * Can be invoked directly from auth handlers or response listeners.
   */
  public recordFailure(ip: string): DetectionResult | null {
    if (!this.enabled) return null;
    const normIp = normalizeIp(ip);
    if (!normIp) return null;

    const { count, exceeded } = this.counter.hit(normIp);

    if (exceeded) {
      return {
        detected: true,
        category: this.category,
        confidence: 0.92,
        reason: `Exceeded failed authentication attempt threshold (${count}/${this.maxAttempts} in ${this.windowMs / 1000}s)`,
        blockDurationMs: this.blockDurationMs,
      };
    }

    return null;
  }

  /**
   * Evaluates request context against brute-force rules.
   */
  public inspect(context: RequestContext): DetectionResult | null {
    if (!this.enabled) return null;
    const normIp = normalizeIp(context.ip);
    if (!normIp) return null;

    // Check if the current IP has already exceeded the threshold
    const currentCount = this.counter.getCount(normIp);
    if (currentCount >= this.maxAttempts) {
      return {
        detected: true,
        category: this.category,
        confidence: 0.92,
        reason: `Exceeded failed authentication attempt threshold (${currentCount}/${this.maxAttempts} in ${this.windowMs / 1000}s)`,
        blockDurationMs: this.blockDurationMs,
      };
    }

    return null;
  }

  public reset(): void {
    this.counter.clear();
  }

  public destroy(): void {
    this.counter.destroy();
  }
}
