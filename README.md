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

Open 4 separate terminal windows:

### Terminal 1: Central Hub (FastAPI - Port 8000)
```bash
python hub/main.py
```

### Terminal 2: Site A (Express Spoke - Port 3000)
```bash
# Windows PowerShell:
$env:PORT=3000; $env:SITE_NAME="Site-A"; node spoke/server.js

# Windows CMD:
set PORT=3000&& set SITE_NAME=Site-A&& node spoke/server.js
```

### Terminal 3: Site B (Express Spoke - Port 3001)
```bash
# Windows PowerShell:
$env:PORT=3001; $env:SITE_NAME="Site-B"; node spoke/server.js

# Windows CMD:
set PORT=3001&& set SITE_NAME=Site-B&& node spoke/server.js
```

### Terminal 4: SOC Dashboard Frontend (React/Vite - Port 5173)
```bash
cd dashboard
npx vite
```
Open **`http://localhost:5173`** in your web browser.

---

## 🧪 Testing Collaborative Immunity

### Option A: Via Dashboard Attack Simulator
Click the **"Attack Simulator"** button in the dashboard top navigation bar to fire test attacks directly from the UI.

### Option B: Via Python CLI Simulator
```bash
python attack.py
```
