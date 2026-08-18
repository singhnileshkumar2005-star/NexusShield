const axios = require('axios');

// In-memory local blocklist
const localBlockedIPs = new Set();
const HUB_URL = process.env.HUB_URL || 'https://nexusshield.onrender.com';
const SYNC_INTERVAL_MS = 10000; // 10 seconds

// SQL Injection Detection Patterns (Case-Insensitive)
const SQLI_PATTERNS = [
  /'\s*or\s*['"]?1['"]?\s*=\s*['"]?1/i,         // ' OR 1=1, ' OR '1'='1
  /union\s+(all\s+)?select/i,                    // UNION SELECT, UNION ALL SELECT
  /;\s*drop\s+table/i,                          // ; DROP TABLE
  /'\s*or\s*['"]?[a-z0-9]+['"]?\s*=\s*['"]?[a-z0-9]+/i, // ' OR 'a'='a'
  /exec(\s|\+)+(s|x)p\w+/i,                     // exec xp_cmdshell
  /insert\s+into/i,                             // INSERT INTO
  /delete\s+from/i                              // DELETE FROM
];

/**
 * Normalizes IP address strings (e.g., converts IPv6 mapped IPv4 like ::ffff:127.0.0.1 to 127.0.0.1)
 */
function normalizeIP(rawIp) {
  if (!rawIp) return '127.0.0.1';
  let ip = rawIp.trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  return ip;
}

/**
 * Fetches the global blocklist from the Hub and updates local blocklist
 */
async function fetchGlobalBlocklist() {
  try {
    const response = await axios.get(`${HUB_URL}/blocklist`, { timeout: 3000 });
    if (response.data && Array.isArray(response.data.blocked_ips)) {
      const serverBlocklist = response.data.blocked_ips.map(item => {
        const rawIp = typeof item === 'object' && item !== null ? item.ip : item;
        return normalizeIP(rawIp);
      });
      
      let newAddedCount = 0;
      for (const ip of serverBlocklist) {
        if (!localBlockedIPs.has(ip)) {
          localBlockedIPs.add(ip);
          newAddedCount++;
        }
      }
      console.log(`[WAF Sync] Global blocklist updated. Total local blocked IPs: ${localBlockedIPs.size} (+${newAddedCount} new)`);
    }
  } catch (error) {
    console.error(`[WAF Sync Error] Could not connect to Hub at ${HUB_URL}: ${error.message}`);
  }
}

/**
 * Sends asynchronous report to the Hub when an attack is detected
 */
async function reportAttackToHub(ipAddress, attackType) {
  try {
    await axios.post(`${HUB_URL}/report`, {
      ip_address: ipAddress,
      client_id: 'spoke',
      attack_type: attackType
    }, { timeout: 3000 });
    console.log(`[WAF Report] Successfully reported ${ipAddress} (${attackType}) to Hub.`);
  } catch (error) {
    console.error(`[WAF Report Error] Failed to report ${ipAddress} to Hub: ${error.message}`);
  }
}

/**
 * Checks request URL and query string for SQL Injection signatures
 */
function containsSQLi(urlStr) {
  const decodedUrl = decodeURIComponent(urlStr);
  return SQLI_PATTERNS.some(pattern => pattern.test(decodedUrl));
}

/**
 * Main Express WAF Middleware
 */
function wafMiddleware(req, res, next) {
  const rawClientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const clientIp = normalizeIP(rawClientIp);

  // 1. Check if IP is already in local blocklist
  if (localBlockedIPs.has(clientIp)) {
    console.warn(`[WAF Blocked] Request from blocked IP ${clientIp} rejected (403 Forbidden).`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied by Collaborative Web Application Firewall (Global Blocklist)',
      client_ip: clientIp
    });
  }

  // 2. Inspect URL string for basic SQL Injection attacks
  const fullUrl = req.originalUrl || req.url;
  if (containsSQLi(fullUrl)) {
    console.warn(`[WAF Attack Detected!] SQL Injection detected from IP ${clientIp} on URL: ${fullUrl}`);

    // Block locally immediately
    localBlockedIPs.add(clientIp);

    // Asynchronously report to Hub
    reportAttackToHub(clientIp, 'SQL Injection').catch(() => {});

    // Return 403 Forbidden
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: SQL Injection payload detected by WAF middleware',
      client_ip: clientIp
    });
  }

  // Clean request -> proceed
  next();
}

/**
 * Initializes WAF sync loop and returns middleware handler
 */
function createWafInstance(options = {}) {
  // Initial sync immediately
  fetchGlobalBlocklist();

  // Periodic sync every 10 seconds
  const intervalId = setInterval(fetchGlobalBlocklist, SYNC_INTERVAL_MS);

  // Prevent background interval from keeping node process open on shutdown if unref is supported
  if (intervalId.unref) {
    intervalId.unref();
  }

  return wafMiddleware;
}

module.exports = {
  createWafInstance,
  wafMiddleware,
  fetchGlobalBlocklist,
  localBlockedIPs,
  normalizeIP
};
