from fastapi import FastAPI, HTTPException, Path, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NexusShield-Hub")

DB_FILE = os.path.join(os.path.dirname(__file__), "nexus.db")

# Security Configuration
NEXUS_API_KEY = os.environ.get("NEXUS_API_KEY", "nexus_dev_key_2026")
NEXUS_ADMIN_TOKEN = os.environ.get("NEXUS_ADMIN_TOKEN", "nexus_admin_secret_2026")
BAN_TTL_HOURS = int(os.environ.get("BAN_TTL_HOURS", "24"))

def init_db():
    conn = sqlite3.connect(DB_FILE, timeout=10.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blocks (
            ip TEXT,
            attack_type TEXT,
            timestamp DATETIME,
            expires_at DATETIME,
            client_id TEXT DEFAULT 'default',
            PRIMARY KEY (ip, client_id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blocklist (
            ip TEXT,
            attack_type TEXT,
            timestamp DATETIME,
            expires_at DATETIME,
            client_id TEXT DEFAULT 'default',
            PRIMARY KEY (ip, client_id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            attack_type TEXT,
            timestamp DATETIME,
            client_id TEXT DEFAULT 'default'
        )
    """)

    # Schema migration checks
    for table in ["blocks", "blocklist", "attacks"]:
        try:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            if columns and "client_id" not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN client_id TEXT DEFAULT 'default'")
            if table in ["blocks", "blocklist"] and columns and "expires_at" not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN expires_at DATETIME")
        except Exception as e:
            logger.warning(f"[Migration] Could not migrate table {table}: {e}")

    conn.commit()
    conn.close()
    logger.info(f"[Database] SQLite database initialized in WAL mode at {DB_FILE}")

# Initialize SQLite database on startup
init_db()

app = FastAPI(title="NexusShield Threat Hub (Hardened with Auth & TTL)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReportPayload(BaseModel):
    ip_address: str
    client_id: Optional[str] = "default"
    attack_type: Optional[str] = "SQL Injection"
    node: Optional[str] = "Site-A"

def get_db_connection():
    conn = sqlite3.connect(DB_FILE, timeout=10.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.row_factory = sqlite3.Row
    return conn

# Security Dependency Functions
def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if not x_api_key or (x_api_key != NEXUS_API_KEY and x_api_key != NEXUS_ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid or missing X-API-Key")
    return x_api_key

def verify_admin_token(
    authorization: Optional[str] = Header(None),
    x_admin_token: Optional[str] = Header(None)
):
    token = x_admin_token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
    if not token or token != NEXUS_ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden: Admin authentication token required")
    return token

@app.get("/")
def read_root():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(DISTINCT ip) FROM blocks 
        WHERE expires_at IS NULL OR expires_at > datetime('now', 'localtime')
    """)
    total = cursor.fetchone()[0] or 0
    conn.close()
    return {
        "service": "NexusShield Threat Hub (Hardened)",
        "status": "online",
        "total_blocked": total,
        "ban_ttl_hours": BAN_TTL_HOURS
    }

@app.post("/report")
def report_attack(payload: ReportPayload, _auth: str = Depends(verify_api_key)):
    ip = payload.ip_address.strip()
    client_id = payload.client_id.strip() if payload.client_id else "default"
    if not ip:
        raise HTTPException(status_code=400, detail="Invalid IP address")
    
    attack_type = payload.attack_type or "SQL Injection"
    now_dt = datetime.now()
    now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
    expires_dt = now_dt + timedelta(hours=BAN_TTL_HOURS)
    expires_str = expires_dt.strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO blocks (ip, attack_type, timestamp, expires_at, client_id)
        VALUES (?, ?, ?, ?, ?)
    """, (ip, attack_type, now_str, expires_str, client_id))

    cursor.execute("""
        INSERT OR REPLACE INTO blocklist (ip, attack_type, timestamp, expires_at, client_id)
        VALUES (?, ?, ?, ?, ?)
    """, (ip, attack_type, now_str, expires_str, client_id))

    cursor.execute("""
        INSERT INTO attacks (ip, attack_type, timestamp, client_id)
        VALUES (?, ?, ?, ?)
    """, (ip, attack_type, now_str, client_id))
    
    conn.commit()
    
    cursor.execute("""
        SELECT COUNT(DISTINCT ip) FROM blocks 
        WHERE expires_at IS NULL OR expires_at > datetime('now', 'localtime')
    """)
    total = cursor.fetchone()[0] or 0
    conn.close()

    logger.warning(f"[NEW THREAT REPORTED] IP: {ip} | Client: {client_id} | Type: {attack_type} | Expires: {expires_str}")

    return {
        "status": "success",
        "message": f"IP {ip} registered in blocklist for client {client_id}",
        "expires_at": expires_str,
        "total_blocked": total
    }

@app.get("/blocklist")
def get_blocklist():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Return active non-expired bans
    cursor.execute("""
        SELECT ip, attack_type, timestamp, expires_at, client_id FROM blocks 
        WHERE expires_at IS NULL OR expires_at > datetime('now', 'localtime')
        ORDER BY rowid DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    items = [
        {
            "ip": row["ip"],
            "attack_type": row["attack_type"],
            "timestamp": row["timestamp"],
            "expires_at": row["expires_at"] if "expires_at" in row.keys() else None,
            "client_id": row["client_id"] if "client_id" in row.keys() else "default"
        }
        for row in rows
    ]
    
    return {
        "blocked_ips": items
    }

@app.get("/stats")
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT COUNT(DISTINCT ip) FROM blocks
        WHERE expires_at IS NULL OR expires_at > datetime('now', 'localtime')
    """)
    total_blocked = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(id) FROM attacks")
    attacks_total = cursor.fetchone()[0] or total_blocked

    cursor.execute("SELECT COUNT(DISTINCT client_id) FROM blocks")
    distinct_clients = cursor.fetchone()[0] or 1
    active_spokes = max(2, distinct_clients)

    # Dynamic attack vector distribution
    cursor.execute("SELECT attack_type, COUNT(id) as count FROM attacks GROUP BY attack_type")
    dist_rows = cursor.fetchall()
    if dist_rows:
        attack_distribution = [{"name": row["attack_type"], "value": row["count"]} for row in dist_rows]
    else:
        cursor.execute("SELECT attack_type, COUNT(ip) as count FROM blocks GROUP BY attack_type")
        block_dist_rows = cursor.fetchall()
        attack_distribution = [{"name": row["attack_type"], "value": row["count"]} for row in block_dist_rows] if block_dist_rows else [
            {"name": "SQL Injection", "value": 1},
            {"name": "Cross-Site Scripting", "value": 1},
            {"name": "Path Traversal", "value": 1}
        ]

    # Recent Event Stream
    cursor.execute("SELECT id, ip, attack_type, timestamp, client_id FROM attacks ORDER BY id DESC LIMIT 50")
    attack_rows = cursor.fetchall()
    recent_events = [
        {
            "id": row["id"],
            "ip": row["ip"],
            "attack_type": row["attack_type"],
            "timestamp": row["timestamp"],
            "node": row["client_id"],
            "status": "Blocked"
        }
        for row in attack_rows
    ]

    conn.close()
    
    return {
        "total_blocked": total_blocked,
        "attacks_today": attacks_total,
        "active_spokes": active_spokes,
        "network_status": "Active & Synchronized",
        "attack_distribution": attack_distribution,
        "recent_events": recent_events
    }

@app.get("/client-stats/{client_id}")
def get_client_stats(
    client_id: str = Path(..., description="The client ID to retrieve stats for"),
    _auth: str = Depends(verify_api_key)
):
    cid = client_id.strip()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT ip, attack_type, timestamp, expires_at, client_id FROM blocks 
        WHERE client_id = ? AND (expires_at IS NULL OR expires_at > datetime('now', 'localtime'))
        ORDER BY rowid DESC
    """, (cid,))
    rows = cursor.fetchall()
    
    blocked_ips = [
        {
            "ip": row["ip"],
            "attack_type": row["attack_type"],
            "timestamp": row["timestamp"],
            "expires_at": row["expires_at"] if "expires_at" in row.keys() else None,
            "client_id": row["client_id"]
        }
        for row in rows
    ]

    cursor.execute("SELECT id, ip, attack_type, timestamp, client_id FROM attacks WHERE client_id = ? ORDER BY id DESC LIMIT 50", (cid,))
    attack_rows = cursor.fetchall()

    recent_logs = [
        {
            "id": row["id"],
            "ip": row["ip"],
            "attack_type": row["attack_type"],
            "timestamp": row["timestamp"],
            "client_id": row["client_id"]
        }
        for row in attack_rows
    ] if attack_rows else blocked_ips

    total_blocked = len(blocked_ips)
    attacks_count = len(attack_rows) if attack_rows else total_blocked

    conn.close()

    return {
        "client_id": cid,
        "total_blocked": total_blocked,
        "attacks_count": attacks_count,
        "stats": {
            "total_blocked": total_blocked,
            "attacks_count": attacks_count,
            "active_spokes": 1
        },
        "blocked_ips": blocked_ips,
        "recent_logs": recent_logs,
        "recent_events": recent_logs
    }

@app.delete("/unban/{ip_address}")
def unban_ip(
    ip_address: str = Path(..., description="The IP address to unban"),
    _auth: str = Depends(verify_admin_token)
):
    ip = ip_address.strip()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM blocks WHERE ip = ?", (ip,))
    cursor.execute("DELETE FROM blocklist WHERE ip = ?", (ip,))
    deleted = cursor.rowcount
    conn.commit()
    
    cursor.execute("""
        SELECT COUNT(DISTINCT ip) FROM blocks
        WHERE expires_at IS NULL OR expires_at > datetime('now', 'localtime')
    """)
    total = cursor.fetchone()[0] or 0
    conn.close()

    if deleted > 0:
        logger.info(f"[UNBANNED] IP {ip} unbanned from SQLite database.")
        return {
            "status": "success",
            "message": f"IP {ip} successfully unbanned",
            "total_blocked": total
        }
    else:
        return {
            "status": "success",
            "message": f"IP {ip} was not in blocklist",
            "total_blocked": total
        }

@app.post("/clear")
def clear_blocklist(_auth: str = Depends(verify_admin_token)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM blocks")
    cursor.execute("DELETE FROM blocklist")
    cursor.execute("DELETE FROM attacks")
    conn.commit()
    conn.close()
    logger.info("SQLite blocklist database cleared")
    return {"status": "cleared", "total_blocked": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

