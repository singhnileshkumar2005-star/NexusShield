import { BlocklistEntry, MemberSite, NetworkStats, ThreatCategory, ThreatEvent } from './types';

export const INITIAL_MEMBERS: MemberSite[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    siteName: 'Alpha Store (E-Commerce)',
    siteUrl: 'http://localhost:4001',
    reputationScore: 4.85,
    isActive: true,
    status: 'online',
    totalMitigations: 1420,
    lastHeartbeat: new Date(Date.now() - 12000).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    apiKeyHash: 'nx_live_hash_alpha_98a76e...',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    siteName: 'Beta SaaS Portal (Enterprise)',
    siteUrl: 'http://localhost:4002',
    reputationScore: 4.92,
    isActive: true,
    status: 'online',
    totalMitigations: 2894,
    lastHeartbeat: new Date(Date.now() - 8000).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    apiKeyHash: 'nx_live_hash_beta_41f23c...',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    siteName: 'Gamma API Gateway',
    siteUrl: 'https://api.gamma-mesh.internal',
    reputationScore: 4.60,
    isActive: true,
    status: 'online',
    totalMitigations: 5310,
    lastHeartbeat: new Date(Date.now() - 25000).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    apiKeyHash: 'nx_live_hash_gamma_12d49b...',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000004',
    siteName: 'Delta Cloud Services',
    siteUrl: 'https://auth.delta-cloud.io',
    reputationScore: 3.90,
    isActive: true,
    status: 'idle',
    totalMitigations: 870,
    lastHeartbeat: new Date(Date.now() - 1000 * 180).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    apiKeyHash: 'nx_live_hash_delta_90aa14...',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    siteName: 'Epsilon Health App',
    siteUrl: 'https://app.epsilon-health.org',
    reputationScore: 4.75,
    isActive: true,
    status: 'online',
    totalMitigations: 1150,
    lastHeartbeat: new Date(Date.now() - 15000).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    apiKeyHash: 'nx_live_hash_eps_55ff09...',
  },
];

export const INITIAL_BLOCKLIST: BlocklistEntry[] = [
  {
    id: 'blk-001',
    attackerIp: '198.51.100.99',
    primaryCategory: 'honeypot_probe',
    confidence: 0.99,
    corroborationCount: 4,
    isActive: true,
    firstDetected: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 47).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    notes: 'Triggered /.env and /wp-config.php honeytraps across 3 member nodes',
  },
  {
    id: 'blk-002',
    attackerIp: '203.0.113.15',
    primaryCategory: 'brute_force',
    confidence: 0.94,
    corroborationCount: 3,
    isActive: true,
    firstDetected: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    notes: 'Exceeded 40 failed credential stuffing attempts per minute',
  },
  {
    id: 'blk-003',
    attackerIp: '192.0.2.77',
    primaryCategory: 'sqli_xss',
    confidence: 0.98,
    corroborationCount: 2,
    isActive: true,
    firstDetected: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    notes: 'Union-based SQL injection signature matched in URI parameters',
  },
  {
    id: 'blk-004',
    attackerIp: '185.220.101.5',
    primaryCategory: 'scanner',
    confidence: 0.91,
    corroborationCount: 5,
    isActive: true,
    firstDetected: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 70).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    notes: 'Mass vulnerability scanner hitting directory traversal paths',
  },
  {
    id: 'blk-005',
    attackerIp: '45.143.203.18',
    primaryCategory: 'rate_abuse',
    confidence: 0.88,
    corroborationCount: 2,
    isActive: true,
    firstDetected: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    notes: 'Layer 7 mini-burst flood exceeding 180 req/sec threshold',
  },
  {
    id: 'blk-006',
    attackerIp: '194.26.29.112',
    primaryCategory: 'sqli_xss',
    confidence: 0.96,
    corroborationCount: 3,
    isActive: true,
    firstDetected: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    notes: 'Blind boolean-based SQL injection probe detected',
  },
  {
    id: 'blk-007',
    attackerIp: '103.152.220.4',
    primaryCategory: 'honeypot_probe',
    confidence: 0.97,
    corroborationCount: 4,
    isActive: true,
    firstDetected: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    notes: 'Automated crawler targeting hidden /api/internal/debug endpoints',
  },
];

export const INITIAL_THREAT_EVENTS: ThreatEvent[] = [
  {
    id: 'evt-101',
    attackerIp: '198.51.100.99',
    category: 'honeypot_probe',
    confidence: 0.99,
    timestamp: new Date(Date.now() - 1000 * 8).toISOString(),
    action: 'blocked',
    corroborationCount: 4,
    reporterMeshId: 'node-alpha-4001',
    payloadSignature: 'HONEYPOT_HIT:/.env',
    geo: { country: 'US', city: 'Ashburn', lat: 39.0438, lng: -77.4874 }
  },
  {
    id: 'evt-102',
    attackerIp: '203.0.113.88',
    category: 'sqli_xss',
    confidence: 0.95,
    timestamp: new Date(Date.now() - 1000 * 22).toISOString(),
    action: 'corroborated',
    corroborationCount: 2,
    reporterMeshId: 'node-beta-4002',
    payloadSignature: 'SQLI_UNION_SELECT',
    geo: { country: 'DE', city: 'Frankfurt', lat: 50.1109, lng: 8.6821 }
  },
  {
    id: 'evt-103',
    attackerIp: '203.0.113.15',
    category: 'brute_force',
    confidence: 0.94,
    timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    action: 'blocked',
    corroborationCount: 3,
    reporterMeshId: 'node-gamma-auth',
    payloadSignature: 'AUTH_BURST_FAILED',
    geo: { country: 'NL', city: 'Amsterdam', lat: 52.3676, lng: 4.9041 }
  },
  {
    id: 'evt-104',
    attackerIp: '45.143.203.18',
    category: 'rate_abuse',
    confidence: 0.88,
    timestamp: new Date(Date.now() - 1000 * 75).toISOString(),
    action: 'blocked',
    corroborationCount: 2,
    reporterMeshId: 'node-alpha-4001',
    payloadSignature: 'RPS_LIMIT_EXCEEDED',
    geo: { country: 'GB', city: 'London', lat: 51.5074, lng: -0.1278 }
  },
  {
    id: 'evt-105',
    attackerIp: '185.220.101.5',
    category: 'scanner',
    confidence: 0.92,
    timestamp: new Date(Date.now() - 1000 * 110).toISOString(),
    action: 'corroborated',
    corroborationCount: 5,
    reporterMeshId: 'node-epsilon-health',
    payloadSignature: 'PATH_TRAVERSAL_DIR_SCAN',
    geo: { country: 'SG', city: 'Singapore', lat: 1.3521, lng: 103.8198 }
  },
  {
    id: 'evt-106',
    attackerIp: '192.0.2.77',
    category: 'sqli_xss',
    confidence: 0.97,
    timestamp: new Date(Date.now() - 1000 * 150).toISOString(),
    action: 'blocked',
    corroborationCount: 2,
    reporterMeshId: 'node-delta-cloud',
    payloadSignature: 'XSS_SCRIPT_PROBE',
    geo: { country: 'FR', city: 'Paris', lat: 48.8566, lng: 2.3522 }
  },
];

export const INITIAL_NETWORK_STATS: NetworkStats = {
  totalAttacksMitigated: 11644,
  activeBlockedIps: 42,
  connectedMemberSites: 5,
  meshHealthPercent: 99.8,
  hubStatus: 'connected',
  attacksToday: 1842,
  avgCorroborationTimeMs: 38,
  lastSyncTime: new Date().toISOString(),
  categoryBreakdown: [
    { category: 'brute_force', label: 'Brute Force / Credential Stuffing', count: 4230, percentage: 36, color: '#3ecf8e' },
    { category: 'honeypot_probe', label: 'Honeypot & Recon Scanners', count: 3510, percentage: 30, color: '#bda4ff' },
    { category: 'sqli_xss', label: 'SQL Injection & XSS Payloads', count: 2450, percentage: 21, color: '#006239' },
    { category: 'rate_abuse', label: 'L7 Rate Abuse & Burst Flood', count: 1454, percentage: 13, color: '#525252' },
  ],
  timelineData: [
    { time: '00:00', brute_force: 38, honeypot_probe: 24, sqli_xss: 18, rate_abuse: 8, scanner: 12, total: 100 },
    { time: '03:00', brute_force: 52, honeypot_probe: 35, sqli_xss: 22, rate_abuse: 14, scanner: 18, total: 141 },
    { time: '06:00', brute_force: 41, honeypot_probe: 29, sqli_xss: 15, rate_abuse: 11, scanner: 14, total: 110 },
    { time: '09:00', brute_force: 89, honeypot_probe: 67, sqli_xss: 45, rate_abuse: 28, scanner: 33, total: 262 },
    { time: '12:00', brute_force: 115, honeypot_probe: 92, sqli_xss: 62, rate_abuse: 41, scanner: 48, total: 358 },
    { time: '15:00', brute_force: 134, honeypot_probe: 108, sqli_xss: 71, rate_abuse: 49, scanner: 55, total: 417 },
    { time: '18:00', brute_force: 122, honeypot_probe: 95, sqli_xss: 58, rate_abuse: 37, scanner: 42, total: 354 },
    { time: '21:00', brute_force: 98, honeypot_probe: 78, sqli_xss: 49, rate_abuse: 29, scanner: 36, total: 290 },
  ],
};

const SAMPLE_IPS = [
  '198.51.100.42', '203.0.113.19', '192.0.2.144', '185.190.140.2', 
  '91.240.118.89', '45.154.255.10', '194.38.20.91', '109.237.103.44',
  '195.123.245.8', '193.106.191.22', '185.176.43.120', '45.146.165.37'
];

const CATEGORIES: ThreatCategory[] = ['brute_force', 'honeypot_probe', 'sqli_xss', 'rate_abuse', 'scanner'];

const GEO_CITIES = [
  { country: 'US', city: 'Ashburn', lat: 39.0438, lng: -77.4874 },
  { country: 'DE', city: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
  { country: 'NL', city: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { country: 'GB', city: 'London', lat: 51.5074, lng: -0.1278 },
  { country: 'SG', city: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { country: 'JP', city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { country: 'FR', city: 'Paris', lat: 48.8566, lng: 2.3522 },
  { country: 'CA', city: 'Montreal', lat: 45.5017, lng: -73.5673 },
  { country: 'AU', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { country: 'BR', city: 'São Paulo', lat: -23.5505, lng: -46.6333 },
];

export function generateSimulatedThreatEvent(): ThreatEvent {
  const ip = SAMPLE_IPS[Math.floor(Math.random() * SAMPLE_IPS.length)];
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const confidence = Number((0.82 + Math.random() * 0.17).toFixed(2));
  const corroborationCount = Math.floor(Math.random() * 4) + 1;
  const geo = GEO_CITIES[Math.floor(Math.random() * GEO_CITIES.length)];
  const nodeNames = ['node-alpha-4001', 'node-beta-4002', 'node-gamma-auth', 'node-delta-cloud', 'node-epsilon-health'];
  const reporterMeshId = nodeNames[Math.floor(Math.random() * nodeNames.length)];

  let payloadSignature = 'ANOMALOUS_PATTERN';
  if (category === 'brute_force') payloadSignature = 'AUTH_BURST_ATTACK';
  else if (category === 'honeypot_probe') payloadSignature = 'PROBE:/.env.backup';
  else if (category === 'sqli_xss') payloadSignature = 'SQLI:UNION_ALL_SELECT';
  else if (category === 'rate_abuse') payloadSignature = 'BURST_RPS_EXCEEDED';
  else if (category === 'scanner') payloadSignature = 'CVE_SCANNER_ZGRAB';

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    attackerIp: ip,
    category,
    confidence,
    timestamp: new Date().toISOString(),
    action: corroborationCount >= 2 || confidence >= 0.90 ? 'blocked' : 'corroborated',
    corroborationCount,
    reporterMeshId,
    payloadSignature,
    geo,
  };
}
