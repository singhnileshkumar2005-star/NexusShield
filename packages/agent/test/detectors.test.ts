import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BruteForceDetector } from '../src/detectors/brute-force.js';
import { HoneypotDetector } from '../src/detectors/honeypot.js';
import { RateAbuseDetector } from '../src/detectors/rate-abuse.js';
import { SqliXssDetector } from '../src/detectors/sqli-xss.js';
import { RequestContext } from '../src/types.js';

describe('Local Threat Detectors', () => {
  describe('HoneypotDetector', () => {
    const detector = new HoneypotDetector();

    it('should catch reconnaissance probes hitting sensitive paths', () => {
      const probePaths = [
        '/.env',
        '/.git/config',
        '/wp-admin',
        '/wp-login.php',
        '/phpmyadmin',
        '/actuator',
        '/.aws/credentials',
        '/xmlrpc.php',
        '/.well-known/security.txt.bak',
      ];

      for (const path of probePaths) {
        const ctx: RequestContext = {
          ip: '203.0.113.10',
          path,
          method: 'GET',
          headers: {},
        };
        const result = detector.inspect(ctx);
        assert.ok(result, `Expected detection for ${path}`);
        assert.equal(result.detected, true);
        assert.equal(result.category, 'honeypot_probe');
        assert.ok(result.confidence >= 0.95);
      }
    });

    it('should not flag benign paths', () => {
      const benignPaths = ['/', '/about', '/api/v1/products', '/dashboard', '/assets/style.css'];
      for (const path of benignPaths) {
        const ctx: RequestContext = {
          ip: '203.0.113.10',
          path,
          method: 'GET',
          headers: {},
        };
        const result = detector.inspect(ctx);
        assert.equal(result, null);
      }
    });
  });

  describe('BruteForceDetector', () => {
    it('should trigger block after exceeding max failed attempts in sliding window', () => {
      const detector = new BruteForceDetector({
        maxAttempts: 3,
        windowMs: 10_000,
      });

      const ip = '198.51.100.77';

      // 1st failed attempt
      assert.equal(detector.recordFailure(ip), null);
      // 2nd failed attempt
      assert.equal(detector.recordFailure(ip), null);
      // 3rd failed attempt -> triggers threshold
      const detection = detector.recordFailure(ip);
      assert.ok(detection);
      assert.equal(detection.detected, true);
      assert.equal(detection.category, 'brute_force');

      detector.destroy();
    });
  });

  describe('RateAbuseDetector', () => {
    it('should detect burst traffic exceeding rate threshold', () => {
      const detector = new RateAbuseDetector({
        maxRequests: 5,
        windowMs: 1_000,
      });

      const ip = '198.51.100.88';
      const ctx: RequestContext = { ip, path: '/api/search', method: 'GET', headers: {} };

      for (let i = 0; i < 4; i++) {
        assert.equal(detector.inspect(ctx), null);
      }

      // 5th request in 1s triggers threshold
      const burstResult = detector.inspect(ctx);
      assert.ok(burstResult);
      assert.equal(burstResult.detected, true);
      assert.equal(burstResult.category, 'rate_abuse');

      detector.destroy();
    });
  });

  describe('SqliXssDetector', () => {
    const detector = new SqliXssDetector();

    it('should detect SQL injection patterns in query params, headers, and paths', () => {
      const sqliCases: RequestContext[] = [
        {
          ip: '203.0.113.20',
          path: '/api/users',
          method: 'GET',
          headers: {},
          query: { q: "' UNION SELECT 1, password FROM users --" },
        },
        {
          ip: '203.0.113.21',
          path: '/search',
          method: 'GET',
          headers: {},
          query: { id: "1' OR '1'='1" },
        },
        {
          ip: '203.0.113.22',
          path: '/api/items',
          method: 'GET',
          headers: { 'user-agent': "Mozilla/5.0' OR 1=1 --" },
        },
        {
          ip: '203.0.113.23',
          path: '/products',
          method: 'POST',
          headers: {},
          body: { comment: "'; WAITFOR DELAY '0:0:5'--" },
        },
      ];

      for (const ctx of sqliCases) {
        const result = detector.inspect(ctx);
        assert.ok(result, `Expected SQLi detection for: ${JSON.stringify(ctx)}`);
        assert.equal(result.detected, true);
        assert.equal(result.category, 'sqli_xss');
      }
    });

    it('should detect XSS attack payloads', () => {
      const xssCases: RequestContext[] = [
        {
          ip: '203.0.113.30',
          path: '/search',
          method: 'GET',
          headers: {},
          query: { q: '<script>alert(document.cookie)</script>' },
        },
        {
          ip: '203.0.113.31',
          path: '/profile',
          method: 'GET',
          headers: {},
          query: { redirect: 'javascript:alert(1)' },
        },
        {
          ip: '203.0.113.32',
          path: '/comments',
          method: 'POST',
          headers: {},
          body: { msg: '<img src=x onerror=alert(1)>' },
        },
      ];

      for (const ctx of xssCases) {
        const result = detector.inspect(ctx);
        assert.ok(result, `Expected XSS detection for: ${JSON.stringify(ctx)}`);
        assert.equal(result.detected, true);
        assert.equal(result.category, 'sqli_xss');
      }
    });
  });
});
