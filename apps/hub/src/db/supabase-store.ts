import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NexusDataStore } from './store';
import {
  Member,
  ThreatReport,
  BlocklistEntry,
  SiteWhitelist,
  SiteTelemetry,
} from '../types';

export class SupabaseDataStore implements NexusDataStore {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  async init(): Promise<void> {
    try {
      // Test connectivity
      const { error } = await this.client.from('members').select('id').limit(1);
      if (error) {
        console.warn('⚠️ Supabase connection test warning:', error.message);
      } else {
        console.log('✅ Supabase connected successfully');
      }
    } catch (err) {
      console.error('❌ Supabase init error:', err);
    }
  }

  // --- Members ---
  async createMember(data: {
    id?: string;
    site_name: string;
    site_url?: string | null;
    api_key_hash: string;
    reputation_score?: number;
    total_mitigations?: number;
  }): Promise<Member> {
    const payload: any = {
      site_name: data.site_name,
      site_url: data.site_url || null,
      api_key_hash: data.api_key_hash,
      reputation_score: data.reputation_score ?? 1.0,
      total_mitigations: data.total_mitigations ?? 0,
      is_active: true,
    };
    if (data.id) payload.id = data.id;

    const { data: member, error } = await this.client
      .from('members')
      .insert([payload])
      .select()
      .single();

    if (error || !member) {
      throw new Error(`Failed to create member in Supabase: ${error?.message}`);
    }

    return member as Member;
  }

  async getMemberById(id: string): Promise<Member | null> {
    const { data, error } = await this.client
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Member;
  }

  async getMemberByApiKeyHash(hash: string): Promise<Member | null> {
    const { data, error } = await this.client
      .from('members')
      .select('*')
      .eq('api_key_hash', hash)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data as Member;
  }

  async listMembers(): Promise<Member[]> {
    const { data, error } = await this.client
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Member[];
  }

  async updateMemberReputation(id: string, newScore: number): Promise<Member | null> {
    const boundedScore = Math.max(0.0, Math.min(5.0, Number(newScore.toFixed(2))));
    const { data, error } = await this.client
      .from('members')
      .update({ reputation_score: boundedScore, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data as Member;
  }

  async recordHeartbeat(id: string, mitigationIncrement = 0): Promise<Member | null> {
    const now = new Date().toISOString();
    const existing = await this.getMemberById(id);
    if (!existing) return null;

    const updatePayload: any = {
      last_heartbeat: now,
      updated_at: now,
    };
    if (mitigationIncrement > 0) {
      updatePayload.total_mitigations = (existing.total_mitigations || 0) + mitigationIncrement;
    }

    const { data, error } = await this.client
      .from('members')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data as Member;
  }

  // --- Threat Reports ---
  async createThreatReport(data: {
    id?: string;
    reporter_member_id: string;
    attacker_ip: string;
    category: string;
    confidence: number;
    created_at?: string;
  }): Promise<ThreatReport> {
    const payload: any = {
      reporter_member_id: data.reporter_member_id,
      attacker_ip: data.attacker_ip,
      category: data.category,
      confidence: data.confidence,
    };
    if (data.id) payload.id = data.id;
    if (data.created_at) payload.created_at = data.created_at;

    const { data: report, error } = await this.client
      .from('threat_reports')
      .insert([payload])
      .select()
      .single();

    if (error || !report) {
      throw new Error(`Failed to create threat report in Supabase: ${error?.message}`);
    }

    return report as ThreatReport;
  }

  async getReportsForIp(ip: string, sinceIso?: string): Promise<ThreatReport[]> {
    let query = this.client.from('threat_reports').select('*').eq('attacker_ip', ip);
    if (sinceIso) {
      query = query.gte('created_at', sinceIso);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as ThreatReport[];
  }

  async getRecentThreatReports(limit = 50): Promise<ThreatReport[]> {
    const { data, error } = await this.client
      .from('threat_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as ThreatReport[];
  }

  async countReportsByCategory(): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from('threat_reports')
      .select('category');

    if (error || !data) return {};
    const breakdown: Record<string, number> = {};
    for (const row of data) {
      breakdown[row.category] = (breakdown[row.category] || 0) + 1;
    }
    return breakdown;
  }

  // --- Blocklist ---
  async getActiveBlocklist(sinceIso?: string): Promise<BlocklistEntry[]> {
    const nowIso = new Date().toISOString();
    let query = this.client
      .from('network_blocklist')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', nowIso);

    if (sinceIso) {
      query = query.gte('updated_at', sinceIso);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as BlocklistEntry[];
  }

  async getBlocklistEntryByIp(ip: string): Promise<BlocklistEntry | null> {
    const { data, error } = await this.client
      .from('network_blocklist')
      .select('*')
      .eq('attacker_ip', ip)
      .single();

    if (error || !data) return null;
    return data as BlocklistEntry;
  }

  async upsertBlocklistEntry(data: {
    id?: string;
    attacker_ip: string;
    primary_category: string;
    confidence: number;
    corroboration_count: number;
    is_active: boolean;
    expires_at: string;
  }): Promise<BlocklistEntry> {
    const nowIso = new Date().toISOString();
    const payload: any = {
      attacker_ip: data.attacker_ip,
      primary_category: data.primary_category,
      confidence: data.confidence,
      corroboration_count: data.corroboration_count,
      is_active: data.is_active,
      expires_at: data.expires_at,
      updated_at: nowIso,
    };
    if (data.id) payload.id = data.id;

    const { data: entry, error } = await this.client
      .from('network_blocklist')
      .upsert([payload], { onConflict: 'attacker_ip' })
      .select()
      .single();

    if (error || !entry) {
      throw new Error(`Failed to upsert blocklist entry in Supabase: ${error?.message}`);
    }

    return entry as BlocklistEntry;
  }

  async revokeBlocklistEntry(ip: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('network_blocklist')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('attacker_ip', ip)
      .select();

    if (error || !data || data.length === 0) return false;
    return true;
  }

  async cleanupExpiredBlocks(): Promise<number> {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.client
      .from('network_blocklist')
      .update({ is_active: false, updated_at: nowIso })
      .eq('is_active', true)
      .lte('expires_at', nowIso)
      .select();

    if (error || !data) return 0;
    return data.length;
  }

  async countActiveBlocks(): Promise<number> {
    const nowIso = new Date().toISOString();
    const { count, error } = await this.client
      .from('network_blocklist')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gt('expires_at', nowIso);

    if (error || count === null) return 0;
    return count;
  }

  // --- Site Whitelist / Allowlist ---
  async createAllowlistEntry(data: {
    id?: string;
    member_id: string;
    ip_or_cidr: string;
    description?: string | null;
  }): Promise<SiteWhitelist> {
    const payload: any = {
      member_id: data.member_id,
      ip_or_cidr: data.ip_or_cidr,
      description: data.description || null,
    };
    if (data.id) payload.id = data.id;

    const { data: entry, error } = await this.client
      .from('site_whitelists')
      .insert([payload])
      .select()
      .single();

    if (error || !entry) {
      throw new Error(`Failed to create allowlist entry in Supabase: ${error?.message}`);
    }

    return entry as SiteWhitelist;
  }

  async getAllowlistForMember(memberId: string): Promise<SiteWhitelist[]> {
    const { data, error } = await this.client
      .from('site_whitelists')
      .select('*')
      .eq('member_id', memberId);

    if (error || !data) return [];
    return data as SiteWhitelist[];
  }

  async deleteAllowlistEntry(memberId: string, entryId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('site_whitelists')
      .delete()
      .eq('id', entryId)
      .eq('member_id', memberId)
      .select();

    if (error || !data || data.length === 0) return false;
    return true;
  }

  // --- Site Telemetry ---
  async createSiteTelemetry(data: {
    id?: string;
    member_id: string;
    blocked_ip: string;
    threat_category: string;
    mitigated_at?: string;
  }): Promise<SiteTelemetry> {
    const payload: any = {
      member_id: data.member_id,
      blocked_ip: data.blocked_ip,
      threat_category: data.threat_category,
    };
    if (data.id) payload.id = data.id;
    if (data.mitigated_at) payload.mitigated_at = data.mitigated_at;

    const { data: telemetry, error } = await this.client
      .from('site_telemetry')
      .insert([payload])
      .select()
      .single();

    if (error || !telemetry) {
      throw new Error(`Failed to create site telemetry in Supabase: ${error?.message}`);
    }

    return telemetry as SiteTelemetry;
  }

  async getTelemetryForMember(memberId: string, limit = 50): Promise<SiteTelemetry[]> {
    const { data, error } = await this.client
      .from('site_telemetry')
      .select('*')
      .eq('member_id', memberId)
      .order('mitigated_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as SiteTelemetry[];
  }

  async countTotalMitigations(): Promise<number> {
    const { count, error } = await this.client
      .from('site_telemetry')
      .select('*', { count: 'exact', head: true });

    if (error || count === null) return 0;
    return count;
  }
}
