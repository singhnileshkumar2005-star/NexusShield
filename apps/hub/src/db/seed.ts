import crypto from 'crypto';
import { Member, ThreatReport, BlocklistEntry, SiteWhitelist, SiteTelemetry } from '../types';

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export interface InitialData {
  members: Member[];
  threatReports: ThreatReport[];
  networkBlocklist: BlocklistEntry[];
  siteWhitelists: SiteWhitelist[];
  siteTelemetry: SiteTelemetry[];
}

export function getSeedData(): InitialData {
  const now = new Date();
  const nowIso = now.toISOString();

  // Pre-calculated hashes for demo keys
  const alphaApiKey = 'nx_live_alpha1234567890abcdef1234567890';
  const betaApiKey = 'nx_live_beta1234567890abcdef1234567890';
  const gammaApiKey = 'nx_live_gamma1234567890abcdef123456789';

  const memberAlpha: Member = {
    id: 'a0000000-0000-0000-0000-000000000001',
    site_name: 'Alpha Store (Demo)',
    site_url: 'http://localhost:4001',
    api_key_hash: sha256(alphaApiKey),
    reputation_score: 1.5,
    is_active: true,
    total_mitigations: 142,
    last_heartbeat: new Date(Date.now() - 60000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: nowIso,
  };

  const memberBeta: Member = {
    id: 'b0000000-0000-0000-0000-000000000002',
    site_name: 'Beta SaaS Portal (Demo)',
    site_url: 'http://localhost:4002',
    api_key_hash: sha256(betaApiKey),
    reputation_score: 2.1,
    is_active: true,
    total_mitigations: 289,
    last_heartbeat: new Date(Date.now() - 120000).toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: nowIso,
  };

  const memberGamma: Member = {
    id: 'c0000000-0000-0000-0000-000000000003',
    site_name: 'Gamma Cloud API (Demo)',
    site_url: 'http://localhost:4003',
    api_key_hash: sha256(gammaApiKey),
    reputation_score: 3.4,
    is_active: true,
    total_mitigations: 512,
    last_heartbeat: new Date(Date.now() - 30000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: nowIso,
  };

  const members: Member[] = [memberAlpha, memberBeta, memberGamma];

  const networkBlocklist: BlocklistEntry[] = [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      attacker_ip: '198.51.100.99',
      primary_category: 'honeypot_probe',
      confidence: 0.98,
      corroboration_count: 4,
      is_active: true,
      first_detected: new Date(Date.now() - 3600000 * 4).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      updated_at: nowIso,
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      attacker_ip: '203.0.113.15',
      primary_category: 'brute_force',
      confidence: 0.92,
      corroboration_count: 3,
      is_active: true,
      first_detected: new Date(Date.now() - 3600000 * 8).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 1).toISOString(),
      updated_at: nowIso,
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      attacker_ip: '192.0.2.77',
      primary_category: 'sqli_xss',
      confidence: 0.95,
      corroboration_count: 2,
      is_active: true,
      first_detected: new Date(Date.now() - 3600000 * 12).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 18).toISOString(),
      updated_at: nowIso,
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      attacker_ip: '185.220.101.5',
      primary_category: 'scanner',
      confidence: 0.88,
      corroboration_count: 2,
      is_active: true,
      first_detected: new Date(Date.now() - 3600000 * 2).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 22).toISOString(),
      updated_at: nowIso,
    },
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      attacker_ip: '45.154.255.89',
      primary_category: 'rate_abuse',
      confidence: 0.91,
      corroboration_count: 3,
      is_active: true,
      first_detected: new Date(Date.now() - 3600000 * 6).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 36).toISOString(),
      updated_at: nowIso,
    },
  ];

  const threatReports: ThreatReport[] = [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      reporter_member_id: memberAlpha.id,
      attacker_ip: '198.51.100.99',
      category: 'honeypot_probe',
      confidence: 0.98,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      reporter_member_id: memberBeta.id,
      attacker_ip: '198.51.100.99',
      category: 'honeypot_probe',
      confidence: 0.95,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'e0000000-0000-0000-0000-000000000003',
      reporter_member_id: memberGamma.id,
      attacker_ip: '203.0.113.15',
      category: 'brute_force',
      confidence: 0.9,
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'e0000000-0000-0000-0000-000000000004',
      reporter_member_id: memberAlpha.id,
      attacker_ip: '203.0.113.15',
      category: 'brute_force',
      confidence: 0.94,
      created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    },
    {
      id: 'e0000000-0000-0000-0000-000000000005',
      reporter_member_id: memberBeta.id,
      attacker_ip: '192.0.2.77',
      category: 'sqli_xss',
      confidence: 0.95,
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'e0000000-0000-0000-0000-000000000006',
      reporter_member_id: memberGamma.id,
      attacker_ip: '45.154.255.89',
      category: 'rate_abuse',
      confidence: 0.92,
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ];

  const siteWhitelists: SiteWhitelist[] = [
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      member_id: memberAlpha.id,
      ip_or_cidr: '127.0.0.1',
      description: 'Localhost developer loopback',
      created_at: nowIso,
    },
    {
      id: 'f0000000-0000-0000-0000-000000000002',
      member_id: memberBeta.id,
      ip_or_cidr: '10.0.0.0/8',
      description: 'Internal corporate VPN',
      created_at: nowIso,
    },
  ];

  const siteTelemetry: SiteTelemetry[] = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      member_id: memberAlpha.id,
      blocked_ip: '198.51.100.99',
      threat_category: 'honeypot_probe',
      mitigated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      member_id: memberAlpha.id,
      blocked_ip: '203.0.113.15',
      threat_category: 'brute_force',
      mitigated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      member_id: memberBeta.id,
      blocked_ip: '192.0.2.77',
      threat_category: 'sqli_xss',
      mitigated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      member_id: memberGamma.id,
      blocked_ip: '45.154.255.89',
      threat_category: 'rate_abuse',
      mitigated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ];

  return {
    members,
    threatReports,
    networkBlocklist,
    siteWhitelists,
    siteTelemetry,
  };
}
