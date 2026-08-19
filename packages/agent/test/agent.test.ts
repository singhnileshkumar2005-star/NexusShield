import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NexusAgent } from '../src/agent.js';
import { nexusSecureExpress } from '../src/middleware/express.js';
import { inspectNextRequest } from '../src/middleware/next.js';

describe('NexusAgent Orchestration & Middlewares', () => {
  it('should instantiate agent and inspect requests cleanly', async () => {
    const agent = new NexusAgent({
      apiKey: 'test-api-key-12345',
      hubUrl: 'http://localhost:3000',
      enableSse: false,
      enablePolling: false,
      enableHeartbeat: false,
    });

    await agent.start();

    // 1. Benign request
    const benignResult = agent.inspect({
      ip: '203.0.113.50',
      path: '/api/v1/data',
      method: 'GET',
      headers: {},
    });
    assert.equal(benignResult.blocked, false);

    // 2. Honeypot attack
    const attackResult = agent.inspect({
      ip: '203.0.113.50',
      path: '/.env',
      method: 'GET',
      headers: {},
    });
    assert.equal(attackResult.blocked, true);
    assert.equal(attackResult.category, 'honeypot_probe');

    // 3. Subsequent request from same IP is now blocked instantly from in-memory cache
    const cachedResult = agent.inspect({
      ip: '203.0.113.50',
      path: '/api/v1/data',
      method: 'GET',
      headers: {},
    });
    assert.equal(cachedResult.blocked, true);

    const stats = agent.getStats();
    assert.ok(stats.totalMitigations >= 2);
    assert.ok(stats.activeBlocks >= 1);

    await agent.stop();
  });

  it('should provide fail-safe guarantee if unexpected input occurs', async () => {
    const agent = new NexusAgent({
      apiKey: 'test-api-key',
      enableSse: false,
      enablePolling: false,
      enableHeartbeat: false,
    });

    // Pass null/undefined or weird object -> must never throw or crash
    const res1 = agent.inspect(null);
    assert.equal(res1.blocked, false);

    const res2 = agent.inspect({});
    assert.equal(res2.blocked, false);

    await agent.stop();
  });

  it('should seamlessly integrate with Express middleware pattern', async () => {
    const agent = new NexusAgent({
      apiKey: 'test-api-key',
      enableSse: false,
      enablePolling: false,
      enableHeartbeat: false,
    });

    const middleware = nexusSecureExpress({
      apiKey: 'test-api-key',
      agent,
      autoStart: false,
    });

    // Test allowed request
    let nextCalled = false;
    const req1: any = {
      ip: '198.51.100.1',
      path: '/home',
      method: 'GET',
      headers: {},
    };
    const res1: any = {
      on: () => {},
      setHeader: () => {},
      status: () => ({ json: () => {} }),
    };

    middleware(req1, res1, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(req1.nexusSecure.blocked, false);

    // Test blocked request
    let blockedStatus = 0;
    let blockedBody: any = null;
    const req2: any = {
      ip: '198.51.100.2',
      path: '/.git/config',
      method: 'GET',
      headers: {},
    };
    const res2: any = {
      headers: {} as Record<string, string>,
      setHeader(k: string, v: string) {
        this.headers[k] = v;
      },
      status(code: number) {
        blockedStatus = code;
        return {
          json: (body: any) => {
            blockedBody = body;
          },
        };
      },
      on: () => {},
    };

    let nextCalledForBlocked = false;
    middleware(req2, res2, () => {
      nextCalledForBlocked = true;
    });

    assert.equal(nextCalledForBlocked, false, 'Blocked request should not call next()');
    assert.equal(blockedStatus, 403);
    assert.equal(blockedBody?.error, 'Forbidden');
    assert.equal(res2.headers['X-NexusSecure-Blocked'], 'true');

    await agent.stop();
  });

  it('should support Next.js Request / NextRequest inspection', async () => {
    const agent = new NexusAgent({
      apiKey: 'test-api-key',
      enableSse: false,
      enablePolling: false,
      enableHeartbeat: false,
    });

    const mockRequest = {
      url: 'https://example.com/wp-admin',
      method: 'GET',
      headers: new Map([
        ['cf-connecting-ip', '203.0.113.99'],
        ['user-agent', 'ScannerBot/1.0'],
      ]),
    };

    const result = inspectNextRequest(mockRequest, agent);
    assert.equal(result.blocked, true);
    assert.equal(result.category, 'honeypot_probe');
    assert.equal(result.ip, '203.0.113.99');

    await agent.stop();
  });
});
