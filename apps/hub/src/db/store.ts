import {
  Member,
  ThreatReport,
  BlocklistEntry,
  SiteWhitelist,
  SiteTelemetry,
} from '../types';

export interface NexusDataStore {
  init(): Promise<void>;

  // Members
  createMember(data: {
    id?: string;
    site_name: string;
    site_url?: string | null;
    api_key_hash: string;
    reputation_score?: number;
    total_mitigations?: number;
  }): Promise<Member>;
  getMemberById(id: string): Promise<Member | null>;
  getMemberByApiKeyHash(hash: string): Promise<Member | null>;
  listMembers(): Promise<Member[]>;
  updateMemberReputation(id: string, newScore: number): Promise<Member | null>;
  recordHeartbeat(id: string, mitigationIncrement?: number): Promise<Member | null>;

  // Threat Reports
  createThreatReport(data: {
    id?: string;
    reporter_member_id: string;
    attacker_ip: string;
    category: string;
    confidence: number;
    created_at?: string;
  }): Promise<ThreatReport>;
  getReportsForIp(ip: string, sinceIso?: string): Promise<ThreatReport[]>;
  getRecentThreatReports(limit?: number): Promise<ThreatReport[]>;
  countReportsByCategory(): Promise<Record<string, number>>;

  // Blocklist
  getActiveBlocklist(sinceIso?: string): Promise<BlocklistEntry[]>;
  getBlocklistEntryByIp(ip: string): Promise<BlocklistEntry | null>;
  upsertBlocklistEntry(data: {
    id?: string;
    attacker_ip: string;
    primary_category: string;
    confidence: number;
    corroboration_count: number;
    is_active: boolean;
    expires_at: string;
  }): Promise<BlocklistEntry>;
  revokeBlocklistEntry(ip: string): Promise<boolean>;
  cleanupExpiredBlocks(): Promise<number>;
  countActiveBlocks(): Promise<number>;

  // Site Whitelist / Allowlist
  createAllowlistEntry(data: {
    id?: string;
    member_id: string;
    ip_or_cidr: string;
    description?: string | null;
  }): Promise<SiteWhitelist>;
  getAllowlistForMember(memberId: string): Promise<SiteWhitelist[]>;
  deleteAllowlistEntry(memberId: string, entryId: string): Promise<boolean>;

  // Site Telemetry
  createSiteTelemetry(data: {
    id?: string;
    member_id: string;
    blocked_ip: string;
    threat_category: string;
    mitigated_at?: string;
  }): Promise<SiteTelemetry>;
  getTelemetryForMember(memberId: string, limit?: number): Promise<SiteTelemetry[]>;
  countTotalMitigations(): Promise<number>;
}
