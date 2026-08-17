from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Set, List, Optional
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NexusShield-Hub")

app = FastAPI(title="NexusShield Threat Hub")

# Task 1.1: Enable CORS allowing all origins, methods, and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for blocked IPs
blocked_ips: Set[str] = set()

class ReportPayload(BaseModel):
    ip_address: str
    attack_type: Optional[str] = "SQL Injection"
    node: Optional[str] = "Site-A"

@app.get("/")
def read_root():
    return {
        "service": "NexusShield Threat Hub",
        "status": "online",
        "total_blocked": len(blocked_ips)
    }

@app.post("/report")
def report_attack(payload: ReportPayload):
    ip = payload.ip_address.strip()
    if not ip:
        raise HTTPException(status_code=400, detail="Invalid IP address")
    
    is_new = ip not in blocked_ips
    blocked_ips.add(ip)
    
    if is_new:
        logger.warning(f"[NEW THREAT REPORTED] IP: {ip} | Type: {payload.attack_type}")
    
    return {
        "status": "success",
        "message": f"IP {ip} added to global blocklist",
        "total_blocked": len(blocked_ips)
    }

@app.get("/blocklist")
def get_blocklist():
    return {
        "blocked_ips": list(blocked_ips)
    }

# Task 1.2: GET /stats
@app.get("/stats")
def get_stats():
    return {
        "total_blocked": len(blocked_ips),
        "active_spokes": 2
    }

# Task 1.3: DELETE /unban/{ip}
@app.delete("/unban/{ip_address}")
def unban_ip(ip_address: str = Path(..., description="The IP address to unban")):
    ip = ip_address.strip()
    if ip in blocked_ips:
        blocked_ips.remove(ip)
        logger.info(f"[UNBANNED] IP {ip} unbanned from global blocklist.")
        return {
            "status": "success",
            "message": f"IP {ip} successfully unbanned",
            "total_blocked": len(blocked_ips)
        }
    else:
        # If IP is not found in set, return success or 404
        return {
            "status": "success",
            "message": f"IP {ip} was not in blocklist",
            "total_blocked": len(blocked_ips)
        }

@app.post("/clear")
def clear_blocklist():
    blocked_ips.clear()
    logger.info("Global blocklist cleared")
    return {"status": "cleared", "total_blocked": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
