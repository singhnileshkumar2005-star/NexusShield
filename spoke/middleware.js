const axios = require('axios');

// Local in-memory Set of blocked IPs
const blockedIPs = new Set();
const DEFAULT_HUB_URL = process.env.HUB_URL || 'http://127.0.0.1:8000';
const DEFAULT_API_KEY = process.env.NEXUS_API_KEY || 'nexus_dev_key_2026';
const SYNC_INTERVAL_MS = 2000; // 2 seconds

// Advanced Threat Detection Regex Patterns
const SQLI_PATTERNS = [
  /'\s*or\s*['"]?1['"]?\s*=\s*['"]?1/i,  // ' OR 1=1, ' OR '1'='1
  /union\s+(all\s+)?select/i,           // UNION SELECT, UNION ALL SELECT
  /;\s*drop\s+table/i,                 // ; DROP TABLE
  /'\s*or\s*['"]?[a-z0-9]+['"]?\s*=\s*['"]?[a-z0-9]+/i, // ' OR 'a'='a'
  /exec(\s|\+)+(s|x)p\w+/i,            // exec xp_cmdshell
  /insert\s+into/i,                    // INSERT INTO
  /delete\s+from/i,                     // DELETE FROM
  /(?:--[\s\r\n]|--$)/,                // SQL Comment --
  /(?:\/\*[\s\S]*?\*\/)/,              // SQL inline comment /* ... */
  /#/                                  // SQL Comment #
];

const XSS_PATTERNS = [
  /(<script[\s>])|(javascript:)|(onerror\s*=)|(onload\s*=)|(<img\s+[^>]*src=)|(alert\()/i
];

const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.\/)|(\.\.\\)|(%2e%2e%2f)|(%2e%2e\/)|(%2e%2e\\)/i
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
 * Synchronizes local blocked IPs set with FastAPI Hub
 */
async function syncBlocklist(hubUrl = DEFAULT_HUB_URL, apiKey = DEFAULT_API_KEY) {
  try {
    const response = await axios.get(`${hubUrl}/blocklist`, {
      headers: { 'x-api-key': apiKey },
      timeout: 3000
    });
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
const syncInterval = setInterval(() => {
  const currentHubUrl = process.env.HUB_URL || DEFAULT_HUB_URL;
  const currentApiKey = process.env.NEXUS_API_KEY || DEFAULT_API_KEY;
  syncBlocklist(currentHubUrl, currentApiKey);
}, SYNC_INTERVAL_MS);

if (syncInterval.unref) {
  syncInterval.unref();
}

/**
 * Asynchronously sends threat report to FastAPI Hub
 */
async function reportThreat(ipAddress, attackType, clientId = 'default', hubUrl = DEFAULT_HUB_URL, apiKey = DEFAULT_API_KEY) {
  try {
    await axios.post(`${hubUrl}/report`, {
      ip_address: ipAddress,
      client_id: clientId,
      attack_type: attackType
    }, {
      headers: { 'x-api-key': apiKey },
      timeout: 3000
    });
  } catch (error) {
    // Handle error gracefully
  }
}

/**
 * Inspects a string target for threat patterns
 */
function inspectString(str) {
  if (!str || typeof str !== 'string') return null;
  let decoded = str;
  try {
    decoded = decodeURIComponent(str);
  } catch (e) {
    decoded = str;
  }

  if (SQLI_PATTERNS.some(p => p.test(decoded))) {
    return 'SQL Injection';
  }
  if (XSS_PATTERNS.some(p => p.test(decoded))) {
    return 'Cross-Site Scripting';
  }
  if (PATH_TRAVERSAL_PATTERNS.some(p => p.test(decoded))) {
    return 'Path Traversal';
  }
  return null;
}

/**
 * Inspects incoming request (URL, query, body, and headers) for malicious vectors
 */
function detectThreatVector(req) {
  if (!req) return null;

  // 1. Inspect URL & Query
  const urlStr = req.originalUrl || req.url || '';
  const urlThreat = inspectString(urlStr);
  if (urlThreat) return urlThreat;

  // 2. Inspect Request Body (if parsed or raw)
  if (req.body) {
    const bodyStr = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body);
    const bodyThreat = inspectString(bodyStr);
    if (bodyThreat) return bodyThreat;
  }

  // 3. Inspect Headers
  if (req.headers) {
    const headerTargets = ['user-agent', 'referer', 'x-custom-payload'];
    for (const h of headerTargets) {
      if (req.headers[h]) {
        const headerThreat = inspectString(String(req.headers[h]));
        if (headerThreat) return headerThreat;
      }
    }
  }

  return null;
}

/**
 * Creates ThreatShield Middleware instance configured for a specific clientId
 */
function createThreatShieldMiddleware(config = {}) {
  let clientId = 'default';
  let hubUrl = process.env.HUB_URL || DEFAULT_HUB_URL;
  let apiKey = process.env.NEXUS_API_KEY || DEFAULT_API_KEY;

  if (typeof config === 'string') {
    clientId = config;
  } else if (config && typeof config === 'object') {
    if (config.clientId) clientId = config.clientId;
    if (config.hubUrl) hubUrl = config.hubUrl;
    if (config.apiKey) apiKey = config.apiKey;
  }

  return function threatShieldHandler(req, res, next) {
    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const clientIp = normalizeIP(rawIp);

    // Defense Rule A: Global Blocklist Enforcement
    if (blockedIPs.has(clientIp)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '403 Forbidden: IP Globally Banned by NexusShield',
        client_ip: clientIp
      });
    }

    // Defense Rule B: Payload Detection & Threat Classification
    const threatType = detectThreatVector(req);

    if (threatType) {
      // Immediately add to local blocklist
      blockedIPs.add(clientIp);

      // Asynchronously report to Hub with client_id and auth key
      reportThreat(clientIp, threatType, clientId, hubUrl, apiKey).catch(() => {});

      // Terminate connection with 403 Forbidden
      return res.status(403).json({
        error: 'Forbidden',
        message: `403 Forbidden: Malicious Payload Detected (${threatType})`,
        client_ip: clientIp,
        threat_type: threatType
      });
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

// Backward-compatible exports
threatShield.createWafInstance = createThreatShieldMiddleware;
threatShield.wafMiddleware = createThreatShieldMiddleware();
threatShield.syncBlocklist = syncBlocklist;
threatShield.fetchGlobalBlocklist = syncBlocklist;
threatShield.blockedIPs = blockedIPs;
threatShield.localBlockedIPs = blockedIPs;
threatShield.normalizeIP = normalizeIP;
threatShield.detectThreatVector = detectThreatVector;

module.exports = threatShield;

module.exports.createWafInstance = createThreatShieldMiddleware;
module.exports.wafMiddleware = createThreatShieldMiddleware();
module.exports.fetchGlobalBlocklist = syncBlocklist;
module.exports.localBlockedIPs = blockedIPs;
module.exports.normalizeIP = normalizeIP;
