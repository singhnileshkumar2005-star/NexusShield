# SentinelMesh
### A Free, Privacy-Preserving, Collaborative Attack-Defense Network for Websites

---

## 1. Executive Summary

**The Problem:** Today, every website defends itself in isolation. If an attacker probes, brute-forces, or exploits Website A, Website B has no idea that attacker even exists — until the same attacker comes knocking on B's door too. Small site owners especially can't afford enterprise WAFs (Web Application Firewalls) or threat-intel subscriptions (Cloudflare Enterprise, Akamai, AbuseIPDB Pro, etc.).

**The Idea:** Build a small, self-hostable **"neighborhood watch" network for websites**. When one connected site detects malicious activity (brute force, SQLi/XSS attempts, scanning, DDoS-like bursts, etc.), it reports the *attacker's* fingerprint (IP, request pattern, etc.) to a shared hub. The hub:
1. **Anonymizes the source** — no other member ever learns *which* site was attacked or *what* vulnerability was probed.
2. **Verifies/aggregates** the report (to prevent abuse of the system itself).
3. **Pushes a block instruction** to all other connected sites, so they preemptively block that attacker before it reaches them.

**Core value proposition:** *"If they attack one of us, they can't attack the rest of us."* — without any site exposing its own weaknesses or identity to the others.

**Cost target:** $0. Every component below is chosen from free-tier or fully open-source tools.

---

## 2. Core Design Principles

| Principle | What it means here |
|---|---|
| **Victim anonymity** | Member sites are never shown which other member reported an attacker, or what endpoint/vuln was hit. |
| **No vulnerability disclosure** | Only the *attacker's fingerprint* (IP, ASN, request signature, hash of payload pattern) is shared — never raw logs, URLs hit, payloads, or stack traces. |
| **Abuse resistance** | A malicious/compromised member shouldn't be able to get an innocent IP blocked network-wide on a single unverified report (reputation + threshold system). |
| **Zero cost** | Every piece of infra runs on free tiers or self-hosted open-source software. |
| **Low integration friction** | A site should be able to join by adding one small script/middleware — not rearchitecting their stack. |
| **Fail safe, not fail closed** | If SentinelMesh is down or unreachable, the protected site keeps working normally (defense-in-depth, not a single point of failure). |

---

## 3. High-Level Architecture

```
 ┌────────────┐        report (anon.)        ┌────────────┐
 │  Site A     │ ───────────────────────────▶ │             │
 │ (SentinelMesh Agent) │                     │  SentinelMesh│
 └────────────┘        block instruction      │     Hub      │
       ▲                ◀──────────────────── │ (API + DB)   │
       │                                       └──────┬──────┘
       │                                              │
       │                report (anon.)                │
 ┌────────────┐ ───────────────────────────▶          │
 │  Site B     │                                       │
 │ (Agent)     │ ◀──────────────────────────  block instruction
 └────────────┘
```

- **Hub (central coordinator)** — receives attack reports, strips identifying metadata, scores/verifies them, and broadcasts confirmed "block this fingerprint" events to every other member.
- **Agent (per-site plugin/middleware)** — sits inside each website's stack, detects suspicious activity locally, reports it to the Hub, and enforces block instructions received from the Hub.
- **Dashboard** — a simple web UI for each site owner to see *their own* stats (attacks blocked, IPs stopped) — never other members' data.

Two architecture options are detailed below — pick based on your comfort level. **Recommend starting with Option A (Hub-and-Spoke)** for the MVP; it's far simpler to build and secure.

### Option A — Hub-and-Spoke (Recommended for MVP)
One central free-hosted API service that all Agents talk to. Simple, easy to reason about, easy to secure, easy to rate-limit and prevent abuse.

### Option B — Decentralized / Gossip (Future/Advanced)
No single server; sites talk peer-to-peer using a gossip protocol (like how BitTorrent trackers or Mastodon federation works). More resilient, but much harder to prevent poisoning/abuse and much harder to build for free. **Treat as a v2+ idea**, not MVP.

---

## 4. How Anonymity & Non-Disclosure Actually Works

This is the heart of your idea, so here's the concrete mechanism:

1. **Every member site gets a random Member ID** (e.g. a UUID) at signup — never their domain name — used only for authentication with the Hub.
2. When Site A reports an attacker, the report contains **only**:
   - The attacker's IP (or hashed/truncated IP for extra privacy, see below)
   - Attack *category* only (e.g. `brute_force`, `sql_injection_attempt`, `xss_attempt`, `scanner`, `rate_abuse`) — never the exact URL, payload, or parameter that was hit
   - A timestamp and a confidence score
   - **No domain name, no site name, no URL path, no server details**
3. The Hub stores the report against an **internal random Member ID**, not a domain. Even the Hub operator (you) should design the DB so the mapping of *"who reported this"* is not exposed via any API response to other members — only used internally for reputation scoring and abuse prevention.
4. When broadcasting a block instruction to other members, the payload is just:
   ```json
   { "block_ip": "203.0.113.5", "category": "brute_force", "confidence": 0.87, "expires_in": 86400 }
   ```
   No source is attached at all.
5. **Optional extra layer (recommended):** Hash/truncate the reported IP with a keyed hash before storage for anything beyond the live blocklist, so even historical data dumps can't be reverse-engineered easily. (Live blocklist needs the real IP to actually be useful for firewall rules — but you can rotate/expire it aggressively, e.g., 24–72 hours.)

**In short:** the system moves *indicators of compromise (IOCs)*, never *evidence of compromise*. That distinction is what keeps it privacy-safe and legally sane.

---

## 5. Detection: What Counts as "An Attack"?

You don't need to build attack *detection* from scratch — you can lean on proven free/open-source detectors and just wire their output into your Agent. Start narrow (2–3 signal types), expand later.

| Signal | How to detect it for free |
|---|---|
| **Brute-force login attempts** | Count failed logins per IP in a time window (simple counter in your Agent middleware) |
| **SQLi / XSS probing** | Use **OWASP CRS (Core Rule Set)** with **ModSecurity** (both free, open-source WAF rules) — just consume its "this looks malicious" verdict |
| **Scanner / bot behavior** | Detect known bad user-agents, abnormal request rate, hitting non-existent paths (404 spam) |
| **Rate abuse / mini-DDoS** | Requests-per-second per IP exceeding threshold (simple sliding-window counter) |
| **Known-bad IP** | Cross-check against free public blocklists (e.g. **AbuseIPDB free tier**, **Spamhaus DROP list**, **FireHOL free IP lists**) as a bonus signal, not your main detector |

This keeps your product's job scoped to **sharing and coordinating response**, not reinventing WAF detection — which is realistic to build solo and for free.

---

## 6. Blocking: What Happens on the Receiving Side

Once an Agent receives a "block this IP" instruction from the Hub, it can enforce it in layers depending on what the site owner has access to:

1. **Application-layer block (works everywhere, no server access needed):** Agent middleware checks incoming request IP against local in-memory/Redis blocklist cache and returns `403 Forbidden` before the request reaches app logic.
2. **Web-server-layer block (if they control Nginx/Apache):** Agent periodically writes an updated `deny` list file that Nginx/Apache reads (or uses the Nginx `geo`/`map` module with a blocklist file).
3. **Firewall-layer block (if they have shell access):** Agent calls `fail2ban` (free) or directly issues `iptables`/`ufw` rules to drop packets from that IP entirely.
4. **Cloudflare-layer block (if they use Cloudflare, free tier included):** Agent calls the **free Cloudflare API** to add the IP to a firewall block rule — this is actually one of the easiest, most powerful free options since Cloudflare blocks it before it even reaches the origin server.

**Recommendation for MVP:** Start with #1 (app-layer) since it requires zero extra permissions from the site owner and works on any host — then offer #4 (Cloudflare) as the "power user" integration since it's free and very effective.

---

## 7. Preventing Abuse of the System Itself

This is critical — without it, an attacker (or a malicious member) could get an innocent IP blocked everywhere, or flood the Hub with junk. Handle this with:

- **Reputation score per member:** each Member ID accumulates trust over time based on how often their reports are corroborated by other members reporting the *same* IP independently.
- **Corroboration threshold:** don't broadcast a block instantly off one report — require either (a) a high-confidence single report (e.g., WAF rule fired with certainty) or (b) 2+ independent members reporting the same IP within a time window.
- **Rate limits per member:** cap how many reports a single Member ID can submit per hour, so a compromised/misbehaving agent can't spam the network.
- **TTL on all blocks:** every block instruction auto-expires (e.g. 24–72 hours) so stale or mistaken blocks self-heal instead of accumulating forever.
- **Manual allowlist:** every site owner can locally whitelist an IP that got wrongly blocked (e.g. their own office IP), overriding the network instruction on their side only.

---

## 8. Feature List (MVP → Later)

### MVP (Phase 1) — Build this first
- [ ] Site signup → generates Member ID + API key
- [ ] Lightweight Agent (Node.js/Express middleware to start) that:
  - Detects brute-force + basic rate abuse locally
  - Reports attacker fingerprints to Hub
  - Polls Hub for new block instructions and enforces app-layer blocking
- [ ] Hub API: `/report`, `/blocklist`, `/heartbeat`
- [ ] Basic corroboration + TTL logic
- [ ] Simple dashboard: "X attacks blocked today", "X IPs currently blocked" (own-site data only)

### Phase 2
- [ ] WordPress plugin version of the Agent (huge distribution potential — most small sites run WordPress)
- [ ] Cloudflare integration for auto-blocking at edge
- [ ] Reputation scoring system for members
- [ ] Public "transparency stats" page (e.g., "12,340 attacks stopped across the network this month" — aggregate only, never per-site)

### Phase 3 / Future
- [ ] Decentralized gossip mode (no central Hub dependency)
- [ ] Machine-learning based anomaly scoring instead of static thresholds
- [ ] Browser extension / CLI tool for personal blogs & indie devs
- [ ] Integration marketplace (fail2ban, Nginx, Apache, Cloudflare, AWS WAF free tier, etc.)

---

## 9. Tech Stack (100% Free)

| Layer | Choice | Why it's free |
|---|---|---|
| **Hub backend** | Node.js + Express (or Python + FastAPI) | Open source, no license cost |
| **Database** | PostgreSQL via **Supabase free tier** or **Neon free tier** (or SQLite for a single-instance MVP) | Generous free tiers, no credit card needed for Neon |
| **Hosting (Hub API)** | **Render free web service**, **Railway free tier**, **Fly.io free allowance**, or **Oracle Cloud Always-Free VM** (most generous, a real free VM forever) | All have real $0 tiers |
| **Cache / live blocklist store** | **Upstash Redis free tier** (serverless Redis, generous free quota) | Free, and perfect for fast IP lookups |
| **Agent (site-side)** | Node.js middleware (Express/Koa/Next.js), or plain PHP snippet for WordPress/PHP sites | No cost, just code you write |
| **WAF detection layer (optional but recommended)** | **ModSecurity + OWASP CRS** (both fully open-source) | Free, battle-tested rule sets |
| **Dashboard frontend** | React (Vite) or plain HTML/JS | Free |
| **Dashboard hosting** | **Vercel free tier** or **Netlify free tier** or **Cloudflare Pages** | Free static hosting |
| **Auth between Agent ↔ Hub** | API key + HMAC request signing (no paid auth provider needed) | Just crypto, no cost |
| **Edge blocking (optional power feature)** | **Cloudflare Free plan API** (firewall rules) | Cloudflare's free plan includes API-driven IP blocking |
| **Public IP reputation cross-check (optional)** | **AbuseIPDB free API tier**, **FireHOL free IP blocklists**, **Spamhaus DROP** | All free for reasonable usage |
| **Monitoring/uptime** | **UptimeRobot free tier** | Free, alerts you if your Hub goes down |
| **Version control / CI** | **GitHub + GitHub Actions free tier** | Free for public repos, generous free minutes for private |

> **Note on "free forever":** Free tiers can have usage caps (e.g., Supabase pauses inactive free projects, Render free web services sleep after inactivity). For an MVP/portfolio project this is totally fine — just document it, and consider Oracle Cloud's Always-Free VM tier once you're ready for something more "always on" without any recurring cost.

---

## 10. Data Model (Simplified)

**members**
| field | type | notes |
|---|---|---|
| member_id | UUID (PK) | random, not tied to domain publicly |
| api_key_hash | string | hashed, never store raw key |
| reputation_score | float | starts neutral, adjusts over time |
| created_at | timestamp | |

**reports** (internal only — never exposed cross-member)
| field | type | notes |
|---|---|---|
| id | UUID | |
| member_id | UUID (FK) | who reported — internal use only |
| ip | string | attacker IP |
| category | enum | brute_force / sqli / xss / scanner / rate_abuse |
| confidence | float | 0–1 |
| created_at | timestamp | |

**blocklist** (this is what gets shared/broadcast)
| field | type | notes |
|---|---|---|
| ip | string | |
| category | enum | |
| confidence | float | |
| corroboration_count | int | how many distinct members reported it |
| expires_at | timestamp | TTL enforcement |

---

## 11. API Design (MVP)

```
POST /v1/report
Headers: Authorization: Bearer <api_key>
Body:
{
  "ip": "203.0.113.5",
  "category": "brute_force",
  "confidence": 0.8
}
→ 202 Accepted

GET /v1/blocklist?since=<timestamp>
Headers: Authorization: Bearer <api_key>
→ 200 OK
{
  "blocks": [
    { "ip": "203.0.113.5", "category": "brute_force", "confidence": 0.9, "expires_at": "2026-08-21T00:00:00Z" }
  ]
}

POST /v1/heartbeat
→ 200 OK  (lets Hub know agent is alive; also used for basic member health stats)
```

Agents can either **poll** `/blocklist` every N seconds (simplest, works everywhere, fully free-tier friendly) or, later, upgrade to **webhooks** or **Server-Sent Events** for near-real-time push without needing a message broker.

---

## 12. Legal / Ethical Notes (Please Read)

- You are only ever sharing **attacker IPs and generic attack categories** — this is standard, widely-accepted practice (same category of data as public IP blocklists like Spamhaus or AbuseIPDB).
- Be careful with **IP address = personal data** concerns under regulations like GDPR if you operate in/serve the EU — mitigate by keeping retention short (TTL), not linking IPs to any other personal data, and stating this clearly in a simple privacy policy for the project.
- Never log or forward the *victim's* URL paths, request bodies, headers, or any application data — only the attacker fingerprint and category, exactly as designed above.
- Add a clear "Terms of Use" for members: don't submit reports for IPs you don't genuinely believe are malicious; the network can revoke abusive members' access.

---

## 13. Suggested Build Order (Solo Dev, Free Stack, Step by Step)

1. **Week 1:** Build the Hub API (Node/Express + Postgres via Neon/Supabase) with `/report`, `/blocklist`, `/heartbeat`, and member signup/API key issuance.
2. **Week 2:** Build the basic Node.js Agent middleware — brute-force + rate-abuse detection, reporting to Hub, local blocklist enforcement.
3. **Week 3:** Add corroboration logic + TTL expiry + basic reputation scoring on the Hub.
4. **Week 4:** Build a minimal dashboard (own-site stats only) and deploy everything on free-tier hosting.
5. **Week 5+:** Add WAF-based detection (ModSecurity/OWASP CRS), Cloudflare auto-block integration, and a WordPress plugin wrapper for wider adoption.

---

## 14. Naming Ideas (pick one, or riff)
- **SentinelMesh**
- **WardenNet**
- **ShieldChain**
- **AttackAlly**
- **GuardGrid**
- **NeighborWatch (for websites)**

---

## 15. One-Line Pitch (for your resume/portfolio/README)

> "SentinelMesh is a free, privacy-preserving threat-intelligence sharing network that lets independent websites collaboratively detect and block attackers — without ever exposing which site was attacked or what vulnerability was targeted."

This is a genuinely strong project for a security/backend portfolio — it touches distributed systems, security engineering, privacy-by-design, and real infra deployment, all buildable at $0.
