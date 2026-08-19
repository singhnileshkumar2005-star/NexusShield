/**
 * NexusSecure IP Utilities
 * High-speed IP extraction, normalization, RFC-compliant private network detection, and CIDR subnet matching.
 */

/**
 * Normalizes an IP string:
 * - Trims whitespace
 * - Strips IPv4-mapped IPv6 prefixes (e.g. `::ffff:192.168.1.1` -> `192.168.1.1`)
 * - Strips bracketed IPv6 formatting with ports (e.g. `[::1]:8080` -> `::1`)
 * - Strips IPv4 port numbers (e.g. `127.0.0.1:3000` -> `127.0.0.1`)
 */
export function normalizeIp(rawIp: string | null | undefined): string {
  if (!rawIp) return '';
  let ip = rawIp.trim();

  // Strip IPv4-mapped IPv6 prefix
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Handle bracketed IPv6 with optional port: [2001:db8::1]:8080 -> 2001:db8::1
  if (ip.startsWith('[')) {
    const closeBracket = ip.indexOf(']');
    if (closeBracket !== -1) {
      ip = ip.substring(1, closeBracket);
    }
  } else if (ip.includes('.') && ip.includes(':')) {
    // IPv4 with port: 192.168.1.1:8080 -> 192.168.1.1
    const colonIndex = ip.indexOf(':');
    ip = ip.substring(0, colonIndex);
  }

  return ip.toLowerCase();
}

/**
 * Parses an IPv4 address string into a 32-bit unsigned integer.
 * Returns null if the format is invalid.
 */
export function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  let num = 0;
  for (let i = 0; i < 4; i++) {
    const octet = Number(parts[i]);
    if (isNaN(octet) || octet < 0 || octet > 255 || parts[i]?.trim() === '') {
      return null;
    }
    num = (num << 8) | octet;
  }
  // Convert to unsigned 32-bit integer
  return num >>> 0;
}

/**
 * Parses an IPv6 address string into a 128-bit BigInt representation.
 * Returns null if the format is invalid.
 */
export function ipv6ToBigInt(ip: string): bigint | null {
  try {
    let cleanIp = ip.toLowerCase();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
      // It's mapped IPv4
      const v4Num = ipv4ToNumber(cleanIp);
      if (v4Num === null) return null;
      return (BigInt(0xffff) << 32n) | BigInt(v4Num);
    }

    if (!cleanIp.includes(':')) return null;

    // Handle "::" expansion
    const parts = cleanIp.split('::');
    if (parts.length > 2) return null; // Invalid multiple "::"

    let hextets: string[] = [];

    if (parts.length === 2) {
      const left = parts[0] ? parts[0].split(':') : [];
      const right = parts[1] ? parts[1].split(':') : [];
      const missingCount = 8 - (left.length + right.length);
      if (missingCount < 0) return null;

      const zeros = new Array(missingCount).fill('0');
      hextets = [...left, ...zeros, ...right];
    } else {
      hextets = cleanIp.split(':');
    }

    if (hextets.length !== 8) return null;

    let result = 0n;
    for (const h of hextets) {
      if (h.length > 4) return null;
      const val = parseInt(h || '0', 16);
      if (isNaN(val) || val < 0 || val > 0xffff) return null;
      result = (result << 16n) | BigInt(val);
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Checks if a given IP address belongs to a CIDR range or equals an exact IP string.
 * Supports both IPv4 and IPv6 CIDRs.
 */
export function ipInCidr(ip: string, cidr: string): boolean {
  const normIp = normalizeIp(ip);
  const normCidr = normalizeIp(cidr);

  if (!normIp || !normCidr) return false;

  // Exact string match (e.g. "192.168.1.1" === "192.168.1.1")
  if (normIp === normCidr) return true;

  // Check if target is a CIDR notation
  if (!normCidr.includes('/')) {
    return false;
  }

  const [rangeIp, prefixStr] = normCidr.split('/');
  if (!rangeIp || !prefixStr) return false;
  const prefixLength = parseInt(prefixStr, 10);
  if (isNaN(prefixLength)) return false;

  // IPv4 CIDR Check
  if (normIp.includes('.') && rangeIp.includes('.')) {
    if (prefixLength < 0 || prefixLength > 32) return false;
    const ipNum = ipv4ToNumber(normIp);
    const rangeNum = ipv4ToNumber(rangeIp);
    if (ipNum === null || rangeNum === null) return false;

    if (prefixLength === 0) return true;

    // Bitwise mask for prefix length
    const mask = prefixLength === 32 ? 0xffffffff : ~((1 << (32 - prefixLength)) - 1) >>> 0;
    return (ipNum & mask) === (rangeNum & mask);
  }

  // IPv6 CIDR Check
  if (normIp.includes(':') || rangeIp.includes(':')) {
    if (prefixLength < 0 || prefixLength > 128) return false;
    const ipBig = ipv6ToBigInt(normIp);
    const rangeBig = ipv6ToBigInt(rangeIp);
    if (ipBig === null || rangeBig === null) return false;

    if (prefixLength === 0) return true;

    const shift = BigInt(128 - prefixLength);
    return (ipBig >> shift) === (rangeBig >> shift);
  }

  return false;
}

/**
 * Standard RFC Private and Loopback CIDR definitions:
 * - RFC 1122 / 5735: 127.0.0.0/8 (IPv4 Loopback)
 * - RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (Private Networks)
 * - RFC 3927: 169.254.0.0/16 (IPv4 Link-Local)
 * - RFC 6598: 100.64.0.0/10 (Carrier-Grade NAT)
 * - RFC 4291: ::1/128 (IPv6 Loopback)
 * - RFC 4193: fc00::/7 (IPv6 Unique Local / Private)
 * - RFC 4291: fe80::/10 (IPv6 Link-Local)
 */
export const PRIVATE_AND_LOOPBACK_RANGES: readonly string[] = [
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
  '100.64.0.0/10',
  '::1/128',
  'fc00::/7',
  'fe80::/10',
];

/**
 * Evaluates whether an IP address is a private, loopback, link-local, or internal network IP.
 */
export function isPrivateOrLoopbackIp(ip: string): boolean {
  const normIp = normalizeIp(ip);
  if (!normIp) return false;

  // Direct fast checks
  if (
    normIp === '127.0.0.1' ||
    normIp === 'localhost' ||
    normIp === '::1' ||
    normIp === '0.0.0.0' ||
    normIp === '::'
  ) {
    return true;
  }

  // Check against RFC range definitions
  for (const cidr of PRIVATE_AND_LOOPBACK_RANGES) {
    if (ipInCidr(normIp, cidr)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether an IP matches any entry in a list of IPs or CIDR notations.
 */
export function matchIpAgainstList(ip: string, list: string[]): boolean {
  const normIp = normalizeIp(ip);
  if (!normIp || !list || list.length === 0) return false;

  for (const item of list) {
    if (!item) continue;
    if (ipInCidr(normIp, item)) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts client IP address from request headers or socket info.
 * Supports Cloudflare, AWS CloudFront, Fastly, Akamai, Nginx, Express, and standard HTTP requests.
 */
export function extractClientIp(
  req: any,
  trustProxy: boolean | number | string[] = true,
  customExtractor?: (req: any) => string | undefined
): string {
  if (customExtractor) {
    try {
      const extracted = customExtractor(req);
      if (extracted) {
        return normalizeIp(extracted);
      }
    } catch {
      // Fallback on error in custom extractor
    }
  }

  if (!req) return '127.0.0.1';

  const headers = req.headers || {};

  // Extract from proxy headers if proxy is trusted
  if (trustProxy) {
    // Cloudflare Edge header
    const cfConnectingIp = headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string' && cfConnectingIp) {
      return normalizeIp(cfConnectingIp);
    }

    // Akamai / CDN True-Client-IP header
    const trueClientIp = headers['true-client-ip'];
    if (typeof trueClientIp === 'string' && trueClientIp) {
      return normalizeIp(trueClientIp);
    }

    // Fastly header
    const fastlyClientIp = headers['fastly-client-ip'];
    if (typeof fastlyClientIp === 'string' && fastlyClientIp) {
      return normalizeIp(fastlyClientIp);
    }

    // X-Real-IP header
    const xRealIp = headers['x-real-ip'];
    if (typeof xRealIp === 'string' && xRealIp) {
      return normalizeIp(xRealIp);
    }

    // Standard X-Forwarded-For (can contain comma-separated list of IPs)
    const xForwardedFor = headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string' && xForwardedFor) {
      const parts = xForwardedFor.split(',');
      if (parts.length > 0 && parts[0]) {
        return normalizeIp(parts[0].trim());
      }
    } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0 && xForwardedFor[0]) {
      const parts = xForwardedFor[0].split(',');
      if (parts[0]) {
        return normalizeIp(parts[0].trim());
      }
    }
  }

  // Fast path: Express / Fastify / Next.js direct properties
  if (req.ip && typeof req.ip === 'string' && req.ip !== '127.0.0.1' && req.ip !== '::1') {
    return normalizeIp(req.ip);
  }

  // Direct socket / connection remote address
  const socketAddress =
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    req.info?.remoteAddress ||
    req.raw?.socket?.remoteAddress;

  if (typeof socketAddress === 'string') {
    return normalizeIp(socketAddress);
  }

  if (req.ip && typeof req.ip === 'string') {
    return normalizeIp(req.ip);
  }

  return '127.0.0.1';
}
