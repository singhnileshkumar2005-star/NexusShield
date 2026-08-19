export type ThreatCategory = 
  | 'brute_force'
  | 'honeypot_probe'
  | 'sqli_xss'
  | 'rate_abuse'
  | 'scanner';

export interface ThreatEvent {
  id: string;
  attackerIp: string;
  category: ThreatCategory;
  confidence: number; // 0.00 to 1.00
  timestamp: string;
  action: 'blocked' | 'corroborated' | 'analyzing';
  corroborationCount: number;
  reporterMeshId?: string; // Anonymized node ID like "mesh-node-a"
  payloadSignature?: string;
  geo?: {
    country: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
}

export interface BlocklistEntry {
  id: string;
  attackerIp: string;
  primaryCategory: ThreatCategory;
  confidence: number;
  corroborationCount: number;
  isActive: boolean;
  firstDetected: string;
  expiresAt: string;
  updatedAt: string;
  notes?: string;
}

export interface MemberSite {
  id: string;
  siteName: string;
  siteUrl: string;
  reputationScore: number; // 0.00 to 5.00
  isActive: boolean;
  status: 'online' | 'idle' | 'offline';
  totalMitigations: number;
  lastHeartbeat: string;
  createdAt: string;
  apiKeyHash?: string;
  rawApiKey?: string; // Only displayed immediately upon creation
}

export interface CategoryStat {
  category: ThreatCategory;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TimelineDataPoint {
  time: string;
  brute_force: number;
  honeypot_probe: number;
  sqli_xss: number;
  rate_abuse: number;
  scanner: number;
  total: number;
}

export interface NetworkStats {
  totalAttacksMitigated: number;
  activeBlockedIps: number;
  connectedMemberSites: number;
  meshHealthPercent: number;
  hubStatus: 'connected' | 'fallback_mode' | 'offline';
  attacksToday: number;
  avgCorroborationTimeMs: number;
  lastSyncTime: string;
  categoryBreakdown: CategoryStat[];
  timelineData: TimelineDataPoint[];
}

export interface PolicySettings {
  corroborationThreshold: number; // 1 to 5 members
  minConfidence: number; // 0.50 to 1.00
  defaultTtlHours: number; // 24, 48, 72, 168
  hubEndpoint: string;
  autoBlockHighConfidence: boolean;
  enableHoneypotNetwork: boolean;
  privacyPreservationMode: 'strict_anonymized' | 'differential_privacy';
  rateLimitThreshold: number;
  emergencyKillSwitch: boolean;
}
