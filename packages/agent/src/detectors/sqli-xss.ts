/**
 * NexusSecure Threat Detector: SQL Injection (SQLi) & Cross-Site Scripting (XSS)
 * Deep regex heuristic inspection of query strings, headers, request paths, and bodies.
 */
import { DetectionResult, RequestContext, SqliXssDetectorConfig, ThreatCategory } from '../types.js';
import { normalizeIp } from '../utils/ip.js';
import { Detector } from './base.js';

// High-confidence SQL Injection heuristics
export const SQLI_PATTERNS: readonly RegExp[] = [
  // UNION SELECT injection patterns
  /\bunion\s+(?:all\s+)?select\b/i,
  // Tautology / Boolean-based bypass: ' OR '1'='1', ' OR 1=1 --
  /(?:'|"|`)\s*(?:or|and|xor|not)\s+(?:'?[0-9a-z]+'?\s*=\s*'?[0-9a-z]+'?|1=1|true|\bnull\s+is\s+null\b)/i,
  // Comment terminators after SQL syntax
  /(?:--|#|\/\*).*$/m,
  // Stacked queries / Execution of system commands
  /;\s*(?:select|insert|update|delete|drop|alter|truncate|exec|execute|grant)\b/i,
  // Blind SQL injection time delays & benchmarks
  /\b(?:sleep\s*\(\s*\d+\s*\)|benchmark\s*\(\s*\d+\s*,|waitfor\s+delay\s+'|pg_sleep\s*\(\s*\d+\s*\))/i,
  // System functions / Information schema harvesting
  /\b(?:schema\(\)|information_schema|load_file\s*\(|into\s+(?:outfile|dumpfile))\b/i,
  // Hex/char encoded SQL keywords
  /\b0x[0-9a-f]{4,}\b/i,
];

// High-confidence Cross-Site Scripting (XSS) heuristics
export const XSS_PATTERNS: readonly RegExp[] = [
  // Script tags: <script>, <script src=...>
  /<\s*script\b[^>]*>/i,
  // JavaScript pseudo-protocol: href="javascript:..."
  /javascript\s*:\s*[^;\s]+/i,
  // DOM inline event handlers: onerror=, onload=, onclick=, onmouseover=
  /\bon(?:error|load|click|mouseover|focus|blur|change|submit|input|keypress|keyup|keydown|pointerdown|animationstart)\s*=/i,
  // Dangerous HTML tags with active content: <iframe>, <embed>, <object>, <svg/onload>
  /<\s*(?:iframe|object|embed|svg|applet|meta|link|base)\b[^>]*\b(?:on\w+|src|href)\s*=/i,
  // Dangerous DOM access and execution APIs
  /(?:document\.(?:cookie|location|domain|write)|window\.location|eval\s*\(|Function\s*\(|alert\s*\()/i,
  // Encoded tags: %3Cscript%3E, &lt;script&gt;
  /(?:%3c|&lt;)\s*script\b/i,
];

export class SqliXssDetector implements Detector {
  public readonly name = 'SqliXssDetector';
  public readonly category: ThreatCategory = 'sqli_xss';

  private readonly enabled: boolean;
  private readonly inspectQueryParams: boolean;
  private readonly inspectHeaders: boolean;
  private readonly inspectPath: boolean;
  private readonly inspectBody: boolean;
  private readonly blockDurationMs: number;
  private readonly customPatterns: RegExp[];

  constructor(config: SqliXssDetectorConfig = {}) {
    this.enabled = config.enabled ?? true;
    this.inspectQueryParams = config.inspectQueryParams ?? true;
    this.inspectHeaders = config.inspectHeaders ?? true;
    this.inspectPath = config.inspectPath ?? true;
    this.inspectBody = config.inspectBody ?? true;
    this.blockDurationMs = config.blockDurationMs ?? 3_600_000; // 1 hour
    this.customPatterns = config.customPatterns || [];
  }

  /**
   * Evaluates incoming request parameters against SQLi & XSS signatures.
   */
  public inspect(context: RequestContext): DetectionResult | null {
    if (!this.enabled) return null;
    const ip = normalizeIp(context.ip);
    if (!ip) return null;

    // 1. Inspect URL Path
    if (this.inspectPath && context.path) {
      const match = this.inspectString(context.path, 'URL Path');
      if (match) return match;
    }

    // 2. Inspect Query Parameters
    if (this.inspectQueryParams && context.query) {
      const match = this.inspectValue(context.query, 'Query Parameter');
      if (match) return match;
    }

    // 3. Inspect Suspicious Headers (User-Agent, Referer, Cookies, Custom Headers)
    if (this.inspectHeaders && context.headers) {
      for (const [key, val] of Object.entries(context.headers)) {
        // Skip safe transport headers
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === 'host' ||
          lowerKey === 'accept' ||
          lowerKey === 'accept-encoding' ||
          lowerKey === 'accept-language' ||
          lowerKey === 'connection' ||
          lowerKey === 'content-length' ||
          lowerKey === 'content-type'
        ) {
          continue;
        }

        const match = this.inspectValue(val, `Header '${key}'`);
        if (match) return match;
      }
    }

    // 4. Inspect Request Body
    if (this.inspectBody && context.body) {
      const match = this.inspectValue(context.body, 'Request Body');
      if (match) return match;
    }

    return null;
  }

  /**
   * Recursively inspects arbitrary values (strings, objects, arrays).
   */
  private inspectValue(value: any, location: string): DetectionResult | null {
    if (value === null || value === undefined) return null;

    if (typeof value === 'string') {
      return this.inspectString(value, location);
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const res = this.inspectValue(value[i], `${location}[${i}]`);
          if (res) return res;
        }
      } else {
        for (const [k, v] of Object.entries(value)) {
          // Check object key as well (e.g. `?SELECT=1`)
          const keyRes = this.inspectString(k, `${location} Key '${k}'`);
          if (keyRes) return keyRes;

          const valRes = this.inspectValue(v, `${location}.${k}`);
          if (valRes) return valRes;
        }
      }
    }

    return null;
  }

  /**
   * Inspects a string against SQLi, XSS, and custom regex signatures.
   */
  private inspectString(input: string, location: string): DetectionResult | null {
    if (!input || input.length < 2) return null;

    // Decode URL-encoded characters
    let decoded = input;
    try {
      decoded = decodeURIComponent(input);
    } catch {
      // Keep original if malformed
    }

    // Check SQL Injection patterns
    for (const pattern of SQLI_PATTERNS) {
      if (pattern.test(decoded) || pattern.test(input)) {
        return {
          detected: true,
          category: this.category,
          confidence: 0.95,
          reason: `SQL Injection pattern matched in ${location}`,
          blockDurationMs: this.blockDurationMs,
        };
      }
    }

    // Check Cross-Site Scripting patterns
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(decoded) || pattern.test(input)) {
        return {
          detected: true,
          category: this.category,
          confidence: 0.94,
          reason: `XSS malicious script pattern matched in ${location}`,
          blockDurationMs: this.blockDurationMs,
        };
      }
    }

    // Check Custom User Patterns
    for (const pattern of this.customPatterns) {
      if (pattern.test(decoded) || pattern.test(input)) {
        return {
          detected: true,
          category: this.category,
          confidence: 0.90,
          reason: `Custom security rule matched in ${location}`,
          blockDurationMs: this.blockDurationMs,
        };
      }
    }

    return null;
  }
}
