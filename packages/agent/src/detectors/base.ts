/**
 * NexusSecure Threat Detectors - Base Interfaces & Sliding Window Counter
 */
import { DetectionResult, RequestContext, ThreatCategory } from '../types.js';

export interface Detector {
  readonly name: string;
  readonly category: ThreatCategory;
  inspect(context: RequestContext): DetectionResult | null;
  reset?(): void;
  destroy?(): void;
}

/**
 * Highly optimized In-Memory Sliding Window Counter per IP address.
 * Automatically evicts stale timestamp buckets to prevent memory accumulation.
 */
export class SlidingWindowCounter {
  private readonly windowMs: number;
  private readonly maxCount: number;
  private readonly ipTimestamps: Map<string, number[]> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(windowMs: number, maxCount: number, autoCleanupIntervalMs = 60_000) {
    this.windowMs = windowMs;
    this.maxCount = maxCount;

    if (autoCleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, autoCleanupIntervalMs);
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  /**
   * Records an occurrence for a given IP and returns the current count within the sliding window.
   */
  public hit(ip: string): { count: number; exceeded: boolean } {
    const now = Date.now();
    const threshold = now - this.windowMs;

    let timestamps = this.ipTimestamps.get(ip);
    if (!timestamps) {
      timestamps = [];
      this.ipTimestamps.set(ip, timestamps);
    }

    // Filter out old timestamps
    let validStart = 0;
    while (validStart < timestamps.length && timestamps[validStart]! <= threshold) {
      validStart++;
    }

    if (validStart > 0) {
      timestamps.splice(0, validStart);
    }

    // Record new event
    timestamps.push(now);
    const count = timestamps.length;
    const exceeded = count >= this.maxCount;

    return { count, exceeded };
  }

  /**
   * Gets the active count for an IP without recording a new hit.
   */
  public getCount(ip: string): number {
    const timestamps = this.ipTimestamps.get(ip);
    if (!timestamps || timestamps.length === 0) return 0;

    const threshold = Date.now() - this.windowMs;
    let validCount = 0;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i]! > threshold) {
        validCount++;
      } else {
        break;
      }
    }
    return validCount;
  }

  /**
   * Resets counter for a specific IP.
   */
  public resetIp(ip: string): void {
    this.ipTimestamps.delete(ip);
  }

  /**
   * Cleans up expired entries from the tracker map.
   */
  public cleanup(): void {
    const threshold = Date.now() - this.windowMs;
    for (const [ip, timestamps] of this.ipTimestamps.entries()) {
      const valid = timestamps.filter((t) => t > threshold);
      if (valid.length === 0) {
        this.ipTimestamps.delete(ip);
      } else {
        this.ipTimestamps.set(ip, valid);
      }
    }
  }

  /**
   * Clears all tracking state.
   */
  public clear(): void {
    this.ipTimestamps.clear();
  }

  /**
   * Cleans up background interval timers.
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}
