from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NexusShield-Hub")

DB_FILE = os.path.join(os.path.dirname(__file__), "nexus.db")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blocks (
            ip TEXT PRIMARY KEY,
            attack_type TEXT,
            timestamp DATETIME
        )
    """)
    conn.commit()
    conn.close()
    logger.info(f"[Database] SQLite database initialized at {DB_FILE}")

init_db()

app = FastAPI(title="NexusShield Threat Hub (SQLite Persistence)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReportPayload(BaseModel):
    ip_address: str
    attack_type: Optional[str] = "SQL Injection"
    node: Optional[str] = "Site-A"

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def read_root():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(ip) FROM blocks")
    total = cursor.fetchone()[0]
    conn.close()
    return {
        "service": "NexusShield Threat Hub (SQLite)",
        "status": "online",
        "total_blocked": total
    }

@app.post("/report")
def report_attack(payload: ReportPayload):
    ip = payload.ip_address.strip()
    if not ip:
        raise HTTPException(status_code=400, detail="Invalid IP address")
    
    attack_type = payload.attack_type or "SQL Injection"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR IGNORE INTO blocks (ip, attack_type, timestamp)
        VALUES (?, ?, ?)
    """, (ip, attack_type, now_str))
    
    conn.commit()
    
    cursor.execute("SELECT COUNT(ip) FROM blocks")
    total = cursor.fetchone()[0]
    conn.close()

    logger.warning(f"[NEW THREAT REPORTED] IP: {ip} | Type: {attack_type}")

    return {
        "status": "success",
        "message": f"IP {ip} registered in global blocklist",
        "total_blocked": total
    }

@app.get("/blocklist")
def get_blocklist():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ip, attack_type, timestamp FROM blocks ORDER BY rowid DESC")
    rows = cursor.fetchall()
    conn.close()

    items = [
        {
            "ip": row["ip"],
            "attack_type": row["attack_type"],
            "timestamp": row["timestamp"]
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
    cursor.execute("SELECT COUNT(ip) FROM blocks")
    total = cursor.fetchone()[0]
    conn.close()
    
    return {
        "total_blocked": total,
        "active_spokes": 2
    }

@app.delete("/unban/{ip_address}")
def unban_ip(ip_address: str = Path(..., description="The IP address to unban")):
    ip = ip_address.strip()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM blocks WHERE ip = ?", (ip,))
    deleted = cursor.rowcount
    conn.commit()
    
    cursor.execute("SELECT COUNT(ip) FROM blocks")
    total = cursor.fetchone()[0]
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
def clear_blocklist():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM blocks")
    conn.commit()
    conn.close()
    logger.info("SQLite blocklist database cleared")
    return {"status": "cleared", "total_blocked": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
