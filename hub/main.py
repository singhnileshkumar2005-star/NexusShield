from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Set, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("WAF-Hub")

app = FastAPI(title="Zero-Knowledge Collaborative WAF Hub")

# Enable CORS for external spokes if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for globally blocked IPs
blocked_ips: Set[str] = set()

class ReportPayload(BaseModel):
    ip_address: str
    attack_type: str

@app.get("/")
def read_root():
    return {
        "service": "WAF Global Hub",
        "status": "online",
        "total_blocked_ips": len(blocked_ips)
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
    else:
        logger.info(f"Report received for already blocked IP: {ip} | Type: {payload.attack_type}")
        
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

@app.post("/clear")
def clear_blocklist():
    blocked_ips.clear()
    logger.info("Global blocklist cleared")
    return {"status": "cleared", "total_blocked": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
