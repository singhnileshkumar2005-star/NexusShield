export type ThreatCategory =
  | 'brute_force'
  | 'honeypot_probe'
  | 'sqli_xss'
  | 'rate_abuse'
  | 'scanner'
  | 'credential_stuffing';

export type DefenseAction = 'BLOCKED_403' | 'DROPPED_EDGE' | 'RATE_LIMITED_429' | 'CHALLENGED_WAF';

export interface Site {
  id: string;
  site_name: string;
  site_url: string;
  api_key_masked: string;
  api_key_full: string;
  reputation_score: number;
  reputation_tier: 'Tier 1 (Verified Sovereign)' | 'Tier 2 (Established)' | 'Tier 3 (Provisional)';
  is_active: boolean;
  total_mitigations: number;
  last_heartbeat: string;
  threat_level: 'LOW' | 'ELEVATED' | 'CRITICAL';
  agent_latency_ms: string;
  created_at: string;
}

export interface MitigatedAttack {
  id: string;
  member_id: string;
  attacker_ip: string;
  category: ThreatCategory;
  confidence: number;
  corroboration_count: number;
  action: DefenseAction;
  target_endpoint: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  user_agent_excerpt: string;
  origin_geo?: {
    country: string;
    city: string;
    flag: string;
  };
  timestamp: string;
  is_allowlisted?: boolean;
}

export interface AllowlistEntry {
  id: string;
  member_id: string;
  ip_or_cidr: string;
  description: string;
  created_at: string;
  is_active: boolean;
  bypassed_count: number;
}

export interface SiteStats {
  attacks_stopped_total: number;
  attacks_stopped_today: number;
  threat_level: 'LOW' | 'ELEVATED' | 'CRITICAL';
  agent_latency: string;
  reputation_score: number;
  reputation_tier: string;
  active_rules_count: number;
  mesh_peers_connected: number;
  protection_uptime_percent: number;
}

export interface HourlyAttackPoint {
  hour: string;
  attacks: number;
  sqli_xss: number;
  brute_force: number;
  rate_abuse: number;
  honeypot: number;
}

export interface CategoryBreakdown {
  category: string;
  displayName: string;
  count: number;
  percentage: number;
}

export type IntegrationFramework = 'nextjs' | 'express' | 'fastify' | 'node-http' | 'php-wordpress';

export interface SetupFrameworkGuide {
  id: IntegrationFramework;
  name: string;
  badge: string;
  installCommand: string;
  filename: string;
  codeSnippet: string;
  description: string;
  features: string[];
}
