import crypto from 'crypto';
import config from '../config';
import { getDataStore } from '../db';
import { Member, SanitizedMember } from '../types';

export class AuthService {
  /**
   * Hashes an API key using SHA-256 for secure storage & comparison
   */
  static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey.trim()).digest('hex');
  }

  /**
   * Generates a new cryptographically secure API key with configured prefix
   */
  static generateApiKey(): { apiKey: string; apiKeyHash: string } {
    const randomHex = crypto.randomBytes(24).toString('hex');
    const apiKey = `${config.apiKeyPrefix}${randomHex}`;
    const apiKeyHash = this.hashApiKey(apiKey);
    return { apiKey, apiKeyHash };
  }

  /**
   * Sanitizes a member record for API responses (removes private hash)
   */
  static sanitizeMember(member: Member): SanitizedMember {
    return {
      id: member.id,
      site_name: member.site_name,
      site_url: member.site_url,
      reputation_score: member.reputation_score,
      is_active: member.is_active,
      total_mitigations: member.total_mitigations,
      last_heartbeat: member.last_heartbeat,
      created_at: member.created_at,
      updated_at: member.updated_at,
    };
  }

  /**
   * Registers a new site node in the mesh
   */
  static async registerMember(data: {
    siteName: string;
    siteUrl?: string;
  }): Promise<{ member: SanitizedMember; apiKey: string }> {
    const store = await getDataStore();
    const { apiKey, apiKeyHash } = this.generateApiKey();

    const member = await store.createMember({
      site_name: data.siteName.trim(),
      site_url: data.siteUrl ? data.siteUrl.trim() : null,
      api_key_hash: apiKeyHash,
      reputation_score: 1.0,
      total_mitigations: 0,
    });

    return {
      member: this.sanitizeMember(member),
      apiKey,
    };
  }

  /**
   * Verifies an incoming API key and retrieves the active member record
   */
  static async verifyApiKey(apiKey: string): Promise<Member | null> {
    if (!apiKey || typeof apiKey !== 'string') return null;

    // Check if it's the admin master key
    if (apiKey === config.adminApiKey) {
      return {
        id: '00000000-0000-0000-0000-000000000000',
        site_name: 'Nexus Admin Master',
        site_url: null,
        api_key_hash: this.hashApiKey(config.adminApiKey),
        reputation_score: 5.0,
        is_active: true,
        total_mitigations: 0,
        last_heartbeat: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const hash = this.hashApiKey(apiKey);
    const store = await getDataStore();
    return await store.getMemberByApiKeyHash(hash);
  }

  /**
   * Retrieves a member by ID
   */
  static async getMemberById(id: string): Promise<SanitizedMember | null> {
    const store = await getDataStore();
    const member = await store.getMemberById(id);
    return member ? this.sanitizeMember(member) : null;
  }

  /**
   * Lists all members in the mesh (admin view)
   */
  static async listMembers(): Promise<SanitizedMember[]> {
    const store = await getDataStore();
    const members = await store.listMembers();
    return members.map((m) => this.sanitizeMember(m));
  }
}
