# @nexussecure/agent

> **Universal Real-Time Threat Intelligence & Security Agent SDK**  
> Collaborative, Privacy-Preserving Attack-Defense Network for Modern Web Applications.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Overview

`@nexussecure/agent` is an ultra-fast, zero-overhead security middleware library designed to install on any existing website or API (Next.js, Express, Fastify, vanilla Node.js HTTP).

### Core Features

1. **High-Speed In-Memory Blocklist Cache (`< 0.1ms` lookups):**
   - O(1) LRU eviction and TTL-based auto-pruning.
   - Built-in automatic immunity for localhost (`127.0.0.1`, `::1`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and custom CIDRs.
2. **Local Heuristic Threat Detectors:**
   - **Honeypot Traps:** Traps automated scanners probing `/.env`, `/.git`, `/wp-login.php`, `/actuator`, `/.aws/credentials`, etc.
   - **Brute-Force & Credential Stuffing:** Sliding-window tracking for failed login attempts (e.g. 5 attempts / 60s).
   - **Rate Abuse / Mini-DDoS:** Sliding-window burst tracker (> 50 req/sec from a single IP).
   - **SQLi & XSS Heuristics:** Deep regex inspection of query parameters, headers, URL paths, and request bodies.
3. **Real-Time Mesh Synchronization:**
   - Server-Sent Events (SSE) `/v1/events` for sub-second block broadcasts from peer sites.
   - Fallback polling `/v1/blocklist?since=...` every 60s for maximum network resilience.
   - Asynchronous telemetry heartbeats and mitigation counters `/v1/heartbeat`.
   - Asynchronous non-blocking threat reporting `/v1/report` with queue batching.
4. **Fail-Safe & Non-Blocking Guarantee:**
   - If the Hub or network goes down, your website will **never crash**. Local in-memory defenses continue running with existing cache while passing benign traffic through safely.

---

## 📦 Installation

```bash
npm install @nexussecure/agent
# or
pnpm add @nexussecure/agent
# or
yarn add @nexussecure/agent
```

---

## 🚀 Quickstart & Framework Middlewares

### 1. Express.js

```ts
import express from 'express';
import { nexusSecureExpress } from '@nexussecure/agent';

const app = express();

// Register NexusSecure at the top of your middleware stack
app.use(nexusSecureExpress({
  apiKey: process.env.NEXUS_API_KEY!,
  hubUrl: process.env.NEXUS_HUB_URL || 'https://hub.nexussecure.network',
  siteName: 'My Production Store',
}));

app.get('/api/products', (req, res) => {
  res.json([{ id: 1, name: 'Secure Item' }]);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

### 2. Next.js (App Router / `middleware.ts`)

```ts
// middleware.ts
import { nexusSecureNext } from '@nexussecure/agent/next';

export const middleware = nexusSecureNext({
  apiKey: process.env.NEXUS_API_KEY!,
  hubUrl: process.env.NEXUS_HUB_URL,
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

### 3. Fastify

```ts
import Fastify from 'fastify';
import { nexusSecureFastify } from '@nexussecure/agent';

const app = Fastify();

await app.register(nexusSecureFastify, {
  apiKey: process.env.NEXUS_API_KEY!,
  hubUrl: process.env.NEXUS_HUB_URL,
});

app.get('/', async () => {
  return { status: 'healthy' };
});

await app.listen({ port: 3000 });
```

---

### 4. Vanilla Node.js HTTP Server

```ts
import http from 'node:http';
import { createNexusSecureHttpWrapper } from '@nexussecure/agent';

const server = http.createServer(
  createNexusSecureHttpWrapper((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello from secure server' }));
  }, {
    apiKey: process.env.NEXUS_API_KEY!,
    hubUrl: process.env.NEXUS_HUB_URL,
  })
);

server.listen(3000);
```

---

## ⚙️ Configuration Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | **(Required)** | Member API key issued by NexusSecure Hub |
| `hubUrl` | `string` | `"http://localhost:3000"` | Central NexusSecure Hub URL |
| `siteName` | `string` | `undefined` | Optional human-readable site identifier |
| `enabled` | `boolean` | `true` | Master switch to enable or disable the agent |
| `syncIntervalMs` | `number` | `60000` (60s) | Fallback blocklist polling interval |
| `heartbeatIntervalMs` | `number` | `30000` (30s) | Telemetry heartbeat dispatch interval |
| `maxCacheSize` | `number` | `50000` | Maximum LRU entries stored in memory |
| `defaultBlockTtlMs` | `number` | `3600000` (1h) | Default block duration for local detections |
| `whitelist` | `string[]` | `[]` | User-defined IP or CIDR whitelist (e.g. `["203.0.113.0/24"]`) |
| `trustProxy` | `boolean \| number \| string[]` | `true` | Trust reverse proxy headers (`X-Forwarded-For`, `CF-Connecting-IP`) |
| `logLevel` | `'debug' \| 'info' \| 'warn' \| 'error' \| 'none'` | `'info'` | Logging verbosity |
| `blockAction` | `'block' \| 'log_only' \| 'custom'` | `'block'` | Action on block: return 403, log-only, or run custom handler |
| `customBlockResponse` | `Function` | `undefined` | Custom block handler callback |
| `detectors.bruteForce` | `BruteForceDetectorConfig` | `{ maxAttempts: 5, windowMs: 60000 }` | Failed login tracking config |
| `detectors.honeypot` | `HoneypotDetectorConfig` | `{ enabled: true }` | Recon endpoint deception config |
| `detectors.rateAbuse` | `RateAbuseDetectorConfig` | `{ maxRequests: 50, windowMs: 1000 }` | Burst rate limiter config |
| `detectors.sqliXss` | `SqliXssDetectorConfig` | `{ enabled: true }` | Heuristic SQLi and XSS scanner config |

---

## 🔒 Privacy & Non-Disclosure Guarantee

NexusSecure strictly shares **Indicators of Compromise (IoCs)** — never application payloads, URLs, parameters, cookies, or victim identities:
- Attacker IPs and high-level attack categories (`sqli_xss`, `honeypot_probe`, `brute_force`, `rate_abuse`) are the only fields broadcast across the mesh.
- Member sites remain 100% anonymous to each other.

---

## 🧪 Testing

```bash
npm run test
```

---

## 📄 License

MIT © NexusSecure Team
