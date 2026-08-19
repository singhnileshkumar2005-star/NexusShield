# @nexusshield/waf

> **Zero-Knowledge Collaborative Web Application Firewall (WAF) Middleware for Node.js & Express**

[![npm version](https://img.shields.io/npm/v/@nexusshield/waf.svg)](https://www.npmjs.com/package/@nexusshield/waf)
[![license](https://img.shields.io/npm/l/@nexusshield/waf.svg)](LICENSE)

**`@nexusshield/waf`** is a high-performance, collaborative web application firewall middleware for Express and Node.js. When any protected node in your network detects a malicious payload (such as SQL Injection, Cross-Site Scripting, or Path Traversal), it blocks the attacker locally and asynchronously transmits threat intelligence to the Central Threat Hub. All interconnected nodes achieve immediate collective immunity within seconds.

---

## 🌟 Key Features

- 🛡️ **Autonomous Threat Vector Detection**:
  - **SQL Injection (SQLi)**: UNION SELECT, comments (`--`, `/*`, `#`), boolean injections (`' OR 1=1`), stored procedures.
  - **Cross-Site Scripting (XSS)**: Malicious `<script>` tags, inline event handlers (`onerror`, `onload`), `javascript:` pseudo-protocols, DOM injections.
  - **Path Traversal / LFI**: Directory escape patterns (`../`, `..\`, `%2e%2e%2f`).
  - **Multi-Vector Request Inspection**: Thoroughly inspects URLs, query strings, headers (`User-Agent`, `Referer`, custom payload headers), and JSON/URL-encoded request bodies.
- ⚡ **Sub-Millisecond In-Memory Filtering**: Evaluates IP addresses against a local in-memory `Set` before running routes, ensuring zero latency overhead for benign traffic.
- 🌐 **Collaborative Collective Immunity**: Synchronizes threat blocklists every 2 seconds with the Central Threat Hub. If Site A is attacked, Site B becomes immune automatically.
- 🔒 **Zero-Knowledge & Multi-Tenant**: Attributed telemetry allows individual client tracking while enforcing global distributed defense.
- 📘 **First-Class TypeScript Support**: Full TypeScript declarations (`middleware.d.ts`) included out-of-the-box.
- 🔄 **Graceful Fallback**: Continues protecting applications locally even if the Central Threat Hub is temporarily unreachable.

---

## 📦 Installation

```bash
npm install @nexusshield/waf axios
```

*(Note: Requires Express 4.x or 5.x)*

---

## 🚀 Quickstart

### Express (JavaScript / CommonJS)

```javascript
const express = require('express');
const threatShield = require('@nexusshield/waf');

const app = express();

// 1. Parse JSON and Form bodies BEFORE applying WAF middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Attach NexusShield WAF middleware
app.use(threatShield({
  clientId: 'client_A',
  hubUrl: process.env.HUB_URL || 'http://127.0.0.1:8000',
  apiKey: process.env.NEXUS_API_KEY || 'nexus_dev_key_2026'
}));

// 3. Define your application routes
app.get('/', (req, res) => {
  res.json({ status: 'secure', message: 'Welcome to protected application!' });
});

app.get('/search', (req, res) => {
  res.json({ query: req.query.q, results: [] });
});

app.post('/comment', (req, res) => {
  res.json({ status: 'success', comment: req.body });
});

app.listen(3000, () => {
  console.log('Protected server running on http://localhost:3000');
});
```

---

### Express (TypeScript / ES Modules)

```typescript
import express, { Request, Response } from 'express';
import threatShield, { NexusWafConfig } from '@nexusshield/waf';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const config: NexusWafConfig = {
  clientId: 'tenant_production',
  hubUrl: process.env.HUB_URL || 'https://hub.yourdomain.com',
  apiKey: process.env.NEXUS_API_KEY
};

app.use(threatShield(config));

app.get('/api/data', (req: Request, res: Response) => {
  res.json({ data: 'Sensitive data protected by NexusShield' });
});

app.listen(3000, () => {
  console.log('Secure TypeScript server running on port 3000');
});
```

---

## ⚙️ Configuration Options

You can pass an options object or a single string `clientId` to `threatShield(config)`:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `clientId` | `string` | `'default'` | Unique client or tenant identifier used for telemetry logging. |
| `hubUrl` | `string` | `process.env.HUB_URL` or `'http://127.0.0.1:8000'` | Base URL of the Central Threat Hub backend. |
| `apiKey` | `string` | `process.env.NEXUS_API_KEY` or `'nexus_dev_key_2026'` | API Key for authenticating reports and telemetry. |

---

## 🌍 Environment Variables

`@nexusshield/waf` automatically checks environment variables if explicit options are not passed:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `HUB_URL` | URL of the central Threat Hub | `http://127.0.0.1:8000` |
| `NEXUS_API_KEY` | Secret API key for Threat Hub authentication | `nexus_dev_key_2026` |
| `CLIENT_ID` | Identifier for the local spoke node | `default` |

---

## 🛡️ How It Works

```
   Incoming HTTP Request
            │
            ▼
 ┌─────────────────────┐
 │ 1. IP Normalization │  (Converts ::ffff:127.0.0.1 -> 127.0.0.1)
 └──────────┬──────────┘
            │
            ▼
 ┌─────────────────────┐       YES      ┌───────────────────────────────────┐
 │ 2. In Blocklist?    ├───────────────►│ Return 403 Forbidden (Immediate)  │
 └──────────┬──────────┘                └───────────────────────────────────┘
            │ NO
            ▼
 ┌─────────────────────┐       YES      ┌───────────────────────────────────┐
 │ 3. Threat Detected? ├───────────────►│ • Add to local blockedIPs Set     │
 │    (SQLi/XSS/LFI)   │                │ • Async POST to Hub /report       │
 └──────────┬──────────┘                │ • Return 403 Malicious Payload    │
            │ NO                        └───────────────────────────────────┘
            ▼
 ┌─────────────────────┐
 │ 4. next() -> Route  │  (Request proceeds safely to Express handler)
 └─────────────────────┘
```

---

## 🛠️ API & Utilities

```javascript
const threatShield = require('@nexusshield/waf');

// 1. Manually trigger synchronization with Threat Hub
await threatShield.syncBlocklist();

// 2. Inspect an in-memory Set of currently blocked IP addresses
console.log(threatShield.blockedIPs);

// 3. Inspect a raw string or request object for threat vectors
const vector = threatShield.detectThreatVector(req);
if (vector) {
  console.log(`Threat vector detected: ${vector}`);
}

// 4. Normalize raw client IP strings
const cleanIp = threatShield.normalizeIP(req.ip);
```

---

## 📄 License

MIT © [NexusShield](https://github.com/NexusShield/NexusShield)
