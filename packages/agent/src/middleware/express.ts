/**
 * NexusSecure Middleware for Express.js & Connect
 * Seamlessly protects Express applications with sub-millisecond threat defense.
 */
import { NexusAgent } from '../agent.js';
import { AgentConfig, BlockEntry, InspectionResult } from '../types.js';

export interface NexusExpressOptions extends Partial<AgentConfig> {
  /** API key issued by NexusSecure Hub */
  apiKey: string;
  /** Custom instance of NexusAgent if already instantiated */
  agent?: NexusAgent;
  /** Automatically call agent.start() on initialization (default: true) */
  autoStart?: boolean;
}

export interface NexusExpressMiddleware {
  (req: any, res: any, next: (err?: any) => void): void;
  agent: NexusAgent;
}

/**
 * Creates an Express middleware that intercepts and mitigates threats before application logic runs.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { nexusSecureExpress } from '@nexussecure/agent';
 *
 * const app = express();
 * app.use(nexusSecureExpress({
 *   apiKey: process.env.NEXUS_API_KEY!,
 *   hubUrl: process.env.NEXUS_HUB_URL,
 * }));
 * ```
 */
export function nexusSecureExpress(options: NexusExpressOptions): NexusExpressMiddleware {
  const agent = options.agent || new NexusAgent(options as AgentConfig);

  if (options.autoStart !== false) {
    agent.start().catch((err) => {
      agent.logger.warn(`Failed to start NexusSecure background sync worker: ${err?.message || err}`);
    });
  }

  const middleware = function (req: any, res: any, next: (err?: any) => void) {
    const result: InspectionResult = agent.inspect(req);

    // Attach security context to request
    req.nexusSecure = {
      agent,
      result,
      ip: result.ip,
      blocked: result.blocked,
    };

    // If blocked, intercept and return 403 Forbidden
    if (result.blocked) {
      const blockEntry = result.blockEntry || ({
        ip: result.ip,
        category: result.category || 'mesh_defense',
        reason: result.reason || 'Blocked by NexusSecure Mesh Defense',
        confidence: result.confidence ?? 1.0,
        expiresAt: Date.now() + 3600_000,
      } as BlockEntry);

      // Handle custom block response if configured
      if (agent.config.customBlockResponse) {
        try {
          agent.config.customBlockResponse(req, res, blockEntry);
          return;
        } catch (err: any) {
          agent.logger.error(`Error in customBlockResponse handler: ${err?.message || err}`);
        }
      }

      // Standard RFC-compliant 403 Forbidden response
      res.setHeader('X-NexusSecure-Blocked', 'true');
      res.setHeader('X-NexusSecure-Category', result.category || 'mesh_threat');
      if (result.reason) {
        res.setHeader('X-NexusSecure-Reason', encodeURIComponent(result.reason.substring(0, 100)));
      }

      res.status(403).json({
        shield: 'NexusSecure',
        error: 'Forbidden',
        message: 'Access denied: Request flagged by NexusSecure Collaborative Threat Defense.',
        category: result.category,
        reference: result.ip,
      });
      return;
    }

    // Monitor response to catch failed login attempts (401/403) for Brute Force tracking
    res.on('finish', () => {
      try {
        const statusCode = res.statusCode;
        if (statusCode === 401 || statusCode === 403) {
          const path = req.path || req.url || '';
          if (agent.bruteForceDetector.isAuthPath(path)) {
            agent.recordFailedAttempt(result.ip, 'brute_force');
          }
        }
      } catch {
        // Safe ignore
      }
    });

    next();
  };

  middleware.agent = agent;
  return middleware;
}

export default nexusSecureExpress;
