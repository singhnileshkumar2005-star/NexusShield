const axios = require('axios');

// Local in-memory Set of blocked IPs
const blockedIPs = new Set();
const HUB_URL = 'https://nexusshield.onrender.com';
const SYNC_INTERVAL_MS = 2000; // 2 seconds

// Advanced Threat Detection Regex Patterns
const SQLI_PATTERNS = [
  /'\s*or\s*['"]?1['"]?\s*=\s*['"]?1/i,  // ' OR 1=1, ' OR '1'='1
  /union\s+select/i,                    // UNION SELECT
  /--/,                                 // SQL Comment --
  /#/                                   // SQL Comment #
];

const XSS_PATTERNS = [
  /(<script>)|(javascript:)|(onerror=)|(onload=)/i
];

const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.\/)|(\.\.\\)/i
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
 * Synchronizes local blocked IPs set with FastAPI Hub every 2 seconds
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
    }
  } catch (error) {
    // Graceful error handling without crashing process
  }
}

// Start background sync loop
syncBlocklist();
const syncInterval = setInterval(syncBlocklist, SYNC_INTERVAL_MS);
if (syncInterval.unref) {
  syncInterval.unref();
}

/**
 * Asynchronously sends threat report to FastAPI Hub
 */
async function reportThreat(ipAddress, attackType, clientId = 'default') {
  try {
    await axios.post(`${HUB_URL}/report`, {
      ip_address: ipAddress,
      client_id: clientId,
      attack_type: attackType
    }, { timeout: 3000 });
  } catch (error) {
    // Handle error gracefully
  }
}

/**
 * Inspects URL string and returns detected attack vector name or null
 */
function detectThreatVector(urlStr) {
  if (!urlStr) return null;
  const decodedUrl = decodeURIComponent(urlStr);

  if (SQLI_PATTERNS.some(p => p.test(decodedUrl))) {
    return 'SQL Injection';
  }

  if (XSS_PATTERNS.some(p => p.test(decodedUrl))) {
    return 'Cross-Site Scripting';
  }

  if (PATH_TRAVERSAL_PATTERNS.some(p => p.test(decodedUrl))) {
    return 'Path Traversal';
  }

  return null;
}

/**
 * Creates ThreatShield Middleware instance configured for a specific clientId
 */
function createThreatShieldMiddleware(config = {}) {
  let clientId = 'default';
  if (typeof config === 'string') {
    clientId = config;
  } else if (config && config.clientId) {
    clientId = config.clientId;
  }

  return function threatShieldHandler(req, res, next) {
    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const clientIp = normalizeIP(rawIp);

    // Defense Rule A: Global Blocklist Enforcement
    if (blockedIPs.has(clientIp)) {
      return res.status(403).send("403 Forbidden: IP Globally Banned by NexusShield");
    }

    // Defense Rule B: Payload Detection & Threat Classification
    const requestUrl = req.originalUrl || req.url || '';
    const threatType = detectThreatVector(requestUrl);

    if (threatType) {
      // Immediately add to local blocklist
      blockedIPs.add(clientIp);

      // Asynchronously report to Hub with client_id
      reportThreat(clientIp, threatType, clientId).catch(() => {});

      // Terminate connection with 403 Forbidden
      return res.status(403).send("403 Forbidden: Malicious Payload Detected");
    }

    // Pass-through if clean and unbanned
    next();
  };
}

/**
 * Express Middleware Export supporting both factory config:
 *   threatShield({ clientId: 'client_A' })
 * and direct middleware use:
 *   threatShield(req, res, next)
 */
function threatShield(optionsOrReq, res, next) {
  if (optionsOrReq && optionsOrReq.headers && typeof next === 'function') {
    return createThreatShieldMiddleware({ clientId: 'default' })(optionsOrReq, res, next);
  }
  return createThreatShieldMiddleware(optionsOrReq);
}

module.exports = threatShield;
