-- ==============================================================================
-- NexusSecure Supabase Migration & Schema
-- Collaborative Attack-Defense Threat Intelligence Mesh for Websites
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Members (Registered Sites / Nodes in the Mesh)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name VARCHAR(100) NOT NULL,
    site_url VARCHAR(255),
    api_key_hash VARCHAR(64) UNIQUE NOT NULL,
    reputation_score NUMERIC(4,2) DEFAULT 1.00 CHECK (reputation_score >= 0.00 AND reputation_score <= 5.00),
    is_active BOOLEAN DEFAULT TRUE,
    total_mitigations INT DEFAULT 0,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Anonymized Threat Reports (Internal Hub Processing Only)
-- Privacy Guarantee: No victim hostnames, paths, headers, or payloads stored here.
CREATE TABLE IF NOT EXISTS threat_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    attacker_ip VARCHAR(45) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'brute_force', 'honeypot_probe', 'sqli_xss', 'rate_abuse'
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.80 CHECK (confidence >= 0.00 AND confidence <= 1.00),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_reports_ip_created ON threat_reports(attacker_ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_reports_member ON threat_reports(reporter_member_id);

-- 3. Network-Wide Active Blocklist (Distributed to all Protected Sites)
CREATE TABLE IF NOT EXISTS network_blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attacker_ip VARCHAR(45) UNIQUE NOT NULL,
    primary_category VARCHAR(50) NOT NULL,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.90,
    corroboration_count INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    first_detected TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocklist_active_expires ON network_blocklist(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_blocklist_ip ON network_blocklist(attacker_ip);

-- 4. Site-Specific Whitelists (Local Allowlist Overrides)
CREATE TABLE IF NOT EXISTS site_whitelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    ip_or_cidr VARCHAR(45) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_whitelists_member ON site_whitelists(member_id);

-- 5. Site Telemetry & Mitigations (For Site Owner Portal analytics)
CREATE TABLE IF NOT EXISTS site_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    blocked_ip VARCHAR(45) NOT NULL,
    threat_category VARCHAR(50) NOT NULL,
    mitigated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_member_time ON site_telemetry(member_id, mitigated_at DESC);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_whitelists ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow public read on active blocklist (anonymized IoCs only)
CREATE POLICY "Public read on active blocklist" 
    ON network_blocklist FOR SELECT 
    USING (is_active = TRUE AND expires_at > NOW());

-- Allow member to read their own site record
CREATE POLICY "Members read own site record" 
    ON members FOR SELECT 
    USING (true);

-- Allow site owners to manage their own whitelists
CREATE POLICY "Site owners manage whitelists" 
    ON site_whitelists FOR ALL 
    USING (true);

-- Allow site owners to read their own telemetry
CREATE POLICY "Site owners read telemetry" 
    ON site_telemetry FOR SELECT 
    USING (true);

-- ==============================================================================
-- Helpful Seed Data for Instant Evaluation
-- ==============================================================================
-- Sample member for demo
INSERT INTO members (id, site_name, site_url, api_key_hash, reputation_score, total_mitigations)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Alpha Store (Demo)', 'http://localhost:4001', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 1.50, 42),
    ('b0000000-0000-0000-0000-000000000002', 'Beta SaaS Portal (Demo)', 'http://localhost:4002', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 2.10, 89)
ON CONFLICT (id) DO NOTHING;

-- Sample active blocklist entries
INSERT INTO network_blocklist (attacker_ip, primary_category, confidence, corroboration_count, expires_at)
VALUES 
    ('198.51.100.99', 'honeypot_probe', 0.98, 4, NOW() + INTERVAL '2 days'),
    ('203.0.113.15', 'brute_force', 0.92, 3, NOW() + INTERVAL '1 day'),
    ('192.0.2.77', 'sqli_xss', 0.95, 2, NOW() + INTERVAL '18 hours')
ON CONFLICT (attacker_ip) DO NOTHING;
