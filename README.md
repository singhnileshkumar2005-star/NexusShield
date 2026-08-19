# NexusShield - Zero-Knowledge Collaborative Web Application Firewall (WAF) & SOC Dashboard

A Hub-and-Spoke collaborative security network paired with a modern, dark-themed **Security Operations Center (SOC)** Dashboard. When one connected web application detects an attack (such as SQL Injection, XSS, or Path Traversal), it immediately blocks the offending IP locally and reports it to a central Hub. All connected applications synchronize every 10 seconds to download updated global blocklists, achieving real-time collective immunity.

---

## 🏗️ Architecture

```
                                +-------------------+
                                |   Central Hub     |
                                |  (FastAPI: 8000)  |
                                +---------+---------+
                                          |
            +-----------------------------+-----------------------------+
            |                             |                             |
            v (Async POST / Report)       v (GET /stats & /blocklist)   v (GET /blocklist every 10s)
  +-------------------+         +-------------------+         +-------------------+
  |   Site A (Spoke)  |         |   SOC Dashboard   |         |   Site B (Spoke)  |
  | (Express: 3000)   |         |   (React: 5173)   |         | (Express: 3001)   |
  +-------------------+         +-------------------+         +-------------------+
```

1. **Central Hub (FastAPI - Port 8000)**:
   - Stores global blocklist & live attack events log.
   - `POST /report`: Accepts threat reports (`ip_address`, `attack_type`, `node`).
   - `GET /blocklist`: Serves enriched global blocklist metadata.
   - `GET /stats`: Computes aggregated metrics, attack vector distribution, and time-series analytics.
   - `DELETE /unban/{ip}`: Revokes IP bans from the global blocklist.

2. **SOC Dashboard (React + Vite + Tailwind CSS - Port 5173)**:
   - **Top Metrics Bar (KPI Cards)**: Total Blocked IPs, Attacks Deflected, Active Spokes, and Network Health status.
   - **Real-Time Threat Stream**: Dark cyber terminal live event log.
   - **Analytics & Visualizations**: Recharts Donut Chart (Attack Distribution) and Area Chart (24h Trend).
   - **Global Blocklist Management Table**: Live search filter, status badges, and inline `Unban / Revoke` button.
   - **Spoke Simulator Widget**: Modal widget to trigger test attacks and observe real-time dashboard updates.
   - **Background Polling & Fallback**: 3-second automatic polling loop with graceful offline fallback state.

3. **Spoke Client (Express.js Middleware - Ports 3000 & 3001)**:
   - Intercepts incoming HTTP requests and normalizes client IP addresses.
   - Inspects URL string for SQL Injection signatures.
   - Runs `setInterval` loop every 10 seconds to sync global blocklist from Hub.

4. **Attack Simulator (`attack.py`)**:
   - Python automated test script executing cross-spoke collaborative blocking verification.

---

## 📦 Installation

### 1. Install Root Dependencies (Express Spokes & Python Hub)
```bash
npm install
pip install -r requirements.txt
```

### 2. Install SOC Dashboard Dependencies
```bash
cd dashboard
npm install
cd ..
```

---

## 🚀 Running the Project

You can start each service using npm scripts from the root directory:

### Central Threat Hub (FastAPI - Port 8000)
```bash
npm run start:hub
# Or directly: python hub/main.py
```

### Site A Protected Spoke (Express - Port 3000)
```bash
npm run start:siteA
# Or directly: node nexus-client/siteA.js
```

### Site B Protected Spoke (Express - Port 3001)
```bash
npm run start:siteB
# Or directly: node nexus-client/siteB.js
```

### SOC Dashboard Frontend (React/Vite - Port 5173)
```bash
npm run start:dashboard
# Or directly: cd dashboard && npm run dev
```
Open **`http://localhost:5173`** in your web browser.

---

## 🧪 Testing Collaborative Immunity

### Option A: Via Dashboard Attack Simulator
Click the **"Attack Simulator"** button in the dashboard top navigation bar to fire test attacks directly from the UI.

### Option B: Via Automated Verification Suite
```bash
npm test
# Or directly: python attack.py
```
