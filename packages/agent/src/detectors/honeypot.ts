/**
 * NexusSecure Threat Detector: Honeypot & Reconnaissance Endpoint Trap
 * Traps automated vulnerability scanners and malicious probes hitting sensitive deception endpoints.
 */
import { DetectionResult, HoneypotDetectorConfig, RequestContext, ThreatCategory } from '../types.js';
import { normalizeIp } from '../utils/ip.js';
import { Detector } from './base.js';

export const DEFAULT_HONEYPOT_PATHS: readonly string[] = [
  // Environment & configuration leaks
  '/.env',
  '/.env.local',
  '/.env.production',
  '/.env.development',
  '/.env.backup',
  '/.env.save',
  '/config.json',
  '/config.env',
  '/configuration.php',
  '/web.config',
  '/settings.py',

  // Source control exposures
  '/.git',
  '/.git/config',
  '/.git/head',
  '/.gitignore',
  '/.svn',
  '/.svn/entries',
  '/.hg',
  '/.bzr',
  '/.ds_store',

  // CMS & admin panels
  '/wp-admin',
  '/wp-login.php',
  '/wp-config.php',
  '/wp-content/debug.log',
  '/xmlrpc.php',
  '/admin.php',
  '/administrator',
  '/phpmyadmin',
  '/pma',
  '/adminer.php',
  '/mysql',
  '/dbadmin',

  // Cloud & credential secrets
  '/.aws/credentials',
  '/.aws/config',
  '/.ssh/id_rsa',
  '/.ssh/id_dsa',
  '/.ssh/authorized_keys',
  '/.bash_history',
  '/id_rsa',
  '/.docker/config.json',

  // Framework internals & dumps
  '/actuator',
  '/actuator/health',
  '/actuator/env',
  '/actuator/beans',
  '/actuator/mappings',
  '/server-status',
  '/solr',
  '/elmah.axd',
  '/.well-known/security.txt.bak',

  // Database and backup dumps
  '/backup.sql',
  '/dump.sql',
  '/db.sql',
  '/database.sql',
  '/backup.tar.gz',
  '/backup.zip',
  '/www.zip',
];

export class HoneypotDetector implements Detector {
  public readonly name = 'HoneypotDetector';
  public readonly category: ThreatCategory = 'honeypot_probe';

  private readonly enabled: boolean;
  private readonly trapPaths: string[];
  private readonly caseSensitive: boolean;
  private readonly blockDurationMs: number;

  constructor(config: HoneypotDetectorConfig = {}) {
    this.enabled = config.enabled ?? true;
    this.caseSensitive = config.caseSensitive ?? false;
    this.blockDurationMs = config.blockDurationMs ?? 86_400_000; // 24 hours

    const paths = config.trapPaths || DEFAULT_HONEYPOT_PATHS;
    this.trapPaths = this.caseSensitive ? [...paths] : paths.map((p) => p.toLowerCase());
  }

  /**
   * Inspects incoming request path against deceptive honeypot endpoints.
   */
  public inspect(context: RequestContext): DetectionResult | null {
    if (!this.enabled) return null;
    const ip = normalizeIp(context.ip);
    if (!ip) return null;

    const rawPath = context.path || context.url || '';
    if (!rawPath) return null;

    // Decode URI path safely
    let decodedPath = rawPath;
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      // Ignore decoding errors
    }

    // Strip trailing slashes and query strings
    const cleanPath = (this.caseSensitive ? decodedPath : decodedPath.toLowerCase()).split('?')[0]?.trim() ?? '';

    for (const trap of this.trapPaths) {
      if (
        cleanPath === trap ||
        cleanPath.startsWith(trap + '/') ||
        cleanPath.endsWith(trap) ||
        cleanPath === trap + '/'
      ) {
        return {
          detected: true,
          category: this.category,
          confidence: 0.98,
          reason: `Reconnaissance probe detected hitting deceptive honeypot endpoint: ${trap}`,
          blockDurationMs: this.blockDurationMs,
        };
      }
    }

    return null;
  }
}
