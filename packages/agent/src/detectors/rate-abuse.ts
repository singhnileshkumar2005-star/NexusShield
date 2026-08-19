/**
 * NexusSecure Threat Detector: Rate Abuse & DoS Burst Detection
 * Sliding-window tracker identifying aggressive request flooding from a single origin.
 */
import { DetectionResult, RateAbuseDetectorConfig, RequestContext, ThreatCategory } from '../types.js';
import { normalizeIp } from '../utils/ip.js';
import { Detector, SlidingWindowCounter } from './base.js';

export class RateAbuseDetector implements Detector {
  public readonly name = 'RateAbuseDetector';
  public readonly category: ThreatCategory = 'rate_abuse';

  private readonly enabled: boolean;
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;
  private readonly tracker: SlidingWindowCounter;

  constructor(config: RateAbuseDetectorConfig = {}) {
    this.enabled = config.enabled ?? true;
    this.maxRequests = config.maxRequests ?? 50; // 50 requests
    this.windowMs = config.windowMs ?? 1_000; // per 1 second
    this.blockDurationMs = config.blockDurationMs ?? 600_000; // 10 minutes

    this.tracker = new SlidingWindowCounter(this.windowMs, this.maxRequests);
  }

  /**
   * Evaluates request frequency for the client IP.
   */
  public inspect(context: RequestContext): DetectionResult | null {
    if (!this.enabled) return null;
    const ip = normalizeIp(context.ip);
    if (!ip) return null;

    const { count, exceeded } = this.tracker.hit(ip);

    if (exceeded) {
      return {
        detected: true,
        category: this.category,
        confidence: 0.88,
        reason: `Rate limit burst exceeded: ${count} requests in ${this.windowMs}ms (threshold: ${this.maxRequests})`,
        blockDurationMs: this.blockDurationMs,
      };
    }

    return null;
  }

  public reset(): void {
    this.tracker.clear();
  }

  public destroy(): void {
    this.tracker.destroy();
  }
}
