'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Site,
  MitigatedAttack,
  AllowlistEntry,
  SiteStats,
  HourlyAttackPoint,
  CategoryBreakdown,
} from './types';
import {
  INITIAL_SITES,
  INITIAL_ALLOWLIST,
  INITIAL_ATTACKS,
  MOCK_HOURLY_DATA,
  MOCK_CATEGORY_BREAKDOWN,
} from './mock-data';
import { portalApi } from './api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface SiteContextType {
  sites: Site[];
  selectedSite: Site;
  setSelectedSite: (site: Site) => void;
  attacks: MitigatedAttack[];
  allowlist: AllowlistEntry[];
  stats: SiteStats;
  hourlyData: HourlyAttackPoint[];
  categoryBreakdown: CategoryBreakdown[];
  hubConnected: boolean;
  isPinging: boolean;
  lastPingResult: {
    success: boolean;
    latencyMs: number;
    agentVersion: string;
    meshPeers: number;
    timestamp: string;
    message: string;
  } | null;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  addAllowlistEntry: (ip_or_cidr: string, description: string) => Promise<void>;
  deleteAllowlistEntry: (id: string) => Promise<void>;
  toggleAllowlistEntry: (id: string) => Promise<void>;
  quickAllowlistIp: (ip: string, reason?: string) => Promise<void>;
  pingCurrentAgent: () => Promise<{ success: boolean; latencyMs: number; message: string }>;
  regenerateApiKey: () => Promise<string>;
  addNewSite: (name: string, url: string) => Promise<Site>;
  refreshAll: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(INITIAL_SITES[0].id);
  const [allowlistMap, setAllowlistMap] = useState<Record<string, AllowlistEntry[]>>(INITIAL_ALLOWLIST);
  const [attacksMap, setAttacksMap] = useState<Record<string, MitigatedAttack[]>>(INITIAL_ATTACKS);
  const [hubConnected, setHubConnected] = useState<boolean>(true);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [lastPingResult, setLastPingResult] = useState<{
    success: boolean;
    latencyMs: number;
    agentVersion: string;
    meshPeers: number;
    timestamp: string;
    message: string;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Find selected site
  const selectedSite = useMemo(() => {
    return sites.find((s) => s.id === selectedSiteId) || sites[0];
  }, [sites, selectedSiteId]);

  // Current site attacks & allowlist
  const attacks = useMemo(() => {
    return attacksMap[selectedSite.id] || [];
  }, [attacksMap, selectedSite.id]);

  const allowlist = useMemo(() => {
    return allowlistMap[selectedSite.id] || [];
  }, [allowlistMap, selectedSite.id]);

  // Toast Helpers
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check Hub connection on mount
  useEffect(() => {
    let isMounted = true;
    portalApi.checkHubHealth().then((connected) => {
      if (isMounted) {
        setHubConnected(connected);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Computed dynamic stats
  const stats: SiteStats = useMemo(() => {
    const totalMitigations = selectedSite.total_mitigations || 418;
    const attacksToday = attacks.length * 14 + 18;
    return {
      attacks_stopped_total: totalMitigations,
      attacks_stopped_today: attacksToday,
      threat_level: selectedSite.threat_level,
      agent_latency: selectedSite.agent_latency_ms,
      reputation_score: selectedSite.reputation_score,
      reputation_tier: selectedSite.reputation_tier,
      active_rules_count: 142,
      mesh_peers_connected: 38,
      protection_uptime_percent: 99.99,
    };
  }, [selectedSite, attacks]);

  const hourlyData: HourlyAttackPoint[] = useMemo(() => {
    if (selectedSite.id.includes('b0000000')) {
      return MOCK_HOURLY_DATA.map((d) => ({
        ...d,
        attacks: Math.round(d.attacks * 1.6),
        rate_abuse: Math.round(d.rate_abuse * 2.2),
      }));
    }
    if (selectedSite.id.includes('c0000000')) {
      return MOCK_HOURLY_DATA.map((d) => ({
        ...d,
        attacks: Math.round(d.attacks * 2.1),
        sqli_xss: Math.round(d.sqli_xss * 2.4),
      }));
    }
    return MOCK_HOURLY_DATA;
  }, [selectedSite]);

  const categoryBreakdown: CategoryBreakdown[] = useMemo(() => {
    return MOCK_CATEGORY_BREAKDOWN;
  }, []);

  // Allowlist Actions
  const addAllowlistEntry = useCallback(
    async (ip_or_cidr: string, description: string) => {
      const trimmedIp = ip_or_cidr.trim();
      if (!trimmedIp) return;

      const newEntry = await portalApi.addAllowlistIp(
        selectedSite.id,
        trimmedIp,
        description || 'Manual allowlist entry'
      );

      setAllowlistMap((prev) => {
        const siteList = prev[selectedSite.id] || [];
        // Prevent duplicate
        if (siteList.some((e) => e.ip_or_cidr === trimmedIp)) {
          return prev;
        }
        return {
          ...prev,
          [selectedSite.id]: [newEntry, ...siteList],
        };
      });

      addToast({
        type: 'success',
        title: 'IP Address Allowlisted',
        description: `${trimmedIp} is now permanently bypassed from inspection for ${selectedSite.site_name}.`,
      });
    },
    [selectedSite, addToast]
  );

  const deleteAllowlistEntry = useCallback(
    async (id: string) => {
      await portalApi.deleteAllowlistIp(selectedSite.id, id);
      setAllowlistMap((prev) => {
        const currentList = prev[selectedSite.id] || [];
        const entry = currentList.find((e) => e.id === id);
        if (entry) {
          addToast({
            type: 'info',
            title: 'Allowlist Entry Removed',
            description: `IP ${entry.ip_or_cidr} has been removed from exemptions.`,
          });
        }
        return {
          ...prev,
          [selectedSite.id]: currentList.filter((e) => e.id !== id),
        };
      });
    },
    [selectedSite, addToast]
  );

  const toggleAllowlistEntry = useCallback(
    async (id: string) => {
      setAllowlistMap((prev) => {
        const currentList = prev[selectedSite.id] || [];
        return {
          ...prev,
          [selectedSite.id]: currentList.map((e) =>
            e.id === id ? { ...e, is_active: !e.is_active } : e
          ),
        };
      });
      addToast({
        type: 'info',
        title: 'Allowlist Rule Updated',
        description: 'Exemption status toggled successfully.',
      });
    },
    [selectedSite, addToast]
  );

  const quickAllowlistIp = useCallback(
    async (ip: string, reason?: string) => {
      await addAllowlistEntry(ip, reason || 'Quick added from attack log');
    },
    [addAllowlistEntry]
  );

  // Live Ping Test
  const pingCurrentAgent = useCallback(async () => {
    setIsPinging(true);
    try {
      const result = await portalApi.pingAgent(selectedSite.id);
      setLastPingResult(result);
      addToast({
        type: 'success',
        title: 'Agent Ping Successful',
        description: `Round-trip response ${result.latencyMs}ms. Mesh synchronization confirmed.`,
      });
      return {
        success: true,
        latencyMs: result.latencyMs,
        message: result.message,
      };
    } finally {
      setIsPinging(false);
    }
  }, [selectedSite, addToast]);

  // Regenerate API Key
  const regenerateApiKey = useCallback(async () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const newKeyFull = `nx_live_${selectedSite.site_name.toLowerCase().slice(0, 4)}_${randomHex}`;
    const newKeyMasked = `${newKeyFull.slice(0, 14)}••••••••••••••••${newKeyFull.slice(-4)}`;

    setSites((prev) =>
      prev.map((s) =>
        s.id === selectedSite.id
          ? { ...s, api_key_full: newKeyFull, api_key_masked: newKeyMasked }
          : s
      )
    );

    addToast({
      type: 'warning',
      title: 'Site API Key Regenerated',
      description: 'Remember to update your agent environment variable (NEXUS_API_KEY).',
    });

    return newKeyFull;
  }, [selectedSite, addToast]);

  // Add new registered site
  const addNewSite = useCallback(
    async (name: string, url: string): Promise<Site> => {
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const newId = `s0000000-${randomHex.slice(0, 4)}-4000-8000-${randomHex}`;
      const prefix = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'site';
      const keyFull = `nx_live_${prefix}_${randomHex}99a1`;
      const keyMasked = `${keyFull.slice(0, 14)}••••••••••••••••${keyFull.slice(-4)}`;

      const newSite: Site = {
        id: newId,
        site_name: name,
        site_url: url.startsWith('http') ? url : `https://${url}`,
        api_key_full: keyFull,
        api_key_masked: keyMasked,
        reputation_score: 5.0,
        reputation_tier: 'Tier 1 (Verified Sovereign)',
        is_active: true,
        total_mitigations: 0,
        last_heartbeat: new Date().toISOString(),
        threat_level: 'LOW',
        agent_latency_ms: '< 0.07 ms',
        created_at: new Date().toISOString(),
      };

      setSites((prev) => [...prev, newSite]);
      setSelectedSiteId(newSite.id);

      setAllowlistMap((prev) => ({
        ...prev,
        [newSite.id]: [
          {
            id: `wl-${Date.now()}`,
            member_id: newSite.id,
            ip_or_cidr: '127.0.0.1',
            description: 'Localhost / Dev loopback',
            created_at: new Date().toISOString(),
            is_active: true,
            bypassed_count: 0,
          },
        ],
      }));

      setAttacksMap((prev) => ({
        ...prev,
        [newSite.id]: [],
      }));

      addToast({
        type: 'success',
        title: 'New Site Registered',
        description: `${name} has been enrolled in the NexusSecure Threat Intelligence Mesh.`,
      });

      return newSite;
    },
    [addToast]
  );

  const refreshAll = useCallback(async () => {
    const connected = await portalApi.checkHubHealth();
    setHubConnected(connected);
    addToast({
      type: 'info',
      title: 'Mesh Telemetry Synced',
      description: 'Refreshed latest threat intelligence indicators and IoC feeds.',
    });
  }, [addToast]);

  return (
    <SiteContext.Provider
      value={{
        sites,
        selectedSite,
        setSelectedSite: (site) => setSelectedSiteId(site.id),
        attacks,
        allowlist,
        stats,
        hourlyData,
        categoryBreakdown,
        hubConnected,
        isPinging,
        lastPingResult,
        toasts,
        addToast,
        removeToast,
        addAllowlistEntry,
        deleteAllowlistEntry,
        toggleAllowlistEntry,
        quickAllowlistIp,
        pingCurrentAgent,
        regenerateApiKey,
        addNewSite,
        refreshAll,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}
