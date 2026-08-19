# NexusShield Production Hosting & Cloud Deployment Guide

An enterprise-grade, step-by-step deployment guide for **NexusShield** — the zero-knowledge collaborative Web Application Firewall (WAF) and real-time distributed threat intelligence ecosystem.

---

## 1. System Architecture & Hosting Topology

NexusShield is built on a **Hub-and-Spoke** architecture consisting of three core components deployed across cloud platforms:

```
                          ┌────────────────────────────────────────────────────────┐
                          │                SOC DASHBOARD (Vercel)                  │
                          │   React 18 + Vite SPA (Client Portals & Live Feeds)    │
                          └─────────────────────────┬──────────────────────────────┘
                                                    │
                               HTTPS REST & Real-Time SSE Stream
                                                    │
                                                    ▼
                          ┌────────────────────────────────────────────────────────┐
                          │               THREAT HUB (Render / Railway)            │
                          │     FastAPI + SQLite WAL / Redis Threat Engine         │
                          │  - Central Ingestion & Multi-Tenant Telemetry          │
                          │  - Automated TTL-Based Ban Enforcement                 │
                          │  - Live SSE Event Broadcasting                         │
                          └───────────────────▲───────────────▲────────────────────┘
                                              │               │
                            Report & Sync     │               │ Report & Sync
                                              │               │
                 ┌────────────────────────────┴───┐       ┌───┴────────────────────────────┐
                 │       SPOKE 1: Client A        │       │       SPOKE 2: Client B        │
                 │   Express App (Node.js/AWS)    │       │  Express App (Docker/Kubernetes│
                 │ ────────────────────────────── │       │ ────────────────────────────── │
                 │ • @nexusshield/waf Middleware  │       │ • @nexusshield/waf Middleware  │
                 │ • Sliding Window Rate Limiter  │       │ • Sliding Window Rate Limiter  │
                 │ • In-Memory Blocklist Cache    │       │ • In-Memory Blocklist Cache    │
                 │ • Zero-Latency Local Dropping  │       │ • Zero-Latency Local Dropping  │
                 └────────────────────────────────┘       └────────────────────────────────┘
```

### Component Breakdown

| Component | Technology | Target Cloud Host | Purpose & Responsibility |
| :--- | :--- | :--- | :--- |
| **1. Threat Hub** | FastAPI, Python 3.11, SQLite WAL / Redis, Uvicorn | **Render / Railway / AWS ECS** | Central intelligence server, REST API endpoints, real-time Server-Sent Events (SSE) stream, global ban management with automatic TTL expiration, multi-tenant client telemetry. |
| **2. SOC Dashboard** | React 18, Vite 5, Tailwind CSS, Recharts, Lucide Icons | **Vercel / Cloudflare Pages** | High-performance Single Page Application (SPA). Provides real-time threat stream, analytics charts, global blocklist controls (one-click unban), and dedicated tenant client portals. |
| **3. Distributed Spokes** | Node.js / Express (`@nexusshield/waf` or `middleware.js`) | **Client Servers / Docker / AWS / K8s** | Zero-latency edge defense embedded inside client Express applications. Intercepts SQLi, XSS, Path Traversal, and volumetric rate bursts locally, while auto-reporting to the Threat Hub. |

---

## 2. Deploying Threat Hub on Render (FastAPI Backend)

Render provides native support for Python web services with automated SSL certificates, custom domains, and continuous deployment from GitHub.

### Method A: 1-Click Blueprint Deployment (`render.yaml`)

NexusShield includes a pre-configured `render.yaml` blueprint in the repository root.

1. Push your repository to **GitHub** or **GitLab**.
2. Log into your [Render Dashboard](https://dashboard.render.com).
3. Click **Blueprints** in the top navigation bar, then click **New Blueprint Instance**.
4. Select your **NexusShield** repository.
5. Render will automatically parse `render.yaml` and prompt you to review the services and environment variables.
6. Click **Apply**. Render will automatically build the service, install dependencies via `pip install -r requirements.txt`, start Uvicorn, and assign a live HTTPS URL (e.g., `https://nexusshield-threat-hub.onrender.com`).

---

### Method B: Manual Web Service Setup (Step-by-Step)

If you prefer configuring the Web Service manually through the Render UI, follow these steps:

#### Step 1: Create Web Service
1. Log in to [Render](https://dashboard.render.com/) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub/GitLab repository containing NexusShield.

#### Step 2: Configure Service Parameters

| Form Field | Recommended Value | Description |
| :--- | :--- | :--- |
| **Name** | `nexusshield-threat-hub` | Unique service identifier on Render. |
| **Region** | `Oregon (US West)` or `Frankfurt (EU Central)` | Choose the region closest to your client spoke servers. |
| **Branch** | `main` | Production branch to automatically deploy from. |
| **Root Directory** | *(Leave Blank)* | Root of the repository. |
| **Runtime** | `Python 3` | Python runtime environment. |
| **Build Command** | `pip install -r requirements.txt` | Installs FastAPI, Uvicorn, Requests, and Pydantic. |
| **Start Command** | `uvicorn hub.main:app --host 0.0.0.0 --port $PORT` | Starts the production ASGI server bound to Render's dynamic port. |
| **Instance Type** | `Free` (or `Starter` for persistent disk) | 512 MB RAM / 0.1 CPU is sufficient for normal workloads. |

#### Step 3: Configure Environment Variables

Under the **Environment Variables** section, add the following key-value pairs:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `NEXUS_API_KEY` | `nexus_dev_key_2026` *(or custom random 32-char token)* | Shared secret for spoke reporting & dashboard telemetry queries. |
| `NEXUS_ADMIN_TOKEN` | `nexus_admin_secret_2026` *(or strong secret)* | Bearer authentication token for admin operations (e.g. unbanning IPs). |
| `BAN_TTL_HOURS` | `24` | Duration in hours that temporary IP bans remain active before TTL expiration. |
| `PYTHON_VERSION` | `3.11.0` | Ensures modern Python 3.11 runtime. |

#### Step 4: Health Check & Auto-Deploy
- **Health Check Path**: `/` (FastAPI returns `{"status": "online"}`).
- **Auto-Deploy**: Set to `Yes` for continuous delivery on `git push`.
- Click **Create Web Service**.

> [!TIP]
> **Free Tier Keep-Alive**: Render Free instances spin down after 15 minutes of inactivity. To keep the Threat Hub active 24/7 without latency spikes, you can set up a free monitor on [UptimeRobot](https://uptimerobot.com) or [BetterStack](https://betterstack.com) hitting `https://<YOUR_RENDER_URL>/` every 5 minutes.

---

## 3. Deploying SOC Dashboard on Vercel (React Frontend)

Vercel provides edge delivery, global CDN caching, and seamless Single Page Application (SPA) routing.

### Step 1: Connect Repository to Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Select and import your **NexusShield** repository.

### Step 2: Configure Project Settings

| Setting | Value | Why It Matters |
| :--- | :--- | :--- |
| **Project Name** | `nexusshield-dashboard` | URL will become `https://nexusshield-dashboard.vercel.app`. |
| **Framework Preset** | `Vite` | Automatically detected by Vercel. |
| **Root Directory** | `dashboard` | **Important**: Points Vercel to the frontend subfolder. |
| **Build Command** | `npm run build` *(or `vite build`)* | Compiles production assets into `dashboard/dist`. |
| **Output Directory** | `dist` | Generated static bundle folder. |
| **Install Command** | `npm install` | Installs frontend dependencies. |

### Step 3: Configure Frontend Environment Variables

Under **Environment Variables**, add:

```env
VITE_HUB_API=https://nexusshield-threat-hub.onrender.com
VITE_NEXUS_API_KEY=nexus_dev_key_2026
VITE_NEXUS_ADMIN_TOKEN=nexus_admin_secret_2026
```

> [!IMPORTANT]
> Replace `https://nexusshield-threat-hub.onrender.com` with the actual live URL of your deployed Render Threat Hub from Step 2.

### Step 4: Verify Single Page Application Routing (`vercel.json`)
NexusShield includes `dashboard/vercel.json` to handle client-side routing, preventing 404 errors on deep links and sub-routes:

```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Click **Deploy**. Within 30 seconds, your SOC dashboard will be live with instant global CDN distribution.

---

## 4. Embedding Spokes in Client Express Applications

Client nodes ("Spokes") run within Express/Node.js web applications on any server (AWS EC2, Heroku, DigitalOcean, Kubernetes, Docker, or bare metal).

### Step 1: Install Middleware
Inside your Express project:
```bash
npm install axios
```
Place `middleware.js` (from `nexus-client/middleware.js` or `@nexusshield/waf`) into your project.

### Step 2: Configure Environment Variables on Spoke Server
Set these environment variables in your client application's `.env`:

```env
# URL of the deployed Threat Hub
HUB_URL=https://nexusshield-threat-hub.onrender.com

# Shared API key for Hub ingestion
NEXUS_API_KEY=nexus_dev_key_2026

# Unique identifier for this client spoke node
CLIENT_ID=client_A

# Express server port
PORT=3000
```

### Step 3: Attach Middleware to Express Application

```javascript
const express = require('express');
const threatShield = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable reverse proxy trust (critical for accurate client IP detection behind Cloudflare, NGINX, AWS ALB)
app.set('trust proxy', true);

// Parse incoming payloads before WAF inspection
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach NexusShield WAF Middleware
app.use(threatShield({
  clientId: process.env.CLIENT_ID || 'client_A',
  hubUrl: process.env.HUB_URL || 'https://nexusshield-threat-hub.onrender.com',
  apiKey: process.env.NEXUS_API_KEY || 'nexus_dev_key_2026',
  rateLimit: {
    enabled: true,
    windowMs: 60000,     // 1 minute window
    maxRequests: 60,     // Max 60 requests per minute per IP
    banOnExceed: true    // Auto-ban offending IP across entire cluster
  }
}));

// Your Protected Application Routes
app.get('/', (req, res) => {
  res.json({ status: 'secure', message: 'Welcome to Protected Service' });
});

app.post('/api/data', (req, res) => {
  res.json({ success: true, payload: req.body });
});

app.listen(PORT, () => {
  console.log(`[WAF Spoke Active] Server running on port ${PORT}`);
});
```

---

## 5. Sharing Dedicated URLs with Clients (Multi-Tenant Portals)

NexusShield supports multi-tenant isolation. You can provide dedicated portal links to individual clients or stakeholders that isolate their attack telemetry, prevented threats, and security status.

### URL Structure & Query Parameters

The frontend supports deep-link routing via URL query parameters:

| View Mode | URL Format | Description |
| :--- | :--- | :--- |
| **Global SOC Admin** | `https://soc.yourdomain.com/` | Full SOC command center: global metrics, interactive threat feed, analytics charts, and blocklist unban actions. |
| **Client A Portal** | `https://soc.yourdomain.com/?view=portal&client=client_A` | Filtered telemetry showing only attacks prevented for `client_A`. |
| **Client B Portal** | `https://soc.yourdomain.com/?view=portal&client=client_B` | Filtered telemetry showing only attacks prevented for `client_B`. |
| **Custom Tenant Portal** | `https://soc.yourdomain.com/?view=portal&client=<CLIENT_ID>` | Reusable for any dynamic client ID registered in the cluster. |

### Features of the Client Portal:
1. **Isolated Metrics**: Total attacks prevented specifically for the selected `client_id`.
2. **Zero-Knowledge Logs**: Real-time tabular feed showing offending IPs, attack types (SQLi, XSS, Path Traversal, Volumetric Burst), and timestamps without exposing other tenants.
3. **Deep-Linking & Bookmarks**: Opening a dedicated URL automatically activates the Client Portal tab and selects the specified tenant.
4. **Live Polling**: Automatically refreshes client metrics every 3 seconds from the FastAPI backend endpoint `/client-stats/{client_id}`.

### Iframe Embedding for Client Dashboards
If your clients have their own existing administrative portals, you can embed their dedicated NexusShield security monitor via an iframe:

```html
<iframe 
  src="https://soc.yourdomain.com/?view=portal&client=client_A" 
  width="100%" 
  height="750px" 
  frameborder="0"
  style="border-radius: 12px; border: 1px solid #1e293b;"
  allow="clipboard-write"
></iframe>
```

---

## 6. Verification & End-to-End Testing

Once deployed, verify the complete lifecycle of threat detection and collaborative defense:

```
[Attacker IP] ──▶ [Spoke Express App] (Blocked Locally 403)
                         │
                         ▼ (Reports Payload)
                  [Threat Hub (FastAPI)]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[Syncs to All Other Spokes]      [Broadcasts via SSE Stream]
  (Banned Everywhere Instantly)     (Updates SOC Dashboard in <100ms)
```

### 1. Test Threat Hub Health
```bash
curl -X GET "https://<YOUR_RENDER_URL>/"
```
Expected response:
```json
{
  "service": "NexusShield Threat Hub (Hardened)",
  "status": "online",
  "total_blocked": 0,
  "ban_ttl_hours": 24
}
```

### 2. Test Real-Time SSE Stream
```bash
curl -N "https://<YOUR_RENDER_URL>/events?api_key=nexus_dev_key_2026"
```
Expected output:
```
data: {"event": "connected", "message": "NexusShield Real-Time SSE Stream active"}
: keepalive
```

### 3. Simulate an Attack Vector
Run an attack test against a protected Spoke instance:
```bash
# SQL Injection attempt
curl -X POST "https://<YOUR_SPOKE_URL>/search" -d "q=' OR 1=1 --"

# XSS attempt
curl -X POST "https://<YOUR_SPOKE_URL>/comment" -d "comment=<script>alert('pwned')</script>"
```
Expected outcome:
- Spoke immediately returns `403 Forbidden` (`{"error": "Access Denied by NexusShield WAF"}`).
- Threat Hub receives threat report and registers IP in database.
- Dashboard updates in real time with audio-visual threat event.
- All other spokes in the cluster block the attacker IP immediately.

---

## 7. Production Hardening Checklist

- [x] **Generate Cryptographic Keys**: Generate unique 64-character hex strings for `NEXUS_API_KEY` and `NEXUS_ADMIN_TOKEN` (`openssl rand -hex 32`).
- [x] **Enforce HTTPS**: Both Render and Vercel automatically provision TLS/SSL certificates. Ensure all Spoke $\rightarrow$ Hub requests use `https://`.
- [x] **Enable Express Proxy Trust**: Always ensure `app.set('trust proxy', true)` is configured in Express spokes when hosted behind load balancers or Cloudflare.
- [x] **Configure TTL Policies**: Adjust `BAN_TTL_HOURS` in Render environment variables depending on your security policy (e.g. 12 hours for light threats, 48 hours for strict environments).
- [x] **CORS Whitelisting**: For enterprise deployments with strict CORS, restrict `allow_origins` in `hub/main.py` to your specific Vercel dashboard domain.
