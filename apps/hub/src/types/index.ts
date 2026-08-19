/**
 * Core type definitions for NexusSecure Hub
 */

export type ThreatCategory =
  | 'brute_force'
  | 'honeypot_probe'
  | 'sqli_xss'
  | 'rate_abuse'
  | 'scanner'
  | 'credential_stuffing'
  | 'bot_scraping'
  | string;

export interface Member {
  id: string;
  site_name: string;
  site_url: string | null;
  api_key_hash: string;
  reputation_score: number;
  is_active: boolean;
  total_mitigations: number;
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
}

export interface SanitizedMember {
  id: string;
  site_name: string;
  site_url: string | null;
  reputation_score: number;
  is_active: boolean;
  total_mitigations: number;
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
}

export interface ThreatReport {
  id: string;
  reporter_member_id: string;
  attacker_ip: string;
  category: ThreatCategory;
  confidence: number;
  created_at: string;
}

export interface BlocklistEntry {
  id: string;
  attacker_ip: string;
  primary_category: ThreatCategory;
  confidence: number;
  corroboration_count: number;
  is_active: boolean;
  first_detected: string;
  expires_at: string;
  updated_at: string;
}

export interface SiteWhitelist {
  id: string;
  member_id: string;
  ip_or_cidr: string;
  description: string | null;
  created_at: string;
}

export interface SiteTelemetry {
  id: string;
  member_id: string;
  blocked_ip: string;
  threat_category: ThreatCategory;
  mitigated_at: string;
}

export interface CorroborationResult {
  attackerIp: string;
  threatScore: number;
  distinctReporters: number;
  isPromoted: boolean;
  blocklistEntry?: BlocklistEntry;
  action: 'promoted_new' | 'promoted_updated' | 'pending_corroboration' | 'already_active';
  reason: string;
}

export interface NetworkStats {
  activeBlockedIps: number;
  totalMitigations: number;
  totalMembers: number;
  activeMembers: number;
  averageReputation: number;
  categoryBreakdown: Record<string, number>;
  recentThreats: Array<{
    id: string;
    category: string;
    confidence: number;
    created_at: string;
  }>;
  recentBlocks: BlocklistEntry[];
  uptimeSeconds: number;
  activeSseClients: number;
}

export interface SiteStats {
  member: SanitizedMember;
  mitigationsCount: number;
  recentMitigations: SiteTelemetry[];
  allowlistCount: number;
  threatCategoryDistribution: Record<string, number>;
}
