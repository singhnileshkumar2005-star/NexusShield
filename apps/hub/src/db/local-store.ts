import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NexusDataStore } from './store';
import {
  Member,
  ThreatReport,
  BlocklistEntry,
  SiteWhitelist,
  SiteTelemetry,
} from '../types';
import { getSeedData, InitialData } from './seed';

export class LocalDataStore implements NexusDataStore {
  private filePath: string;
  private data: InitialData;
  private isInitialized = false;
  private savePromise: Promise<void> | null = null;
  private pendingSave = false;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = {
      members: [],
      threatReports: [],
      networkBlocklist: [],
      siteWhitelists: [],
      siteTelemetry: [],
    };
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = await fs.promises.readFile(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          members: parsed.members || [],
          threatReports: parsed.threatReports || [],
          networkBlocklist: parsed.networkBlocklist || [],
          siteWhitelists: parsed.siteWhitelists || [],
          siteTelemetry: parsed.siteTelemetry || [],
        };
      } else {
        // Initialize with seed data
        this.data = getSeedData();
        await this.persist();
      }

      // If empty for any reason, seed it
      if (this.data.members.length === 0) {
        this.data = getSeedData();
        await this.persist();
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('⚠️ Could not load local data file, initializing with in-memory seed data:', err);
      this.data = getSeedData();
      this.isInitialized = true;
    }
  }

  private async persist(): Promise<void> {
    if (this.savePromise) {
      this.pendingSave = true;
      return;
    }

    this.savePromise = (async () => {
      try {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
          await fs.promises.mkdir(dir, { recursive: true });
        }
        const tempPath = `${this.filePath}.tmp.${Date.now()}`;
        await fs.promises.writeFile(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
        await fs.promises.rename(tempPath, this.filePath);
      } catch (err) {
        console.error('❌ Failed to persist local store to disk:', err);
      } finally {
        this.savePromise = null;
        if (this.pendingSave) {
          this.pendingSave = false;
          this.persist();
        }
      }
    })();
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
    const now = new Date().toISOString();
    const newMember: Member = {
      id: data.id || crypto.randomUUID(),
      site_name: data.site_name,
      site_url: data.site_url || null,
      api_key_hash: data.api_key_hash,
      reputation_score: data.reputation_score !== undefined ? data.reputation_score : 1.0,
      is_active: true,
      total_mitigations: data.total_mitigations || 0,
      last_heartbeat: now,
      created_at: now,
      updated_at: now,
    };

    this.data.members.push(newMember);
    await this.persist();
    return { ...newMember };
  }

  async getMemberById(id: string): Promise<Member | null> {
    const member = this.data.members.find((m) => m.id === id);
    return member ? { ...member } : null;
  }

  async getMemberByApiKeyHash(hash: string): Promise<Member | null> {
    const member = this.data.members.find((m) => m.api_key_hash === hash && m.is_active);
    return member ? { ...member } : null;
  }

  async listMembers(): Promise<Member[]> {
    return this.data.members.map((m) => ({ ...m }));
  }

  async updateMemberReputation(id: string, newScore: number): Promise<Member | null> {
    const member = this.data.members.find((m) => m.id === id);
    if (!member) return null;
    // Bound reputation between 0.00 and 5.00
    member.reputation_score = Math.max(0.0, Math.min(5.0, Number(newScore.toFixed(2))));
    member.updated_at = new Date().toISOString();
    await this.persist();
    return { ...member };
  }

  async recordHeartbeat(id: string, mitigationIncrement = 0): Promise<Member | null> {
    const member = this.data.members.find((m) => m.id === id);
    if (!member) return null;
    member.last_heartbeat = new Date().toISOString();
    if (mitigationIncrement > 0) {
      member.total_mitigations += mitigationIncrement;
    }
    member.updated_at = member.last_heartbeat;
    await this.persist();
    return { ...member };
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
    const report: ThreatReport = {
      id: data.id || crypto.randomUUID(),
      reporter_member_id: data.reporter_member_id,
      attacker_ip: data.attacker_ip,
      category: data.category,
      confidence: data.confidence,
      created_at: data.created_at || new Date().toISOString(),
    };

    this.data.threatReports.push(report);
    await this.persist();
    return { ...report };
  }

  async getReportsForIp(ip: string, sinceIso?: string): Promise<ThreatReport[]> {
    let reports = this.data.threatReports.filter((r) => r.attacker_ip === ip);
    if (sinceIso) {
      const sinceTime = new Date(sinceIso).getTime();
      reports = reports.filter((r) => new Date(r.created_at).getTime() >= sinceTime);
    }
    return reports.map((r) => ({ ...r }));
  }

  async getRecentThreatReports(limit = 50): Promise<ThreatReport[]> {
    return [...this.data.threatReports]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }

  async countReportsByCategory(): Promise<Record<string, number>> {
    const breakdown: Record<string, number> = {};
    for (const report of this.data.threatReports) {
      breakdown[report.category] = (breakdown[report.category] || 0) + 1;
    }
    return breakdown;
  }

  // --- Blocklist ---
  async getActiveBlocklist(sinceIso?: string): Promise<BlocklistEntry[]> {
    const now = Date.now();
    let blocks = this.data.networkBlocklist.filter(
      (b) => b.is_active && new Date(b.expires_at).getTime() > now
    );

    if (sinceIso) {
      const sinceTime = new Date(sinceIso).getTime();
      blocks = blocks.filter((b) => new Date(b.updated_at).getTime() >= sinceTime);
    }

    return blocks.map((b) => ({ ...b }));
  }

  async getBlocklistEntryByIp(ip: string): Promise<BlocklistEntry | null> {
    const entry = this.data.networkBlocklist.find((b) => b.attacker_ip === ip);
    return entry ? { ...entry } : null;
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
    const now = new Date().toISOString();
    const existingIndex = this.data.networkBlocklist.findIndex(
      (b) => b.attacker_ip === data.attacker_ip
    );

    if (existingIndex >= 0) {
      const existing = this.data.networkBlocklist[existingIndex];
      const updated: BlocklistEntry = {
        ...existing,
        primary_category: data.primary_category,
        confidence: Math.max(existing.confidence, data.confidence),
        corroboration_count: data.corroboration_count,
        is_active: data.is_active,
        expires_at: data.expires_at,
        updated_at: now,
      };
      this.data.networkBlocklist[existingIndex] = updated;
      await this.persist();
      return { ...updated };
    } else {
      const newEntry: BlocklistEntry = {
        id: data.id || crypto.randomUUID(),
        attacker_ip: data.attacker_ip,
        primary_category: data.primary_category,
        confidence: data.confidence,
        corroboration_count: data.corroboration_count,
        is_active: data.is_active,
        first_detected: now,
        expires_at: data.expires_at,
        updated_at: now,
      };
      this.data.networkBlocklist.push(newEntry);
      await this.persist();
      return { ...newEntry };
    }
  }

  async revokeBlocklistEntry(ip: string): Promise<boolean> {
    const entry = this.data.networkBlocklist.find((b) => b.attacker_ip === ip);
    if (!entry) return false;
    entry.is_active = false;
    entry.updated_at = new Date().toISOString();
    await this.persist();
    return true;
  }

  async cleanupExpiredBlocks(): Promise<number> {
    const now = Date.now();
    let expiredCount = 0;
    for (const entry of this.data.networkBlocklist) {
      if (entry.is_active && new Date(entry.expires_at).getTime() <= now) {
        entry.is_active = false;
        entry.updated_at = new Date().toISOString();
        expiredCount++;
      }
    }
    if (expiredCount > 0) {
      await this.persist();
    }
    return expiredCount;
  }

  async countActiveBlocks(): Promise<number> {
    const now = Date.now();
    return this.data.networkBlocklist.filter(
      (b) => b.is_active && new Date(b.expires_at).getTime() > now
    ).length;
  }

  // --- Site Whitelist / Allowlist ---
  async createAllowlistEntry(data: {
    id?: string;
    member_id: string;
    ip_or_cidr: string;
    description?: string | null;
  }): Promise<SiteWhitelist> {
    const entry: SiteWhitelist = {
      id: data.id || crypto.randomUUID(),
      member_id: data.member_id,
      ip_or_cidr: data.ip_or_cidr,
      description: data.description || null,
      created_at: new Date().toISOString(),
    };
    this.data.siteWhitelists.push(entry);
    await this.persist();
    return { ...entry };
  }

  async getAllowlistForMember(memberId: string): Promise<SiteWhitelist[]> {
    return this.data.siteWhitelists
      .filter((w) => w.member_id === memberId)
      .map((w) => ({ ...w }));
  }

  async deleteAllowlistEntry(memberId: string, entryId: string): Promise<boolean> {
    const initialLen = this.data.siteWhitelists.length;
    this.data.siteWhitelists = this.data.siteWhitelists.filter(
      (w) => !(w.member_id === memberId && w.id === entryId)
    );
    const changed = this.data.siteWhitelists.length !== initialLen;
    if (changed) {
      await this.persist();
    }
    return changed;
  }

  // --- Site Telemetry ---
  async createSiteTelemetry(data: {
    id?: string;
    member_id: string;
    blocked_ip: string;
    threat_category: string;
    mitigated_at?: string;
  }): Promise<SiteTelemetry> {
    const entry: SiteTelemetry = {
      id: data.id || crypto.randomUUID(),
      member_id: data.member_id,
      blocked_ip: data.blocked_ip,
      threat_category: data.threat_category,
      mitigated_at: data.mitigated_at || new Date().toISOString(),
    };
    this.data.siteTelemetry.push(entry);
    await this.persist();
    return { ...entry };
  }

  async getTelemetryForMember(memberId: string, limit = 50): Promise<SiteTelemetry[]> {
    return this.data.siteTelemetry
      .filter((t) => t.member_id === memberId)
      .sort((a, b) => new Date(b.mitigated_at).getTime() - new Date(a.mitigated_at).getTime())
      .slice(0, limit)
      .map((t) => ({ ...t }));
  }

  async countTotalMitigations(): Promise<number> {
    const memberTotal = this.data.members.reduce((acc, m) => acc + (m.total_mitigations || 0), 0);
    return Math.max(memberTotal, this.data.siteTelemetry.length);
  }
}
