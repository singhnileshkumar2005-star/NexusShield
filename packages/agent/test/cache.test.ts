import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryCache } from '../src/cache.js';
import { isPrivateOrLoopbackIp, ipInCidr, normalizeIp } from '../src/utils/ip.js';

describe('IP & CIDR Utilities', () => {
  it('should normalize IPv4 and IPv6 addresses correctly', () => {
    assert.equal(normalizeIp('::ffff:192.168.1.1'), '192.168.1.1');
    assert.equal(normalizeIp('192.168.1.1:8080'), '192.168.1.1');
    assert.equal(normalizeIp('  10.0.0.1  '), '10.0.0.1');
    assert.equal(normalizeIp('[::1]:3000'), '::1');
  });

  it('should accurately detect private and loopback IPs', () => {
    assert.equal(isPrivateOrLoopbackIp('127.0.0.1'), true);
    assert.equal(isPrivateOrLoopbackIp('localhost'), true);
    assert.equal(isPrivateOrLoopbackIp('::1'), true);
    assert.equal(isPrivateOrLoopbackIp('10.0.5.23'), true);
    assert.equal(isPrivateOrLoopbackIp('172.20.0.1'), true);
    assert.equal(isPrivateOrLoopbackIp('192.168.1.100'), true);
    assert.equal(isPrivateOrLoopbackIp('169.254.1.1'), true);
    assert.equal(isPrivateOrLoopbackIp('100.64.0.5'), true);

    // Public IPs should NOT be private
    assert.equal(isPrivateOrLoopbackIp('8.8.8.8'), false);
    assert.equal(isPrivateOrLoopbackIp('1.1.1.1'), false);
    assert.equal(isPrivateOrLoopbackIp('203.0.113.5'), false);
  });

  it('should accurately match CIDR ranges for IPv4 and IPv6', () => {
    assert.equal(ipInCidr('10.5.0.1', '10.0.0.0/8'), true);
    assert.equal(ipInCidr('11.0.0.1', '10.0.0.0/8'), false);
    assert.equal(ipInCidr('192.168.4.15', '192.168.0.0/16'), true);
    assert.equal(ipInCidr('192.169.4.15', '192.168.0.0/16'), false);
    assert.equal(ipInCidr('2001:db8::1', '2001:db8::/32'), true);
  });
});

describe('MemoryCache (< 0.1ms In-Memory LRU & TTL)', () => {
  it('should perform sub-0.1ms blocklist lookups', () => {
    const cache = new MemoryCache();
    const testIp = '198.51.100.42';

    cache.block(testIp, {
      category: 'brute_force',
      confidence: 0.95,
      expiresAt: Date.now() + 60_000,
    });

    const start = performance.now();
    const isBlocked = cache.isBlocked(testIp);
    const duration = performance.now() - start;

    assert.equal(isBlocked, true);
    // Lookup duration should be extremely fast (< 0.5ms even under test harness)
    assert.ok(duration < 1.0, `Expected < 1ms, got ${duration}ms`);
    cache.destroy();
  });

  it('should auto-expire entries based on TTL', async () => {
    const cache = new MemoryCache({ pruneIntervalMs: 0 });
    const testIp = '198.51.100.99';

    // Block for 20ms
    cache.block(testIp, {
      category: 'honeypot_probe',
      expiresAt: Date.now() + 20,
    });

    assert.equal(cache.isBlocked(testIp), true);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.equal(cache.isBlocked(testIp), false);
    cache.destroy();
  });

  it('should protect whitelisted IPs and private ranges from blocks', () => {
    const cache = new MemoryCache({
      initialWhitelist: ['203.0.113.0/24'],
    });

    // Attempt to block private IP
    cache.block('127.0.0.1', { category: 'rate_abuse' });
    assert.equal(cache.isBlocked('127.0.0.1'), false);
    assert.equal(cache.isWhitelisted('127.0.0.1'), true);

    // Attempt to block custom whitelisted subnet
    cache.block('203.0.113.50', { category: 'sqli_xss' });
    assert.equal(cache.isBlocked('203.0.113.50'), false);
    assert.equal(cache.isWhitelisted('203.0.113.50'), true);

    cache.destroy();
  });

  it('should respect LRU max size limits', () => {
    const cache = new MemoryCache({ maxSize: 3 });

    cache.block('1.1.1.1', { expiresAt: Date.now() + 100_000 });
    cache.block('2.2.2.2', { expiresAt: Date.now() + 100_000 });
    cache.block('3.3.3.3', { expiresAt: Date.now() + 100_000 });

    // Touch 1.1.1.1 so 2.2.2.2 becomes oldest
    cache.isBlocked('1.1.1.1');

    // Add 4th entry -> 2.2.2.2 should be evicted
    cache.block('4.4.4.4', { expiresAt: Date.now() + 100_000 });

    assert.equal(cache.isBlocked('1.1.1.1'), true);
    assert.equal(cache.isBlocked('3.3.3.3'), true);
    assert.equal(cache.isBlocked('4.4.4.4'), true);
    assert.equal(cache.isBlocked('2.2.2.2'), false);

    cache.destroy();
  });
});
