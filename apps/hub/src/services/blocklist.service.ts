import { getDataStore } from '../db';
import { BlocklistEntry, SiteWhitelist } from '../types';
import { SseService } from './sse.service';

export class BlocklistService {
  /**
   * Retrieves currently active, non-expired blocklist entries.
   * If `since` is supplied (ISO date or timestamp), returns only updates since that time.
   */
  static async getActiveBlocklist(since?: string): Promise<BlocklistEntry[]> {
    const store = await getDataStore();
    return await store.getActiveBlocklist(since);
  }

  /**
   * Checks if an IP is currently blocked
   */
  static async isIpBlocked(ip: string): Promise<{ blocked: boolean; entry: BlocklistEntry | null }> {
    const store = await getDataStore();
    const entry = await store.getBlocklistEntryByIp(ip);
    if (!entry) return { blocked: false, entry: null };

    const isNotExpired = new Date(entry.expires_at).getTime() > Date.now();
    const blocked = entry.is_active && isNotExpired;
    return { blocked, entry: blocked ? entry : null };
  }

  /**
   * Manually revokes/unblocks an IP across the mesh (Admin action)
   */
  static async revokeBlock(ip: string, reason = 'Admin manual revocation'): Promise<boolean> {
    const store = await getDataStore();
    const cleanIp = ip.trim();
    const success = await store.revokeBlocklistEntry(cleanIp);

    if (success) {
      // Broadcast block removal to all live agents
      SseService.broadcast('block_removed', {
        type: 'block_removed',
        ip: cleanIp,
        reason,
        timestamp: new Date().toISOString(),
      });
    }

    return success;
  }

  /**
   * Cleans up expired blocks in the background
   */
  static async cleanupExpiredBlocks(): Promise<number> {
    const store = await getDataStore();
    return await store.cleanupExpiredBlocks();
  }

  // --- Site-specific Allowlist / Whitelist ---

  /**
   * Adds an IP or CIDR to a member's local allowlist
   */
  static async addAllowlistEntry(
    memberId: string,
    ipOrCidr: string,
    description?: string
  ): Promise<SiteWhitelist> {
    const store = await getDataStore();
    return await store.createAllowlistEntry({
      member_id: memberId,
      ip_or_cidr: ipOrCidr.trim(),
      description: description?.trim() || null,
    });
  }

  /**
   * Retrieves allowlist entries for a member
   */
  static async getAllowlist(memberId: string): Promise<SiteWhitelist[]> {
    const store = await getDataStore();
    return await store.getAllowlistForMember(memberId);
  }

  /**
   * Removes an entry from a member's allowlist
   */
  static async deleteAllowlistEntry(memberId: string, entryId: string): Promise<boolean> {
    const store = await getDataStore();
    return await store.deleteAllowlistEntry(memberId, entryId);
  }

  /**
   * Checks if an IP is allowed under a member's custom allowlist rules
   */
  static async isAllowedByMember(memberId: string, ip: string): Promise<boolean> {
    const list = await this.getAllowlist(memberId);
    const targetIp = ip.trim();

    for (const item of list) {
      if (this.ipMatchesCidr(targetIp, item.ip_or_cidr)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper to evaluate exact IP or CIDR match
   */
  static ipMatchesCidr(ip: string, pattern: string): boolean {
    const trimmedPattern = pattern.trim();
    if (ip === trimmedPattern) return true;

    // CIDR notation (e.g. 192.168.1.0/24)
    if (trimmedPattern.includes('/')) {
      try {
        const [subnet, bitsStr] = trimmedPattern.split('/');
        const bits = parseInt(bitsStr, 10);
        if (isNaN(bits) || bits < 0 || bits > 32) return false;

        const ipNum = this.ipToNumber(ip);
        const subnetNum = this.ipToNumber(subnet);
        if (ipNum === null || subnetNum === null) return false;

        const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
        return (ipNum & mask) === (subnetNum & mask);
      } catch {
        return false;
      }
    }

    return false;
  }

  private static ipToNumber(ip: string): number | null {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    let num = 0;
    for (let i = 0; i < 4; i++) {
      const part = parseInt(parts[i], 10);
      if (isNaN(part) || part < 0 || part > 255) return null;
      num = (num << 8) + part;
    }
    return num >>> 0;
  }
}
