import {
  BlocklistEntry,
  MemberSite,
  NetworkStats,
  PolicySettings,
  ThreatEvent,
} from './types';
import {
  INITIAL_BLOCKLIST,
  INITIAL_MEMBERS,
  INITIAL_NETWORK_STATS,
  INITIAL_THREAT_EVENTS,
  generateSimulatedThreatEvent,
} from './mockData';

const DEFAULT_HUB_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:3000') 
  : 'http://localhost:3000';

const LOCAL_STORAGE_KEYS = {
  BLOCKLIST: 'nexus_admin_blocklist',
  MEMBERS: 'nexus_admin_members',
  STATS: 'nexus_admin_stats',
  SETTINGS: 'nexus_admin_settings',
  EVENTS: 'nexus_admin_events',
};

// Helper for localStorage state persistence
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

export const HubApi = {
  getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_hub_url') || process.env.NEXT_PUBLIC_HUB_URL || DEFAULT_HUB_URL;
    }
    return DEFAULT_HUB_URL;
  },

  setBaseUrl(url: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_hub_url', url);
    }
  },

  async getHealth(): Promise<{ status: 'connected' | 'offline'; version?: string; activeNodes?: number }> {
    try {
      const url = this.getBaseUrl();
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        return { status: 'connected', version: data.version || '1.0.0', activeNodes: data.activeNodes || 5 };
      }
      return { status: 'offline' };
    } catch {
      return { status: 'offline' };
    }
  },

  async getStats(): Promise<NetworkStats> {
    try {
      const url = this.getBaseUrl();
      const res = await fetch(`${url}/v1/stats`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        return {
          ...INITIAL_NETWORK_STATS,
          ...data,
          hubStatus: 'connected',
          lastSyncTime: new Date().toISOString(),
        };
      }
    } catch {
      // Hub not reachable, use stored/mock
    }

    const localStats = getStored<NetworkStats>(LOCAL_STORAGE_KEYS.STATS, INITIAL_NETWORK_STATS);
    const members = await this.getMembers();
    const blocks = await this.getBlocklist();

    return {
      ...localStats,
      activeBlockedIps: blocks.filter(b => b.isActive).length,
      connectedMemberSites: members.length,
      hubStatus: 'fallback_mode',
      lastSyncTime: new Date().toISOString(),
    };
  },

  async getBlocklist(): Promise<BlocklistEntry[]> {
    try {
      const url = this.getBaseUrl();
      const res = await fetch(`${url}/v1/blocklist`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.blocks)) {
          return data.blocks.map((b: any) => ({
            id: b.id || `blk-${b.ip.replace(/[^a-zA-Z0-9]/g, '-')}`,
            attackerIp: b.ip || b.attackerIp,
            primaryCategory: b.category || b.primaryCategory || 'brute_force',
            confidence: b.confidence ?? 0.90,
            corroborationCount: b.corroboration_count ?? b.corroborationCount ?? 1,
            isActive: b.is_active ?? true,
            firstDetected: b.first_detected || b.firstDetected || new Date().toISOString(),
            expiresAt: b.expires_at || b.expiresAt || new Date(Date.now() + 86400000).toISOString(),
            updatedAt: b.updated_at || b.updatedAt || new Date().toISOString(),
            notes: b.notes,
          }));
        }
      }
    } catch {
      // Fallback
    }
    return getStored<BlocklistEntry[]>(LOCAL_STORAGE_KEYS.BLOCKLIST, INITIAL_BLOCKLIST);
  },

  async addManualBlock(entry: {
    attackerIp: string;
    primaryCategory: any;
    confidence: number;
    ttlHours: number;
    notes?: string;
  }): Promise<BlocklistEntry> {
    const expiresAt = new Date(Date.now() + entry.ttlHours * 3600 * 1000).toISOString();
    const newBlock: BlocklistEntry = {
      id: `blk-man-${Date.now()}`,
      attackerIp: entry.attackerIp.trim(),
      primaryCategory: entry.primaryCategory,
      confidence: entry.confidence,
      corroborationCount: 1,
      isActive: true,
      firstDetected: new Date().toISOString(),
      expiresAt,
      updatedAt: new Date().toISOString(),
      notes: entry.notes || 'Admin manual override block',
    };

    // Try posting to Hub if online
    try {
      const url = this.getBaseUrl();
      await fetch(`${url}/v1/admin/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlock),
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      // Continue locally
    }

    const current = getStored<BlocklistEntry[]>(LOCAL_STORAGE_KEYS.BLOCKLIST, INITIAL_BLOCKLIST);
    const updated = [newBlock, ...current.filter(b => b.attackerIp !== newBlock.attackerIp)];
    setStored(LOCAL_STORAGE_KEYS.BLOCKLIST, updated);
    return newBlock;
  },

  async revokeBlock(attackerIp: string): Promise<boolean> {
    try {
      const url = this.getBaseUrl();
      await fetch(`${url}/v1/admin/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: attackerIp }),
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      // Ignore
    }

    const current = getStored<BlocklistEntry[]>(LOCAL_STORAGE_KEYS.BLOCKLIST, INITIAL_BLOCKLIST);
    const updated = current.filter(b => b.attackerIp !== attackerIp);
    setStored(LOCAL_STORAGE_KEYS.BLOCKLIST, updated);
    return true;
  },

  async getMembers(): Promise<MemberSite[]> {
    try {
      const url = this.getBaseUrl();
      const res = await fetch(`${url}/v1/admin/members`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.members)) {
          return data.members;
        }
      }
    } catch {
      // Fallback
    }
    return getStored<MemberSite[]>(LOCAL_STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  },

  async registerMember(siteName: string, siteUrl: string): Promise<MemberSite & { apiKey: string }> {
    const rawApiKey = `nx_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const newMember: MemberSite = {
      id: `node-${Math.random().toString(36).substring(2, 10)}`,
      siteName: siteName.trim(),
      siteUrl: siteUrl.trim(),
      reputationScore: 1.00,
      isActive: true,
      status: 'online',
      totalMitigations: 0,
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      apiKeyHash: `hash_${rawApiKey.substring(0, 16)}...`,
      rawApiKey,
    };

    try {
      const url = this.getBaseUrl();
      const res = await fetch(`${url}/v1/admin/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, siteUrl }),
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          ...newMember,
          id: data.id || newMember.id,
          apiKey: data.apiKey || rawApiKey,
        };
      }
    } catch {
      // Continue locally
    }

    const current = getStored<MemberSite[]>(LOCAL_STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const updated = [newMember, ...current];
    setStored(LOCAL_STORAGE_KEYS.MEMBERS, updated);

    return {
      ...newMember,
      apiKey: rawApiKey,
    };
  },

  async updateMemberReputation(memberId: string, newScore: number): Promise<boolean> {
    const current = getStored<MemberSite[]>(LOCAL_STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const updated = current.map(m => m.id === memberId ? { ...m, reputationScore: newScore } : m);
    setStored(LOCAL_STORAGE_KEYS.MEMBERS, updated);
    return true;
  },

  async getRecentEvents(): Promise<ThreatEvent[]> {
    return getStored<ThreatEvent[]>(LOCAL_STORAGE_KEYS.EVENTS, INITIAL_THREAT_EVENTS);
  },

  async getPolicySettings(): Promise<PolicySettings> {
    const defaultSettings: PolicySettings = {
      corroborationThreshold: 2,
      minConfidence: 0.90,
      defaultTtlHours: 48,
      hubEndpoint: this.getBaseUrl(),
      autoBlockHighConfidence: true,
      enableHoneypotNetwork: true,
      privacyPreservationMode: 'strict_anonymized',
      rateLimitThreshold: 120,
      emergencyKillSwitch: false,
    };
    return getStored<PolicySettings>(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings);
  },

  async savePolicySettings(settings: PolicySettings): Promise<boolean> {
    setStored(LOCAL_STORAGE_KEYS.SETTINGS, settings);
    this.setBaseUrl(settings.hubEndpoint);
    return true;
  },
};
