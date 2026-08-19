/**
 * NexusSecure Collaborative Defense - Attack Simulation & Verification Script
 * 
 * Demonstrates the core value proposition:
 * "If they attack one of us, they can't attack the rest of us."
 */

const HUB_URL = process.env.HUB_URL || 'http://localhost:3000';
const SITE_A_URL = process.env.SITE_A_URL || 'http://localhost:4001';
const SITE_B_URL = process.env.SITE_B_URL || 'http://localhost:4002';

const ATTACKER_IP = '198.51.100.42';
const ATTACKER_SQLI_IP = '203.0.113.88';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSimulation() {
  console.log('\n===============================================================');
  console.log('🛡️  NEXUSSECURE: COLLABORATIVE MESH ATTACK SIMULATION');
  console.log('===============================================================\n');

  console.log(`[Config] Hub Coordinator: ${HUB_URL}`);
  console.log(`[Config] Site Alpha (Target 1): ${SITE_A_URL}`);
  console.log(`[Config] Site Beta  (Target 2): ${SITE_B_URL}`);
  console.log(`[Config] Simulated Attacker IP: ${ATTACKER_IP}\n`);

  // Step 1: Health Check
  console.log('--- STEP 1: Verifying Network Health ---');
  try {
    const hubRes = await fetch(`${HUB_URL}/health`).catch(() => null);
    if (!hubRes || !hubRes.ok) {
      console.log(`⚠️  Hub is not running at ${HUB_URL}. Running local simulation directly...`);
    } else {
      const hubData = await hubRes.json();
      console.log(`✅ Hub is ONLINE:`, hubData);
    }
  } catch (err) {
    console.log(`⚠️  Hub check skipped.`);
  }

  // Step 2: Normal Clean User Traffic
  console.log('\n--- STEP 2: Baseline Clean Request to Site Alpha & Site Beta ---');
  try {
    const resA = await fetch(`${SITE_A_URL}/api/products`, {
      headers: { 'x-forwarded-for': '192.0.2.1' }
    });
    console.log(`[Clean User -> Site Alpha] Status: ${resA.status} (Expected: 200 OK)`);

    const resB = await fetch(`${SITE_B_URL}/api/dashboard/metrics`, {
      headers: { 'x-forwarded-for': '192.0.2.1' }
    });
    console.log(`[Clean User -> Site Beta]  Status: ${resB.status} (Expected: 200 OK)`);
  } catch (err: any) {
    console.log(`[Info] Make sure Site Alpha & Beta are running (npm run start:all):`, err.message);
  }

  // Step 3: Attacker Probes Site Alpha with Honeypot Scanner Target
  console.log(`\n--- STEP 3: Attacker (${ATTACKER_IP}) Probes Site Alpha with Recon Scanner ---`);
  try {
    console.log(`[Attacker -> Site Alpha] Attempting probe: GET ${SITE_A_URL}/.env`);
    const probeRes = await fetch(`${SITE_A_URL}/.env`, {
      headers: { 'x-forwarded-for': ATTACKER_IP }
    });
    const probeData = await probeRes.json().catch(() => ({}));
    console.log(`[Attacker -> Site Alpha] Status: ${probeRes.status} (Expected: 403 Forbidden)`);
    console.log(`[Response Body]:`, probeData);

    console.log('\n[Mesh Sync] Waiting 1.5 seconds for Hub Corroboration & SSE Broadcast to Site Beta...');
    await sleep(1500);

    // Step 4: Attacker tries to attack Site Beta
    console.log(`\n--- STEP 4: Attacker (${ATTACKER_IP}) Attempts Access to Unprobed Site Beta ---`);
    console.log(`[Attacker -> Site Beta] Requesting: GET ${SITE_B_URL}/api/dashboard/metrics`);
    const attackBRes = await fetch(`${SITE_B_URL}/api/dashboard/metrics`, {
      headers: { 'x-forwarded-for': ATTACKER_IP }
    });
    const attackBData = await attackBRes.json().catch(() => ({}));
    console.log(`[Attacker -> Site Beta] Status: ${attackBRes.status} (Expected: 403 Forbidden)`);
    console.log(`[Response Body]:`, attackBData);

    if (attackBRes.status === 403) {
      console.log('\n===============================================================');
      console.log('🎉 SUCCESS: PREEMPTIVE CROSS-SITE BLOCKING VERIFIED!');
      console.log(`Site Beta automatically blocked Attacker ${ATTACKER_IP} on attempt #1`);
      console.log('without ever having been attacked before!');
      console.log('===============================================================\n');
    }
  } catch (err: any) {
    console.log(`Simulation error:`, err.message);
  }
}

runSimulation();
