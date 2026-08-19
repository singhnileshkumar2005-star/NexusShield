import {
  Site,
  MitigatedAttack,
  AllowlistEntry,
  SiteStats,
  HourlyAttackPoint,
  CategoryBreakdown,
  SetupFrameworkGuide,
} from './types';

export const INITIAL_SITES: Site[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    site_name: 'Alpha Store (E-Commerce)',
    site_url: 'https://alpha-store.example.com',
    api_key_masked: 'nx_live_alpha_••••••••••••••••3a9f',
    api_key_full: 'nx_live_alpha_9f82ab7140e184c2bb60913a9f',
    reputation_score: 4.95,
    reputation_tier: 'Tier 1 (Verified Sovereign)',
    is_active: true,
    total_mitigations: 418,
    last_heartbeat: new Date(Date.now() - 4000).toISOString(),
    threat_level: 'LOW',
    agent_latency_ms: '< 0.08 ms',
    created_at: '2026-07-10T08:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    site_name: 'Beta SaaS Dashboard',
    site_url: 'https://beta-app.example.com',
    api_key_masked: 'nx_live_beta_••••••••••••••••8d14',
    api_key_full: 'nx_live_beta_3d1490288fca9bc489218d14',
    reputation_score: 4.82,
    reputation_tier: 'Tier 1 (Verified Sovereign)',
    is_active: true,
    total_mitigations: 892,
    last_heartbeat: new Date(Date.now() - 6000).toISOString(),
    threat_level: 'ELEVATED',
    agent_latency_ms: '< 0.09 ms',
    created_at: '2026-06-15T12:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    site_name: 'Gamma Microservices API Gateway',
    site_url: 'https://api.gamma-services.internal',
    api_key_masked: 'nx_live_gamma_••••••••••••••••7c29',
    api_key_full: 'nx_live_gamma_7c2901a5e12f04ad80217c29',
    reputation_score: 4.70,
    reputation_tier: 'Tier 1 (Verified Sovereign)',
    is_active: true,
    total_mitigations: 1240,
    last_heartbeat: new Date(Date.now() - 2000).toISOString(),
    threat_level: 'LOW',
    agent_latency_ms: '< 0.06 ms',
    created_at: '2026-05-01T10:30:00Z',
  },
];

export const INITIAL_ALLOWLIST: Record<string, AllowlistEntry[]> = {
  'a0000000-0000-0000-0000-000000000001': [
    {
      id: 'wl-101',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      ip_or_cidr: '127.0.0.1',
      description: 'Localhost / Loopback Dev Environment',
      created_at: '2026-08-01T10:00:00Z',
      is_active: true,
      bypassed_count: 1420,
    },
    {
      id: 'wl-102',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      ip_or_cidr: '198.51.100.24/29',
      description: 'Corporate Headquarters VPN Gateway (San Francisco)',
      created_at: '2026-08-05T14:30:00Z',
      is_active: true,
      bypassed_count: 389,
    },
    {
      id: 'wl-103',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      ip_or_cidr: '203.0.113.88',
      description: 'Lead Security Auditor Workstation',
      created_at: '2026-08-12T09:15:00Z',
      is_active: true,
      bypassed_count: 76,
    },
  ],
  'b0000000-0000-0000-0000-000000000002': [
    {
      id: 'wl-201',
      member_id: 'b0000000-0000-0000-0000-000000000002',
      ip_or_cidr: '10.0.0.0/16',
      description: 'Internal Kubernetes Private VPC Subnet',
      created_at: '2026-07-20T11:00:00Z',
      is_active: true,
      bypassed_count: 5201,
    },
    {
      id: 'wl-202',
      member_id: 'b0000000-0000-0000-0000-000000000002',
      ip_or_cidr: '192.0.2.14',
      description: 'Continuous Integration GitHub Runner IP',
      created_at: '2026-08-10T16:45:00Z',
      is_active: true,
      bypassed_count: 812,
    },
  ],
  'c0000000-0000-0000-0000-000000000003': [
    {
      id: 'wl-301',
      member_id: 'c0000000-0000-0000-0000-000000000003',
      ip_or_cidr: '172.16.0.0/12',
      description: 'Datacenter Transit Mesh Gateway',
      created_at: '2026-06-01T08:00:00Z',
      is_active: true,
      bypassed_count: 12044,
    },
  ],
};

export const INITIAL_ATTACKS: Record<string, MitigatedAttack[]> = {
  'a0000000-0000-0000-0000-000000000001': [
    {
      id: 'atk-001',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      attacker_ip: '198.51.100.99',
      category: 'honeypot_probe',
      confidence: 0.98,
      corroboration_count: 6,
      action: 'BLOCKED_403',
      target_endpoint: '/.env',
      http_method: 'GET',
      user_agent_excerpt: 'Mozilla/5.0 (HydraScanner/2.4)',
      origin_geo: { country: 'DE', city: 'Frankfurt', flag: '🇩🇪' },
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
    {
      id: 'atk-002',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      attacker_ip: '203.0.113.15',
      category: 'brute_force',
      confidence: 0.94,
      corroboration_count: 4,
      action: 'BLOCKED_403',
      target_endpoint: '/api/auth/login',
      http_method: 'POST',
      user_agent_excerpt: 'Python-requests/2.31.0',
      origin_geo: { country: 'NL', city: 'Amsterdam', flag: '🇳🇱' },
      timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    },
    {
      id: 'atk-003',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      attacker_ip: '192.0.2.77',
      category: 'sqli_xss',
      confidence: 0.99,
      corroboration_count: 3,
      action: 'BLOCKED_403',
      target_endpoint: '/api/products?query=UNION+SELECT+1,version()--',
      http_method: 'GET',
      user_agent_excerpt: 'sqlmap/1.8.4#stable',
      origin_geo: { country: 'US', city: 'Ashburn', flag: '🇺🇸' },
      timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    },
    {
      id: 'atk-004',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      attacker_ip: '45.154.255.81',
      category: 'rate_abuse',
      confidence: 0.91,
      corroboration_count: 2,
      action: 'RATE_LIMITED_429',
      target_endpoint: '/checkout/process',
      http_method: 'POST',
      user_agent_excerpt: 'curl/8.4.0',
      origin_geo: { country: 'RO', city: 'Bucharest', flag: '🇷🇴' },
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'atk-005',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      attacker_ip: '185.220.101.5',
      category: 'scanner',
      confidence: 0.89,
      corroboration_count: 5,
      action: 'BLOCKED_403',
      target_endpoint: '/wp-login.php',
      http_method: 'GET',
      user_agent_excerpt: 'Go-http-client/1.1',
      origin_geo: { country: 'IS', city: 'Reykjavik', flag: '🇮🇸' },
      timestamp: new Date(Date.now() - 1000 * 60 * 78).toISOString(),
    },
    {
      id: 'atk-006',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      attacker_ip: '91.240.118.172',
      category: 'credential_stuffing',
      confidence: 0.96,
      corroboration_count: 7,
      action: 'BLOCKED_403',
      target_endpoint: '/api/auth/login',
      http_method: 'POST',
      user_agent_excerpt: 'Mozilla/5.0 (Windows NT 10.0; Win64)',
      origin_geo: { country: 'PL', city: 'Warsaw', flag: '🇵🇱' },
      timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    },
    {
      id: 'atk-007',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      attacker_ip: '194.26.29.112',
      category: 'honeypot_probe',
      confidence: 0.97,
      corroboration_count: 4,
      action: 'BLOCKED_403',
      target_endpoint: '/aws-credentials.json',
      http_method: 'GET',
      user_agent_excerpt: 'Nuclei - Vulnerability Scanner',
      origin_geo: { country: 'FR', city: 'Paris', flag: '🇫🇷' },
      timestamp: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    },
    {
      id: 'atk-008',
      member_id: 'a0000000-0000-0000-0000-000000000001',
      attacker_ip: '103.208.220.14',
      category: 'sqli_xss',
      confidence: 0.93,
      corroboration_count: 3,
      action: 'BLOCKED_403',
      target_endpoint: '/api/reviews?item=<script>fetch("evil.com")</script>',
      http_method: 'POST',
      user_agent_excerpt: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      origin_geo: { country: 'SG', city: 'Singapore', flag: '🇸🇬' },
      timestamp: new Date(Date.now() - 1000 * 60 * 270).toISOString(),
    },
  ],
  'b0000000-0000-0000-0000-000000000002': [
    {
      id: 'atk-201',
      member_id: 'b0000000-0000-0000-0000-000000000002',
      attacker_ip: '178.62.204.18',
      category: 'rate_abuse',
      confidence: 0.95,
      corroboration_count: 8,
      action: 'RATE_LIMITED_429',
      target_endpoint: '/graphql',
      http_method: 'POST',
      user_agent_excerpt: 'k6-load-tester/0.48.0',
      origin_geo: { country: 'GB', city: 'London', flag: '🇬🇧' },
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'atk-202',
      member_id: 'b0000000-0000-0000-0000-000000000002',
      attacker_ip: '198.51.100.99',
      category: 'honeypot_probe',
      confidence: 0.99,
      corroboration_count: 9,
      action: 'BLOCKED_403',
      target_endpoint: '/admin/config.php',
      http_method: 'GET',
      user_agent_excerpt: 'ZGrab/0.x',
      origin_geo: { country: 'DE', city: 'Frankfurt', flag: '🇩🇪' },
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
  ],
  'c0000000-0000-0000-0000-000000000003': [
    {
      id: 'atk-301',
      member_id: 'c0000000-0000-0000-0000-000000000003',
      attacker_ip: '194.26.29.112',
      category: 'scanner',
      confidence: 0.99,
      corroboration_count: 11,
      action: 'BLOCKED_403',
      target_endpoint: '/v1/internal/health',
      http_method: 'GET',
      user_agent_excerpt: 'Masscan/1.3.2',
      origin_geo: { country: 'FR', city: 'Paris', flag: '🇫🇷' },
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
  ],
};

export const MOCK_HOURLY_DATA: HourlyAttackPoint[] = [
  { hour: '00:00', attacks: 12, sqli_xss: 4, brute_force: 3, rate_abuse: 3, honeypot: 2 },
  { hour: '02:00', attacks: 18, sqli_xss: 6, brute_force: 5, rate_abuse: 4, honeypot: 3 },
  { hour: '04:00', attacks: 29, sqli_xss: 9, brute_force: 11, rate_abuse: 5, honeypot: 4 },
  { hour: '06:00', attacks: 15, sqli_xss: 3, brute_force: 6, rate_abuse: 3, honeypot: 3 },
  { hour: '08:00', attacks: 34, sqli_xss: 12, brute_force: 10, rate_abuse: 8, honeypot: 4 },
  { hour: '10:00', attacks: 48, sqli_xss: 16, brute_force: 15, rate_abuse: 11, honeypot: 6 },
  { hour: '12:00', attacks: 42, sqli_xss: 14, brute_force: 12, rate_abuse: 10, honeypot: 6 },
  { hour: '14:00', attacks: 58, sqli_xss: 21, brute_force: 18, rate_abuse: 12, honeypot: 7 },
  { hour: '16:00', attacks: 51, sqli_xss: 19, brute_force: 14, rate_abuse: 11, honeypot: 7 },
  { hour: '18:00', attacks: 39, sqli_xss: 13, brute_force: 11, rate_abuse: 9, honeypot: 6 },
  { hour: '20:00', attacks: 44, sqli_xss: 15, brute_force: 13, rate_abuse: 10, honeypot: 6 },
  { hour: '22:00', attacks: 28, sqli_xss: 8, brute_force: 9, rate_abuse: 6, honeypot: 5 },
];

export const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: 'brute_force', displayName: 'Brute Force Logins', count: 142, percentage: 34 },
  { category: 'sqli_xss', displayName: 'SQLi / XSS Injection', count: 126, percentage: 30 },
  { category: 'honeypot_probe', displayName: 'Honeypot Trap Trigger', count: 75, percentage: 18 },
  { category: 'rate_abuse', displayName: 'Rate Limit Abuse / Burst', count: 54, percentage: 13 },
  { category: 'scanner', displayName: 'Malicious Vulnerability Scanners', count: 21, percentage: 5 },
];

export const FRAMEWORK_GUIDES: SetupFrameworkGuide[] = [
  {
    id: 'nextjs',
    name: 'Next.js',
    badge: 'App Router / Edge & Node',
    installCommand: 'npm install @nexussecure/agent',
    filename: 'middleware.ts',
    description: 'Intercepts incoming malicious requests right at the Edge or Node runtime before route rendering.',
    features: [
      'Zero latency in-memory local cache',
      'Automatic honeypot route trapping',
      'XSS and SQLi header & query sanitization',
      'Edge & Serverless runtime compatible',
    ],
    codeSnippet: `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createNexusSecureMiddleware } from '@nexussecure/agent';

const nexusSecurity = createNexusSecureMiddleware({
  apiKey: process.env.NEXUS_API_KEY || '{{API_KEY}}',
  hubUrl: process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:3000',
  sensitiveAuthPaths: ['/api/auth', '/login', '/admin'],
  enableHoneypots: true,
  honeypotPaths: ['/.env', '/wp-admin', '/aws.json'],
  enableSqliXssFilter: true,
  enableRateLimiting: true,
  maxRequestsPerSec: 30,
});

export async function middleware(request: NextRequest) {
  // Check request with NexusSecure agent (<0.1ms local memory evaluation)
  const securityVerdict = await nexusSecurity.checkRequest(request);

  if (securityVerdict.blocked) {
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        reason: 'Blocked by NexusSecure Threat Intelligence Mesh',
        category: securityVerdict.category,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'X-NexusSecure-Verdict': 'BLOCKED' },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};`,
  },
  {
    id: 'express',
    name: 'Express.js',
    badge: 'Node.js Framework',
    installCommand: 'npm install @nexussecure/agent express',
    filename: 'app.js',
    description: 'Plug-and-play middleware protecting Express routes, REST APIs, and auth endpoints.',
    features: [
      'Instant Express req/res pipeline integration',
      'Brute-force login tracking with 401 hooks',
      'Automated background IoC blocklist polling',
      'Custom bypass for allowlisted IP ranges',
    ],
    codeSnippet: `import express from 'express';
import { nexusSecureExpress } from '@nexussecure/agent';

const app = express();
app.use(express.json());

// Attach NexusSecure Defense Mesh Middleware
app.use(
  nexusSecureExpress({
    apiKey: process.env.NEXUS_API_KEY || '{{API_KEY}}',
    hubUrl: process.env.NEXUS_HUB_URL || 'http://localhost:3000',
    siteName: '{{SITE_NAME}}',
    sensitiveAuthPaths: ['/api/auth/login', '/login', '/checkout'],
    maxFailedLogins: 4,
    failedLoginWindowSec: 30,
    enableHoneypots: true,
    enableSqliXssFilter: true,
    enableRateLimiting: true,
    maxRequestsPerSec: 30,
  })
);

app.get('/api/products', (req, res) => {
  res.json({ status: 'success', data: [{ id: 1, name: 'Secure Item' }] });
});

app.listen(3000, () => console.log('Protected server running on port 3000'));`,
  },
  {
    id: 'fastify',
    name: 'Fastify',
    badge: 'High-Performance Node',
    installCommand: 'npm install @nexussecure/agent fastify',
    filename: 'server.ts',
    description: 'Blazing fast onRequest hook integration for high-throughput microservices.',
    features: [
      'High-throughput native Fastify plugin',
      'Async non-blocking threat reporting',
      'Local CIDR allowlist engine',
      'Zero allocation request filtering',
    ],
    codeSnippet: `import Fastify from 'fastify';
import { nexusSecureFastify } from '@nexussecure/agent';

const fastify = Fastify({ logger: true });

// Register NexusSecure Fastify Plugin
await fastify.register(nexusSecureFastify, {
  apiKey: process.env.NEXUS_API_KEY || '{{API_KEY}}',
  hubUrl: process.env.NEXUS_HUB_URL || 'http://localhost:3000',
  siteName: '{{SITE_NAME}}',
  sensitiveAuthPaths: ['/auth/login', '/oauth/token'],
  enableHoneypots: true,
  enableSqliXssFilter: true,
});

fastify.get('/api/health', async (request, reply) => {
  return { status: 'healthy', meshConnected: true };
});

fastify.listen({ port: 3000 });`,
  },
  {
    id: 'node-http',
    name: 'Node HTTP / Vanilla',
    badge: 'Zero-Framework Node.js',
    installCommand: 'npm install @nexussecure/agent',
    filename: 'index.mjs',
    description: 'Lightweight pure Node.js HTTP server handler for micro-daemons and serverless containers.',
    features: [
      'Works with standard http.createServer',
      'Zero third-party runtime framework dependencies',
      'Synchronous in-memory blocklist checking',
      'Custom failure-safe fallback strategy',
    ],
    codeSnippet: `import http from 'node:http';
import { NexusSecureAgent } from '@nexussecure/agent';

const agent = new NexusSecureAgent({
  apiKey: process.env.NEXUS_API_KEY || '{{API_KEY}}',
  hubUrl: process.env.NEXUS_HUB_URL || 'http://localhost:3000',
  siteName: '{{SITE_NAME}}',
});

// Initialize background sync with Hub
await agent.startSync();

const server = http.createServer(async (req, res) => {
  const clientIp = req.socket.remoteAddress || '127.0.0.1';

  // Fast local lookup
  if (agent.isBlocked(clientIp)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Access Denied: Blocked by NexusSecure Mesh' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from secure pure Node.js!' }));
});

server.listen(4000);`,
  },
  {
    id: 'php-wordpress',
    name: 'PHP / WordPress',
    badge: 'WordPress Plugin / Vanilla PHP',
    installCommand: '# Copy nexussecure-shield.php to wp-content/plugins/ or include in index.php',
    filename: 'nexussecure-shield.php',
    description: 'Drop-in single-file security plugin for WordPress, Laravel, or raw PHP servers.',
    features: [
      'Single drop-in PHP file, zero composer dependencies required',
      'Local APCu / File cache for instantaneous blocklist checking',
      'Automatic wp-login.php & xmlrpc.php brute force traps',
      'Fail-open architecture ensures 100% site availability',
    ],
    codeSnippet: `<?php
/**
 * Plugin Name: NexusSecure Threat Mesh Shield
 * Description: Collaborative real-time threat prevention for WordPress.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) exit;

class NexusSecureShield {
    private static $apiKey = '{{API_KEY}}';
    private static $hubUrl = 'http://localhost:3000';
    private static $cacheFile = '/tmp/nexussecure_blocklist.json';

    public static function init() {
        add_action('init', [__CLASS__, 'inspectRequest'], 1);
        add_action('wp_login_failed', [__CLASS__, 'handleLoginFailure']);
    }

    public static function inspectRequest() {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
        if (self::isIpBlocked($ip)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Forbidden',
                'reason' => 'IP blocked by NexusSecure Collaborative Mesh'
            ]);
            exit;
        }
    }

    private static function isIpBlocked($ip) {
        if (!file_exists(self::$cacheFile)) return false;
        $blockedIps = json_decode(@file_get_contents(self::$cacheFile), true) ?: [];
        return in_array($ip, $blockedIps, true);
    }

    public static function handleLoginFailure($username) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        self::reportThreat($ip, 'brute_force', 0.90);
    }

    private static function reportThreat($ip, $category, $confidence) {
        $data = json_encode(['ip' => $ip, 'category' => $category, 'confidence' => $confidence]);
        $ch = curl_init(self::$hubUrl . '/v1/report');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . self::$apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_TIMEOUT_MS, 300);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        @curl_exec($ch);
        curl_close($ch);
    }
}

NexusSecureShield::init();`,
  },
];
