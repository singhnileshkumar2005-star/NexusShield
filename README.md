# NexusSecure 🛡️
### Collaborative Attack-Defense Threat Intelligence Mesh for Websites
> *"If they attack one of us, they can't attack the rest of us."*

NexusSecure is a 100% free, privacy-preserving, collaborative threat-intelligence network that enables independent websites to defend against cyber attacks collectively. When any member site detects malicious activity (brute force, scanner reconnaissance, SQLi/XSS probing, or volumetric rate abuse), it shares an anonymized threat indicator (IoC) with the **NexusSecure Hub**. The Hub validates, corroborates, and pushes real-time blocklist updates to all participating sites—preemptively blocking attackers before they can reach other members.

---

## 🌟 Key Highlights & Design

- **100% Zero Cost & No Credit Card Required**: Runs out of the box locally in zero-config offline mode, and connects seamlessly to free-tier cloud services (**Supabase Free Tier** for PostgreSQL & Auth, Vercel/Render for hosting).
- **Zero-Knowledge Privacy Preservation**: Only indicators of compromise (attacker IP, threat category, confidence score, timestamp) are shared. Victim domains, URLs, headers, cookies, passwords, and payloads are **never** transmitted or logged.
- **Mathematical Corroboration Engine**: Computes dynamic reputation-weighted consensus with time-decay to prevent false positives and resist poisoning / Sybil attacks.
- **Sub-Millisecond In-Memory Agent SDK (`< 0.1ms` Overhead)**: Drop-in middleware for **Next.js**, **Express**, **Fastify**, and **Node.js HTTP** with LRU/TTL in-memory cache and fail-open resilience.
- **Two Dedicated Next.js Dashboards**: Built with Next.js 14 App Router, strictly following the **Vercel Light Design System** (`#171717` monochromatic palette, Geist typography, 1px border rings, zero drop shadows, pill buttons).

---

## 📁 Repository Structure

```
NexusSecure/
├── apps/
│   ├── hub/                       # NexusSecure Central Coordinator Backend (Port 3000)
│   │   ├── src/db/                # Dual-mode Supabase Cloud & Zero-Config Local Store
│   │   ├── src/services/          # Corroboration, Auth, Blocklist, SSE, Telemetry
│   │   └── src/routes/            # /v1/report, /v1/blocklist, /v1/events, /v1/stats
│   │
│   ├── admin-dashboard/           # Dashboard 1: Mesh Central Admin Ops (Next.js - Port 3010)
│   │   └── src/app/               # Operations Center, Global Blocklist, Member Fleet, Radar
│   │
│   └── site-portal/               # Dashboard 2: Client Site Owner Portal (Next.js - Port 3020)
│       └── src/app/               # My Site Overview, Setup Wizard, API Keys, Local Allowlists
│
├── packages/
│   └── agent/                     # Universal Agent SDK for Your Existing Websites
│       ├── src/cache.ts           # < 0.1ms In-Memory LRU/TTL Blocklist Cache
│       ├── src/detectors/         # Brute-Force, Honeypots, Rate Limiter, SQLi/XSS
│       ├── src/middleware/        # Express, Next.js, Fastify, Node HTTP middlewares
│       └── src/sync.ts            # Real-Time SSE Broadcaster Client & Polling Fallback
│
├── examples/
│   └── demo-websites/             # Sample Protected Websites & Simulation Runner
│       ├── site-a.ts              # E-Commerce Web App (Port 4001)
│       ├── site-b.ts              # SaaS Portal Web App (Port 4002)
│       ├── simulate-attack.ts     # Attack simulation test script
│       └── verify-mesh.ts         # 100% Automated End-to-End Verification Test
│
└── supabase/
    └── migrations/                # Complete Supabase PostgreSQL schema with RLS
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies & Build All Packages
```bash
npm install
npm run build
```

### 2. Start the NexusSecure Hub Coordinator
```bash
npm run dev:hub
```
*Hub running on `http://localhost:3000` (Health: `http://localhost:3000/health`)*

### 3. Start the Next.js Dashboards (Vercel Light Design)
* **Mesh Central Admin Dashboard:**
  ```bash
  npm run dev:admin
  ```
  *Open `http://localhost:3010` in your browser.*

* **Client Site Owner Portal:**
  ```bash
  npm run dev:portal
  ```
  *Open `http://localhost:3020` in your browser.*

---

## 🛡️ Connecting Your Existing Websites (In 3 Lines of Code)

### For Next.js Websites (`middleware.ts`)
```typescript
import { nexusSecureNext } from '@nexussecure/agent';

export const middleware = nexusSecureNext({
  apiKey: process.env.NEXUS_API_KEY!,
  hubUrl: process.env.NEXUS_HUB_URL || 'http://localhost:3000',
  siteName: 'My Next.js Website'
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
```

### For Express.js / Node.js Applications
```javascript
import express from 'express';
import { nexusSecureExpress } from '@nexussecure/agent';

const app = express();

app.use(nexusSecureExpress({
  apiKey: process.env.NEXUS_API_KEY,
  hubUrl: process.env.NEXUS_HUB_URL || 'http://localhost:3000',
  siteName: 'My Express App',
  sensitiveAuthPaths: ['/api/auth/login', '/login']
}));
```

### For Fastify Applications
```typescript
import Fastify from 'fastify';
import { nexusSecureFastify } from '@nexussecure/agent';

const fastify = Fastify();
await fastify.register(nexusSecureFastify, {
  apiKey: process.env.NEXUS_API_KEY!,
  hubUrl: process.env.NEXUS_HUB_URL
});
```

---

## 🧪 Running the Live Cross-Site Defense Simulation

To see the collaborative defense in action:

```bash
npx tsx examples/demo-websites/verify-mesh.ts
```

**What this verifies:**
1. ✅ **Site Alpha** detects and catches an attacker scanning for `/.env` or injecting SQL.
2. ✅ **Site Alpha** blocks the request with `403 Forbidden` and reports the anonymized IoC to the Hub.
3. ✅ **Hub** corroborates the report and broadcasts the blocklist update via Server-Sent Events (SSE).
4. ✅ **Site Beta** receives the update into memory within milliseconds.
5. ✅ When the same attacker tries to probe **Site Beta**, **Site Beta preemptively blocks the attacker on Attempt #1** without ever having been attacked before!
6. ✅ Both Next.js Dashboards update in real-time with live stream logs and telemetry charts.

---

## 🔒 Security & Privacy Guarantees

| Metric | Guarantee | Implementation |
| :--- | :--- | :--- |
| **Lookup Latency** | `< 0.1ms` | In-memory LRU Set/Map check before route execution |
| **Victim Privacy** | Zero Disclosure | Strips domains, URLs, headers, and request bodies |
| **Fail-Safe** | Fail-Open | If Hub is unreachable, sites continue normal operation |
| **Poison Resistance** | Reputation-Weighted Consensus | Blocks require corroboration or verified honeypot signatures |
| **Stale IP Healing** | Dynamic TTL Expiry | Blocks automatically expire after 24h–72h |
| **Admin Immunity** | Local Allowlist | RFC 1918 private subnets & custom IPs never blocked |
