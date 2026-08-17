# Zero-Knowledge Collaborative Web Application Firewall (WAF)

A Hub-and-Spoke collaborative security network. When one connected web application detects an attack (such as SQL Injection), it immediately blocks the offending IP locally and reports it to a central Hub. All other connected applications periodically synchronize with the Hub to download updated global blocklists, achieving real-time collective immunity.

---

## 🏗️ Architecture

```
                      +-------------------+
                      |   Central Hub     |
                      |  (FastAPI: 8000)  |
                      +---------+---------+
                                ^
               Report Attack    |    Get Blocklist
                  (Async POST)  |    (GET /blocklist every 10s)
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
   +-------------------+                 +-------------------+
   |   Site A (Spoke)  |                 |   Site B (Spoke)  |
   | (Express: 3000)   |                 | (Express: 3001)   |
   +-------------------+                 +-------------------+
```

1. **Central Hub (FastAPI - Port 8000)**:
   - Stores global blocklist in an in-memory `set()` to prevent duplicate IPs.
   - `POST /report`: Accepts attack reports (`ip_address`, `attack_type`).
   - `GET /blocklist`: Serves the list of globally blocked IP addresses.

2. **Spoke Client (Express.js Middleware - Ports 3000 & 3001)**:
   - Intercepts incoming HTTP requests.
   - Checks normalized IP (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) against local blocklist (`403 Forbidden` if blocked).
   - Inspects URL string for SQL Injection signatures (`' OR 1=1`, `UNION SELECT`, etc.).
   - On attack detection: local block + async report to Hub + `403 Forbidden`.
   - Runs `setInterval` loop every 10 seconds to sync global blocklist from Hub.

3. **Attack Simulator (Python Script)**:
   - Sends SQL Injection payload to Site A (`http://127.0.0.1:3000/search?q=' OR 1=1`). Verifies `403 Forbidden`.
   - Waits 12 seconds for Site B to run its sync loop.
   - Sends a normal GET request to Site B (`http://127.0.0.1:3001/`). Verifies Site B returns `403 Forbidden`.

---

## 📦 Requirements & Installation

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

---

## 🚀 Running the Project

Run each service in a separate terminal window:

### Terminal 1: Central Hub (FastAPI - Port 8000)
```bash
python hub/main.py
```
*(Or `uvicorn hub.main:app --port 8000 --reload`)*

### Terminal 2: Site A (Express Spoke - Port 3000)
```bash
# On Windows PowerShell:
$env:PORT=3000; $env:SITE_NAME="Site-A"; node spoke/server.js

# On Windows Command Prompt (cmd):
set PORT=3000&& set SITE_NAME=Site-A&& node spoke/server.js
```

### Terminal 3: Site B (Express Spoke - Port 3001)
```bash
# On Windows PowerShell:
$env:PORT=3001; $env:SITE_NAME="Site-B"; node spoke/server.js

# On Windows Command Prompt (cmd):
set PORT=3001&& set SITE_NAME=Site-B&& node spoke/server.js
```

---

## 🧪 Running the Attack Simulation

Once all 3 servers are running, open a **4th terminal window** and run:

```bash
python attack.py
```

### Expected Output Trace:
1. **Site A Attack**: `GET http://127.0.0.1:3000/search?q=' OR 1=1` -> `403 Forbidden`
2. **Hub Verification**: `GET http://127.0.0.1:8000/blocklist` -> `["127.0.0.1"]`
3. **Sync Waiting**: 12-second wait loop allowing Site B to update its local memory.
4. **Site B Check**: `GET http://127.0.0.1:3001/` -> `403 Forbidden` (Site B blocks clean request because IP was globally reported!).
