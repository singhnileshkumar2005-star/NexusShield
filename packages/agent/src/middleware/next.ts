/**
 * NexusSecure Middleware & Helpers for Next.js (App Router, Pages Router & middleware.ts)
 * Native Web Standards (Request/Response) compatible threat mitigation.
 */
import { NexusAgent } from '../agent.js';
import { AgentConfig, BlockEntry, InspectionResult, RequestContext } from '../types.js';

export interface NexusNextOptions extends Partial<AgentConfig> {
  apiKey: string;
  agent?: NexusAgent;
  autoStart?: boolean;
}

// Global agent instance cache for Next.js development hot-reloads
const globalAgents: Map<string, NexusAgent> = new Map();

export function getOrCreateNextAgent(options: NexusNextOptions): NexusAgent {
  if (options.agent) return options.agent;
  const key = options.apiKey;
  if (!globalAgents.has(key)) {
    const newAgent = new NexusAgent(options as AgentConfig);
    if (options.autoStart !== false) {
      newAgent.start().catch((err) => {
        newAgent.logger.warn(`NexusSecure Next.js agent background sync failed: ${err?.message || err}`);
      });
    }
    globalAgents.set(key, newAgent);
  }
  return globalAgents.get(key)!;
}

/**
 * Next.js Edge / App Router Middleware Handler.
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { nexusSecureNext } from '@nexussecure/agent/next';
 *
 * export const middleware = nexusSecureNext({
 *   apiKey: process.env.NEXUS_API_KEY!,
 *   hubUrl: process.env.NEXUS_HUB_URL,
 * });
 *
 * export const config = {
 *   matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
 * };
 * ```
 */
export function nexusSecureNext(options: NexusNextOptions) {
  const agent = getOrCreateNextAgent(options);

  return async function nextMiddleware(request: any) {
    const result = inspectNextRequest(request, agent);

    if (result.blocked) {
      const blockEntry: BlockEntry = result.blockEntry || {
        ip: result.ip,
        category: result.category || 'mesh_threat',
        confidence: result.confidence ?? 1.0,
        expiresAt: Date.now() + 3600_000,
        reason: result.reason,
      };

      const body = JSON.stringify({
        error: 'Forbidden',
        message: 'Access denied: Request flagged by NexusSecure Collaborative Threat Defense.',
        category: result.category,
        reference: result.ip,
      });

      return new Response(body, {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-NexusSecure-Blocked': 'true',
          'X-NexusSecure-Category': String(blockEntry.category),
          'X-NexusSecure-Reason': encodeURIComponent(String(blockEntry.reason || '').substring(0, 100)),
        },
      });
    }

    // Continue Next.js request pipeline
    return undefined;
  };
}

/**
 * Inspects a standard NextRequest or Web Request object using NexusAgent.
 */
export function inspectNextRequest(request: any, agentOrOptions: NexusAgent | NexusNextOptions): InspectionResult {
  const agent = agentOrOptions instanceof NexusAgent ? agentOrOptions : getOrCreateNextAgent(agentOrOptions);

  // Extract properties from NextRequest / Request
  const urlStr = request.url || '/';
  let path = '/';
  let query: Record<string, string> = {};

  try {
    const parsed = new URL(urlStr, 'http://localhost');
    path = parsed.pathname;
    parsed.searchParams.forEach((v, k) => {
      query[k] = v;
    });
  } catch {
    path = urlStr.split('?')[0] || '/';
  }

  const headers: Record<string, string> = {};
  if (request.headers) {
    if (typeof request.headers.forEach === 'function') {
      request.headers.forEach((v: string, k: string) => {
        headers[k.toLowerCase()] = v;
      });
    } else if (typeof request.headers.entries === 'function') {
      for (const [k, v] of request.headers.entries()) {
        headers[k.toLowerCase()] = v;
      }
    } else {
      for (const [k, v] of Object.entries(request.headers)) {
        if (typeof v === 'string') headers[k.toLowerCase()] = v;
      }
    }
  }

  // NextRequest provides request.ip directly or via headers
  const reqIp =
    request.ip ||
    headers['cf-connecting-ip'] ||
    headers['true-client-ip'] ||
    headers['x-real-ip'] ||
    (headers['x-forwarded-for'] ? headers['x-forwarded-for'].split(',')[0]?.trim() : undefined) ||
    '127.0.0.1';

  const context: RequestContext = {
    ip: reqIp,
    path: request.nextUrl?.pathname || path,
    method: (request.method || 'GET').toUpperCase(),
    headers,
    query,
    url: urlStr,
    originalUrl: urlStr,
  };

  return agent.inspect(context);
}

export default nexusSecureNext;
