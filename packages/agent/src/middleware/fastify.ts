/**
 * NexusSecure Plugin for Fastify
 * Ultra-low overhead threat mitigation hook for Fastify applications.
 */
import { NexusAgent } from '../agent.js';
import { AgentConfig, BlockEntry, InspectionResult } from '../types.js';

export interface NexusFastifyOptions extends Partial<AgentConfig> {
  apiKey: string;
  agent?: NexusAgent;
  autoStart?: boolean;
}

/**
 * Fastify plugin for NexusSecure threat protection.
 *
 * @example
 * ```ts
 * import Fastify from 'fastify';
 * import { nexusSecureFastify } from '@nexussecure/agent';
 *
 * const app = Fastify();
 * await app.register(nexusSecureFastify, {
 *   apiKey: process.env.NEXUS_API_KEY!,
 *   hubUrl: process.env.NEXUS_HUB_URL,
 * });
 * ```
 */
export async function nexusSecureFastify(fastify: any, options: NexusFastifyOptions): Promise<void> {
  const agent = options.agent || new NexusAgent(options as AgentConfig);

  if (options.autoStart !== false) {
    agent.start().catch((err) => {
      agent.logger.warn(`Fastify NexusSecure background worker error: ${err?.message || err}`);
    });
  }

  // Hook 1: onRequest - Fast early inspection & blocking
  fastify.addHook('onRequest', async (req: any, reply: any) => {
    const result: InspectionResult = agent.inspect(req);

    // Decorate request object
    req.nexusSecure = {
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
          await agent.config.customBlockResponse(req, reply, blockEntry);
          return;
        } catch (err: any) {
          agent.logger.error(`Error in customBlockResponse: ${err?.message || err}`);
        }
      }

      reply
        .header('X-NexusSecure-Blocked', 'true')
        .header('X-NexusSecure-Category', result.category || 'mesh_threat')
        .code(403)
        .send({
          error: 'Forbidden',
          message: 'Access denied: Request flagged by NexusSecure Collaborative Threat Defense.',
          category: result.category,
          reference: result.ip,
        });

      return reply;
    }
  });

  // Hook 2: onResponse - Auth failure monitor for Brute-Force tracking
  fastify.addHook('onResponse', async (req: any, reply: any) => {
    try {
      const statusCode = reply.statusCode;
      if (statusCode === 401 || statusCode === 403) {
        const path = req.url || req.routerPath || '';
        if (agent.bruteForceDetector.isAuthPath(path)) {
          const clientIp = req.nexusSecure?.ip || agent.extractIp(req);
          agent.recordFailedAttempt(clientIp, 'brute_force');
        }
      }
    } catch {
      // Safe ignore
    }
  });
}

export default nexusSecureFastify;
