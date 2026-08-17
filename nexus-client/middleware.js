const axios = require('axios');

// Local in-memory Set of blocked IPs
const blockedIPs = new Set();
const HUB_URL = process.env.HUB_URL || 'http://127.0.0.1:8000';
const SYNC_INTERVAL_MS = 2000; // 2 seconds

// SQL Injection detection regex patterns
const SQLI_PATTERNS = [
  /'\s*or\s*['"]?1['"]?\s*=\s*['"]?1/i,  // ' OR 1=1, ' OR '1'='1
  /union\s+select/i,                    // UNION SELECT
  /--/,                                 // SQL Comment --
  /#/                                   // SQL Comment #
];

/**
 * Normalizes IP address strings (e.g. ::1 -> 127.0.0.1, ::ffff:127.0.0.1 -> 127.0.0.1)
 */
function normalizeIP(rawIp) {
  if (!rawIp) return '127.0.0.1';
  let ip = String(rawIp).trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  if (ip === '::1' || ip === 'localhost') {
    ip = '127.0.0.1';
  }
  return ip;
}

/**
 * Synchronizes local blocked IPs set with FastAPI Hub every 5 seconds
 */
async function syncBlocklist() {
  try {
    const response = await axios.get(`${HUB_URL}/blocklist`, { timeout: 3000 });
    if (response.data && Array.isArray(response.data.blocked_ips)) {
      const serverBlocklist = response.data.blocked_ips.map(item => {
        const rawIp = typeof item === 'object' && item !== null ? item.ip : item;
        return normalizeIP(rawIp);
      });

      blockedIPs.clear();
      for (const ip of serverBlocklist) {
        blockedIPs.add(ip);
      }
      console.log(`[NexusShield Sync] Blocklist updated. Total local blocked IPs: ${blockedIPs.size} -> [${Array.from(blockedIPs).join(', ')}]`);
    }
  } catch (error) {
    console.error(`[NexusShield Sync Error] ${error.message}`);
  }
}

// Start background sync loop every 5 seconds
syncBlocklist();
const syncInterval = setInterval(syncBlocklist, SYNC_INTERVAL_MS);
if (syncInterval.unref) {
  syncInterval.unref();
}

/**
 * Asynchronously sends threat report to FastAPI Hub
 */
async function reportThreat(ipAddress, attackType) {
  try {
    const res = await axios.post(`${HUB_URL}/report`, {
      ip_address: ipAddress,
      attack_type: attackType
    }, { timeout: 3000 });
    console.log(`[NexusShield Report] Threat reported for IP ${ipAddress}:`, res.data);
  } catch (error) {
    console.error(`[NexusShield Report Error] ${error.message}`);
  }
}

/**
 * Checks URL string for SQL Injection signatures
 */
function isSQLiPayload(urlStr) {
  if (!urlStr) return false;
  const decodedUrl = decodeURIComponent(urlStr);
  return SQLI_PATTERNS.some(pattern => pattern.test(decodedUrl));
}

/**
 * Express Middleware Function (threatShield)
 */
function threatShield(req, res, next) {
  const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const clientIp = normalizeIP(rawIp);

  console.log(`[NexusShield Intercept] Incoming request from IP: ${clientIp} (raw: ${rawIp}) on ${req.originalUrl || req.url}`);

  // Defense Rule A: Global Blocklist Enforcement
  if (blockedIPs.has(clientIp)) {
    console.warn(`[NexusShield Blocked] IP ${clientIp} is globally banned.`);
    return res.status(403).send("403 Forbidden: IP Globally Banned by NexusShield");
  }

  // Defense Rule B: Payload Detection & Threat Reporting
  const requestUrl = req.originalUrl || req.url || '';
  if (isSQLiPayload(requestUrl)) {
    console.warn(`[NexusShield Attack Detected] SQLi detected from IP ${clientIp}`);

    // Immediately add to local blocklist
    blockedIPs.add(clientIp);

    // Asynchronously report to Hub
    reportThreat(clientIp, 'SQL Injection').catch(() => {});

    // Terminate connection with 403 Forbidden
    return res.status(403).send("403 Forbidden: Malicious Payload Detected");
  }

  // Pass-through if clean and unbanned
  next();
}

module.exports = threatShield;
