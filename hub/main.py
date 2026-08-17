from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Set, List, Dict, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("WAF-Hub")

app = FastAPI(title="Zero-Knowledge Collaborative WAF Hub & SOC API")

# Enable CORS for dashboard and spokes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for active blocked IPs: key = ip_address, value = dict metadata
blocked_ips_db: Dict[str, dict] = {}

# In-memory historical attack log stream (for live terminal & stats)
attack_events_log: List[dict] = []

class ReportPayload(BaseModel):
    ip_address: str
    attack_type: str
    node: Optional[str] = "Site-A"

@app.get("/")
def read_root():
    return {
        "service": "NexusShield Threat Intelligence Hub",
        "status": "online",
        "total_blocked_ips": len(blocked_ips_db)
    }

@app.post("/report")
def report_attack(payload: ReportPayload):
    ip = payload.ip_address.strip()
    if not ip:
        raise HTTPException(status_code=400, detail="Invalid IP address")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    node_tag = payload.node or "Site-A"
    attack_type = payload.attack_type or "SQL Injection"

    is_new = ip not in blocked_ips_db

    # Save/update in blocked IPs DB
    blocked_ips_db[ip] = {
        "ip": ip,
        "attack_type": attack_type,
        "timestamp": timestamp,
        "node": node_tag,
        "status": "Active"
    }

    # Record event in stream log
    event = {
        "id": len(attack_events_log) + 1,
        "ip": ip,
        "attack_type": attack_type,
        "timestamp": timestamp,
        "node": node_tag,
        "status": "Blocked"
    }
    attack_events_log.insert(0, event) # newest first
    if len(attack_events_log) > 100:
        attack_events_log.pop()

    if is_new:
        logger.warning(f"[NEW THREAT REPORTED] IP: {ip} | Type: {attack_type} | Node: {node_tag}")
    else:
        logger.info(f"[THREAT RE-REPORTED] IP: {ip} | Type: {attack_type} | Node: {node_tag}")

    return {
        "status": "success",
        "message": f"IP {ip} registered in global blocklist",
        "total_blocked": len(blocked_ips_db)
    }

@app.get("/blocklist")
def get_blocklist():
    # Returns rich list of blocked objects for Dashboard & Spoke clients
    items = list(blocked_ips_db.values())
    return {
        "blocked_ips": items
    }

@app.delete("/unban/{ip_address}")
def unban_ip(ip_address: str = Path(..., description="The IP address to remove from global blocklist")):
    ip = ip_address.strip()
    if ip in blocked_ips_db:
        del blocked_ips_db[ip]
        logger.info(f"[UNBANNED] IP {ip} removed from global blocklist.")
        
        # Record unban event in event log
        event = {
            "id": len(attack_events_log) + 1,
            "ip": ip,
            "attack_type": "Revoked / Unbanned",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "node": "SOC-Admin",
            "status": "Unbanned"
        }
        attack_events_log.insert(0, event)
        
        return {"status": "success", "message": f"IP {ip} unbanned successfully", "total_blocked": len(blocked_ips_db)}
    else:
        raise HTTPException(status_code=404, detail=f"IP {ip} not found in global blocklist")

@app.get("/stats")
def get_stats():
    total_blocked = len(blocked_ips_db)
    attacks_today = len(attack_events_log)
    
    # Calculate attack type distribution from events log
    distribution_counts = {}
    for event in attack_events_log:
        atype = event.get("attack_type", "SQL Injection")
        if atype != "Revoked / Unbanned":
            distribution_counts[atype] = distribution_counts.get(atype, 0) + 1
            
    if not distribution_counts:
        distribution_counts = {
            "SQL Injection": 1,
            "XSS Vector": 0,
            "Path Traversal": 0,
            "Brute Force": 0
        }

    attack_distribution = [
        {"name": k, "value": v} for k, v in distribution_counts.items()
    ]

    # Sample time series chart data
    attacks_over_time = [
        {"time": "00:00", "count": max(1, int(attacks_today * 0.1))},
        {"time": "04:00", "count": max(2, int(attacks_today * 0.15))},
        {"time": "08:00", "count": max(5, int(attacks_today * 0.35))},
        {"time": "12:00", "count": max(8, int(attacks_today * 0.6))},
        {"time": "16:00", "count": max(4, int(attacks_today * 0.4))},
        {"time": "20:00", "count": attacks_today}
    ]

    return {
        "total_blocked": total_blocked,
        "attacks_today": max(attacks_today, total_blocked),
        "active_spokes": 2, # Site A (3000) & Site B (3001)
        "network_status": "Active & Synchronized",
        "attack_distribution": attack_distribution,
        "attacks_over_time": attacks_over_time,
        "recent_events": attack_events_log[:20]
    }

@app.post("/clear")
def clear_blocklist():
    blocked_ips_db.clear()
    attack_events_log.clear()
    logger.info("Global blocklist and logs cleared")
    return {"status": "cleared", "total_blocked": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
