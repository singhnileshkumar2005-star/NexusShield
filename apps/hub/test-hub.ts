import http from 'http';
import { createApp } from './src/app';
import { getDataStore } from './src/db';

async function runTests() {
  console.log('🧪 Starting NexusSecure Hub End-to-End Test Suite...\n');

  // Initialize DB
  await getDataStore();
  const app = createApp();

  // Start temporary test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3999, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:3999';

  const demoAlphaKey = 'nx_live_alpha1234567890abcdef1234567890';
  const demoBetaKey = 'nx_live_beta1234567890abcdef1234567890';

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, name: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`, detail || '');
      testFailed++;
    }
  }

  try {
    // 1. Health check
    console.log('--- 1. Health Endpoint ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /health returns 200 OK', healthData);

    // 2. Auth: Register new site
    console.log('\n--- 2. Auth Registration ---');
    const regRes = await fetch(`${baseUrl}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName: 'Test Ecommerce Store',
        siteUrl: 'https://test-ecommerce.com',
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.apiKey && regData.apiKey.startsWith('nx_live_'),
      'POST /v1/auth/register generates API key',
      regData
    );
    const newApiKey = regData.apiKey;
    const newMemberId = regData.memberId;

    // 3. Auth: Verify valid key
    console.log('\n--- 3. Auth Verification ---');
    const verifyRes = await fetch(`${baseUrl}/v1/auth/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newApiKey}` },
    });
    const verifyData = await verifyRes.json();
    assert(
      verifyRes.status === 200 && verifyData.valid === true && verifyData.member.id === newMemberId,
      'POST /v1/auth/verify authenticates registered member',
      verifyData
    );

    // 4. Auth: Verify invalid key
    const invalidAuthRes = await fetch(`${baseUrl}/v1/auth/verify`, {
      method: 'POST',
      headers: { Authorization: 'Bearer nx_live_invalid_fake_key_12345' },
    });
    assert(invalidAuthRes.status === 401, 'POST /v1/auth/verify rejects invalid key');

    // 5. Blocklist: Initial listing
    console.log('\n--- 4. Active Blocklist ---');
    const blocklistRes = await fetch(`${baseUrl}/v1/blocklist`);
    const blocklistData = await blocklistRes.json();
    assert(
      blocklistRes.status === 200 && Array.isArray(blocklistData.blocks) && blocklistData.count >= 5,
      'GET /v1/blocklist returns seeded active blocks',
      blocklistData
    );

    // 6. Blocklist: Single IP check
    const checkRes = await fetch(`${baseUrl}/v1/blocklist/check/198.51.100.99`);
    const checkData = await checkRes.json();
    assert(
      checkRes.status === 200 && checkData.isBlocked === true,
      'GET /v1/blocklist/check/198.51.100.99 confirms blocked IP'
    );

    // 7. Threat Report & Dynamic Corroboration
    console.log('\n--- 5. Threat Reporting & Corroboration Engine ---');
    const attackerIp = '103.21.244.111';

    // Report 1: Node Alpha reports IP with moderate confidence (brute_force)
    const report1Res = await fetch(`${baseUrl}/v1/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${demoAlphaKey}`,
      },
      body: JSON.stringify({
        ip: attackerIp,
        category: 'brute_force',
        confidence: 0.75,
      }),
    });
    const report1Data = await report1Res.json();
    assert(
      report1Res.status === 202 && report1Data.accepted === true,
      'POST /v1/report accepts report 1 from Alpha',
      report1Data
    );

    // Report 2: Node Beta reports SAME IP (corroboration!)
    const report2Res = await fetch(`${baseUrl}/v1/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${demoBetaKey}`,
      },
      body: JSON.stringify({
        ip: attackerIp,
        category: 'brute_force',
        confidence: 0.85,
      }),
    });
    const report2Data = await report2Res.json();
    assert(
      report2Res.status === 202 && report2Data.isPromoted === true && report2Data.distinctReporters === 2,
      'POST /v1/report corroborates across 2 nodes and promotes to network blocklist',
      report2Data
    );

    // Verify IP is now in active blocklist
    const promotedCheckRes = await fetch(`${baseUrl}/v1/blocklist/check/${attackerIp}`);
    const promotedCheckData = await promotedCheckRes.json();
    assert(
      promotedCheckRes.status === 200 && promotedCheckData.isBlocked === true,
      `GET /v1/blocklist/check/${attackerIp} confirms promoted IP is active`,
      promotedCheckData
    );

    // Report 3: Honeypot Trigger (instant promotion)
    const honeypotIp = '185.190.140.222';
    const honeypotRes = await fetch(`${baseUrl}/v1/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newApiKey}`,
      },
      body: JSON.stringify({
        ip: honeypotIp,
        category: 'honeypot_probe',
        confidence: 0.95,
      }),
    });
    const honeypotData = await honeypotRes.json();
    assert(
      honeypotRes.status === 202 && honeypotData.isPromoted === true,
      'POST /v1/report immediately promotes high-confidence honeypot trip',
      honeypotData
    );

    // 8. Heartbeat
    console.log('\n--- 6. Agent Heartbeat & Telemetry ---');
    const hbRes = await fetch(`${baseUrl}/v1/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newApiKey}`,
      },
      body: JSON.stringify({
        mitigatedCount: 5,
        blockedIp: attackerIp,
        threatCategory: 'brute_force',
      }),
    });
    const hbData = await hbRes.json();
    assert(
      hbRes.status === 200 && hbData.ok === true && hbData.totalMitigations >= 5,
      'POST /v1/heartbeat updates mitigation counts and liveness',
      hbData
    );

    // 9. Stats: Network
    console.log('\n--- 7. Network & Site Stats ---');
    const netStatsRes = await fetch(`${baseUrl}/v1/stats/network`);
    const netStatsData = await netStatsRes.json();
    assert(
      netStatsRes.status === 200 && netStatsData.totalMembers >= 4 && netStatsData.activeBlockedIps >= 6,
      'GET /v1/stats/network returns aggregate mesh telemetry',
      netStatsData
    );

    // 10. Stats: Site
    const siteStatsRes = await fetch(`${baseUrl}/v1/stats/site`, {
      headers: { Authorization: `Bearer ${newApiKey}` },
    });
    const siteStatsData = await siteStatsRes.json();
    assert(
      siteStatsRes.status === 200 && siteStatsData.member.id === newMemberId,
      'GET /v1/stats/site returns site-isolated dashboard data',
      siteStatsData
    );

    // 11. Allowlist Management
    console.log('\n--- 8. Allowlist Management ---');
    const addAllowRes = await fetch(`${baseUrl}/v1/allowlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newApiKey}`,
      },
      body: JSON.stringify({
        ipOrCidr: '192.168.1.0/24',
        description: 'Office Subnet Whitelist',
      }),
    });
    const addAllowData = await addAllowRes.json();
    assert(
      addAllowRes.status === 201 && addAllowData.ipOrCidr === '192.168.1.0/24',
      'POST /v1/allowlist creates site-specific allowlist entry',
      addAllowData
    );

    const getAllowRes = await fetch(`${baseUrl}/v1/allowlist`, {
      headers: { Authorization: `Bearer ${newApiKey}` },
    });
    const getAllowData = await getAllowRes.json();
    assert(
      getAllowRes.status === 200 && getAllowData.count === 1,
      'GET /v1/allowlist lists member custom whitelist rules',
      getAllowData
    );

    const delAllowRes = await fetch(`${baseUrl}/v1/allowlist/${addAllowData.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${newApiKey}` },
    });
    assert(delAllowRes.status === 200, 'DELETE /v1/allowlist/:id deletes allowlist rule');

    // 12. Blocklist Revocation
    console.log('\n--- 9. Blocklist Revocation ---');
    const revokeRes = await fetch(`${baseUrl}/v1/blocklist/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ip: honeypotIp,
        reason: 'False positive cleared by admin',
      }),
    });
    const revokeData = await revokeRes.json();
    assert(revokeRes.status === 200 && revokeData.revoked === true, 'POST /v1/blocklist/revoke unblocks IP');

    // 13. Members listing
    console.log('\n--- 10. Members Directory ---');
    const membersRes = await fetch(`${baseUrl}/v1/members`);
    const membersData = await membersRes.json();
    assert(
      membersRes.status === 200 && membersData.count >= 4,
      'GET /v1/members lists sanitized mesh nodes',
      membersData
    );
  } finally {
    server.close();
  }

  console.log(`\n==================================================`);
  console.log(`Test Results: ${testPassed} Passed, ${testFailed} Failed`);
  console.log(`==================================================\n`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('💥 Test execution error:', err);
  process.exit(1);
});
