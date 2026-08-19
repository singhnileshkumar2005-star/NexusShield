/**
 * NexusSecure In-Memory Blocklist & Allowlist Cache
 * Ultra-high-speed (< 0.1ms) LRU + TTL cache designed for low-latency request filtering.
 */
import { BlockEntry, CacheStats, WhitelistEntry } from './types.js';
import { isPrivateOrLoopbackIp, matchIpAgainstList, normalizeIp } from './utils/ip.js';
import { Logger } from './utils/logger.js';

export interface CacheOptions {
  /** Maximum number of block entries stored in memory before LRU eviction (default: 50,000) */
  maxSize?: number;
  /** Auto-prune interval in milliseconds (default: 30,000ms / 30s) */
  pruneIntervalMs?: number;
  /** Initial custom whitelist rules (IPs or CIDRs) */
  initialWhitelist?: string[];
  /** Logger instance */
  logger?: Logger;
}

export class MemoryCache {
  private readonly maxSize: number;
  private readonly logger?: Logger;
  private readonly pruneIntervalMs: number;
  private pruneTimer: NodeJS.Timeout | null = null;

  // Blocklist storage: Map<normalizedIp, BlockEntry>
  // JavaScript Map maintains insertion order, which enables true O(1) LRU caching.
  private readonly blocks: Map<string, BlockEntry> = new Map();

  // Whitelist storage: Map<ipOrCidr, WhitelistEntry>
  private readonly whitelists: Map<string, WhitelistEntry> = new Map();

  // Cache telemetry counters
  private lookupCount = 0;
  private hitCount = 0;
  private missCount = 0;
  private prunedCount = 0;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 50_000;
    this.pruneIntervalMs = options.pruneIntervalMs ?? 30_000;
    this.logger = options.logger;

    // Load initial whitelist entries
    if (options.initialWhitelist && Array.isArray(options.initialWhitelist)) {
      for (const item of options.initialWhitelist) {
        this.addWhitelist(item, 'Initial configuration whitelist');
      }
    }

    // Start background TTL cleaner
    if (this.pruneIntervalMs > 0) {
      this.pruneTimer = setInterval(() => {
        this.pruneExpired();
      }, this.pruneIntervalMs);
      // Unref timer so Node process isn't kept alive artificially
      if (this.pruneTimer.unref) {
        this.pruneTimer.unref();
      }
    }
  }

  /**
   * Ultra-fast (< 0.1ms) check whether an IP is currently blocked.
   * Automatically respects whitelists, loopback, private networks, and TTL expiry.
   */
  public isBlocked(ip: string): boolean {
    this.lookupCount++;
    const normIp = normalizeIp(ip);
    if (!normIp) return false;

    // Fast-path: Check allowlist & private loopback first
    if (this.isWhitelisted(normIp)) {
      return false;
    }

    const entry = this.blocks.get(normIp);
    if (!entry) {
      this.missCount++;
      return false;
    }

    // Check TTL expiration
    const now = Date.now();
    if (entry.expiresAt && entry.expiresAt <= now) {
      // Lazy eviction of expired entry
      this.blocks.delete(normIp);
      this.prunedCount++;
      this.missCount++;
      return false;
    }

    // LRU touch: promote to most recently used
    this.blocks.delete(normIp);
    this.blocks.set(normIp, entry);

    this.hitCount++;
    return true;
  }

  /**
   * Retrieves active BlockEntry for an IP, or undefined if not blocked / expired.
   */
  public getBlockEntry(ip: string): BlockEntry | undefined {
    const normIp = normalizeIp(ip);
    if (!normIp) return undefined;

    if (this.isWhitelisted(normIp)) {
      return undefined;
    }

    const entry = this.blocks.get(normIp);
    if (!entry) return undefined;

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.blocks.delete(normIp);
      this.prunedCount++;
      return undefined;
    }

    // LRU touch
    this.blocks.delete(normIp);
    this.blocks.set(normIp, entry);
    return entry;
  }

  /**
   * Adds or updates a blocked IP entry in the cache.
   */
  public block(ip: string, entryData: Partial<BlockEntry>): void {
    const normIp = normalizeIp(ip);
    if (!normIp) return;

    // Never block whitelisted or private/loopback IPs
    if (this.isWhitelisted(normIp)) {
      this.logger?.debug(`Ignored block request for whitelisted IP: ${normIp}`);
      return;
    }

    const now = Date.now();
    const entry: BlockEntry = {
      ip: normIp,
      category: entryData.category || 'manual_block',
      confidence: entryData.confidence ?? 0.9,
      expiresAt: entryData.expiresAt ?? now + 3600_000, // Default 1 hour
      reason: entryData.reason || 'Local threat detection',
      corroborationCount: entryData.corroborationCount ?? 1,
      source: entryData.source || 'local',
      createdAt: entryData.createdAt ?? now,
    };

    // If entry already expired, discard
    if (entry.expiresAt <= now) {
      return;
    }

    // LRU eviction if capacity reached
    if (!this.blocks.has(normIp) && this.blocks.size >= this.maxSize) {
      const oldestKey = this.blocks.keys().next().value;
      if (oldestKey !== undefined) {
        this.blocks.delete(oldestKey);
      }
    }

    // Re-set to update order
    this.blocks.delete(normIp);
    this.blocks.set(normIp, entry);

    this.logger?.debug(`Blocked IP: ${normIp} (Expires: ${new Date(entry.expiresAt).toISOString()}, Reason: ${entry.reason})`);
  }

  /**
   * Removes an IP from the blocklist.
   * Returns true if the IP was found and removed.
   */
  public unblock(ip: string): boolean {
    const normIp = normalizeIp(ip);
    if (!normIp) return false;
    const removed = this.blocks.delete(normIp);
    if (removed) {
      this.logger?.debug(`Unblocked IP: ${normIp}`);
    }
    return removed;
  }

  /**
   * Checks whether an IP is whitelisted (local rule, custom CIDR, or private/loopback).
   */
  public isWhitelisted(ip: string): boolean {
    const normIp = normalizeIp(ip);
    if (!normIp) return false;

    // 1. Automatic RFC private and loopback immunity
    if (isPrivateOrLoopbackIp(normIp)) {
      return true;
    }

    // 2. Direct exact match in custom whitelist
    if (this.whitelists.has(normIp)) {
      const entry = this.whitelists.get(normIp);
      if (entry && (!entry.expiresAt || entry.expiresAt > Date.now())) {
        return true;
      }
    }

    // 3. Subnet / CIDR list match
    const now = Date.now();
    const activeCidrs: string[] = [];
    for (const [cidr, entry] of this.whitelists.entries()) {
      if (!entry.expiresAt || entry.expiresAt > now) {
        activeCidrs.push(cidr);
      }
    }

    return matchIpAgainstList(normIp, activeCidrs);
  }

  /**
   * Adds an IP or CIDR range to the local whitelist.
   */
  public addWhitelist(ipOrCidr: string, description?: string, expiresAt?: number): void {
    const norm = normalizeIp(ipOrCidr);
    if (!norm) return;

    this.whitelists.set(norm, {
      ipOrCidr: norm,
      description: description || 'Local whitelist entry',
      expiresAt: expiresAt && expiresAt > 0 ? expiresAt : undefined,
    });

    // If this IP was previously blocked, unblock it immediately
    this.blocks.delete(norm);
    this.logger?.debug(`Added whitelist rule: ${norm}`);
  }

  /**
   * Removes an IP or CIDR from the whitelist.
   */
  public removeWhitelist(ipOrCidr: string): boolean {
    const norm = normalizeIp(ipOrCidr);
    if (!norm) return false;
    return this.whitelists.delete(norm);
  }

  /**
   * Returns a copy of all active whitelist entries.
   */
  public getWhitelists(): WhitelistEntry[] {
    const now = Date.now();
    const result: WhitelistEntry[] = [];
    for (const entry of this.whitelists.values()) {
      if (!entry.expiresAt || entry.expiresAt > now) {
        result.push({ ...entry });
      }
    }
    return result;
  }

  /**
   * Bulk loads a list of block entries (e.g. from Hub poll or initial seed).
   */
  public loadBlocklist(entries: BlockEntry[]): void {
    if (!entries || !Array.isArray(entries)) return;
    const now = Date.now();

    for (const item of entries) {
      if (!item || !item.ip) continue;
      const normIp = normalizeIp(item.ip);
      if (!normIp || this.isWhitelisted(normIp)) continue;

      const exp = typeof item.expiresAt === 'number' ? item.expiresAt : now + 3600_000;
      if (exp <= now) continue;

      this.block(normIp, {
        ...item,
        ip: normIp,
        expiresAt: exp,
        source: item.source || 'hub_poll',
      });
    }
  }

  /**
   * Prunes expired blocklist and whitelist entries.
   * Returns total count of pruned entries.
   */
  public pruneExpired(): number {
    const now = Date.now();
    let pruned = 0;

    // Prune blocks
    for (const [ip, entry] of this.blocks.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.blocks.delete(ip);
        pruned++;
      }
    }

    // Prune whitelists
    for (const [ipOrCidr, entry] of this.whitelists.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.whitelists.delete(ipOrCidr);
      }
    }

    this.prunedCount += pruned;
    if (pruned > 0) {
      this.logger?.debug(`Pruned ${pruned} expired blocklist entries.`);
    }
    return pruned;
  }

  /**
   * Returns high-precision telemetry statistics of the cache.
   */
  public getStats(): CacheStats {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const entry of this.blocks.values()) {
      if (!entry.expiresAt || entry.expiresAt > now) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      totalEntries: this.blocks.size,
      activeBlocks: active,
      expiredEntries: expired,
      whitelistedRules: this.whitelists.size,
      lookupCount: this.lookupCount,
      hitCount: this.hitCount,
      missCount: this.missCount,
      prunedCount: this.prunedCount,
    };
  }

  /**
   * Clears all blocks and custom whitelists.
   */
  public clear(): void {
    this.blocks.clear();
    this.whitelists.clear();
    this.lookupCount = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.prunedCount = 0;
  }

  /**
   * Cleans up background interval timers.
   */
  public destroy(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
  }
}
