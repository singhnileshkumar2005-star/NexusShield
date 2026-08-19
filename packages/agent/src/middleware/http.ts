/**
 * NexusSecure Middleware for Native Node.js HTTP Servers
 * Wraps standard `http.createServer((req, res) => ...)` listeners.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { NexusAgent } from '../agent.js';
import { AgentConfig, BlockEntry, InspectionResult } from '../types.js';

export interface NexusHttpOptions extends Partial<AgentConfig> {
  apiKey: string;
  agent?: NexusAgent;
  autoStart?: boolean;
}

export type HttpHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

/**
 * Wraps standard Node.js HTTP request handler with NexusSecure threat defense.
 *
 * @example
 * ```ts
 * import http from 'node:http';
 * import { createNexusSecureHttpWrapper } from '@nexussecure/agent';
 *
 * const server = http.createServer(
 *   createNexusSecureHttpWrapper((req, res) => {
 *     res.writeHead(200, { 'Content-Type': 'text/plain' });
 *     res.end('Hello World');
 *   }, {
 *     apiKey: process.env.NEXUS_API_KEY!,
 *     hubUrl: process.env.NEXUS_HUB_URL,
 *   })
 * );
 * ```
 */
export function createNexusSecureHttpWrapper(handler: HttpHandler, options: NexusHttpOptions): HttpHandler {
  const agent = options.agent || new NexusAgent(options as AgentConfig);

  if (options.autoStart !== false) {
    agent.start().catch((err) => {
      agent.logger.warn(`Node HTTP NexusSecure background worker error: ${err?.message || err}`);
    });
  }

  return function wrappedHttpHandler(req: IncomingMessage, res: ServerResponse) {
    const result: InspectionResult = agent.inspect(req);

    // Decorate request object
    (req as any).nexusSecure = {
      agent,
      result,
      ip: result.ip,
      blocked: result.blocked,
    };

    if (result.blocked) {
      const blockEntry = result.blockEntry || ({
        ip: result.ip,
        category: result.category || 'mesh_defense',
        reason: result.reason || 'Blocked by NexusSecure Mesh Defense',
        confidence: result.confidence ?? 1.0,
        expiresAt: Date.now() + 3600_000,
      } as BlockEntry);

      if (agent.config.customBlockResponse) {
        try {
          agent.config.customBlockResponse(req, res, blockEntry);
          return;
        } catch (err: any) {
          agent.logger.error(`Error in customBlockResponse: ${err?.message || err}`);
        }
      }

      res.writeHead(403, {
        'Content-Type': 'application/json',
        'X-NexusSecure-Blocked': 'true',
        'X-NexusSecure-Category': result.category || 'mesh_threat',
      });

      res.end(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Access denied: Request flagged by NexusSecure Collaborative Threat Defense.',
          category: result.category,
          reference: result.ip,
        })
      );
      return;
    }

    // Monitor for 401/403 brute force tracking
    res.on('finish', () => {
      try {
        if (res.statusCode === 401 || res.statusCode === 403) {
          const path = req.url || '';
          if (agent.bruteForceDetector.isAuthPath(path)) {
            agent.recordFailedAttempt(result.ip, 'brute_force');
          }
        }
      } catch {
        // Safe ignore
      }
    });

    return handler(req, res);
  };
}

export const nexusSecureHttp = createNexusSecureHttpWrapper;
export default createNexusSecureHttpWrapper;
