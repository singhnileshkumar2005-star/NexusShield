import time
import sys
import requests

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SITE_A_URL = "http://localhost:3000"
SITE_B_URL = "http://localhost:3001"
HUB_URL = "http://127.0.0.1:8000"

def main():
    print("\n" + "=" * 65)
    print(" 🚀 NexusShield Phase 5 Advanced Threat Verification & SQLite Test")
    print("=" * 65)

    # Pre-check Hub health and reset SQLite blocklist
    try:
        requests.post(f"{HUB_URL}/clear", timeout=3)
        print("[Pre-Check] FastAPI Hub (SQLite) is online. Blocklist cleared.")
    except Exception as e:
        print(f"[Error] Cannot connect to FastAPI Hub on {HUB_URL}: {e}")
        print("        Ensure python threat-hub/main.py is running on port 8000.")
        sys.exit(1)

    # Step 1: Fire XSS Payload to Site A (Port 3000)
    print("\n--- STEP 1: Testing XSS Vector on Site A (Port 3000) ---")
    xss_url = f"{SITE_A_URL}/?search=<script>alert('hack')</script>"
    print(f"GET {xss_url}")
    res_xss = requests.get(xss_url)
    print(f"Status Code: {res_xss.status_code}")
    print(f"Response: {res_xss.text}")
    assert res_xss.status_code == 403, f"Expected 403 Forbidden for XSS, got {res_xss.status_code}"
    print("✅ PASS: Site A intercepted XSS payload (403 Forbidden)")

    # Step 2: Fire Path Traversal Payload to Site A (Port 3000)
    print("\n--- STEP 2: Testing Path Traversal Vector on Site A (Port 3000) ---")
    lfi_url = f"{SITE_A_URL}/?file=../../etc/passwd"
    print(f"GET {lfi_url}")
    res_lfi = requests.get(lfi_url)
    print(f"Status Code: {res_lfi.status_code}")
    print(f"Response: {res_lfi.text}")
    assert res_lfi.status_code == 403, f"Expected 403 Forbidden for Path Traversal, got {res_lfi.status_code}"
    print("✅ PASS: Site A intercepted Path Traversal payload (403 Forbidden)")

    # Step 3: Wait 6 seconds for background sync
    print("\n--- STEP 3: Waiting 6 seconds for Hub-to-Client Background Sync ---")
    for i in range(6, 0, -1):
        print(f"  Syncing... {i} seconds remaining", end="\r")
        time.sleep(1)
    print("\n⌛ Sync period complete!")

    # Step 4: Verify Hub SQLite DB content
    print("\n--- STEP 4: Verifying SQLite Database Content ---")
    try:
        hub_res = requests.get(f"{HUB_URL}/blocklist")
        blocks = hub_res.json().get("blocked_ips", [])
        print(f"🌐 SQLite Global Blocklist: {blocks}")
        assert len(blocks) > 0, "Expected at least 1 blocked IP in SQLite database"
        print("✅ PASS: Attacker IP persisted in SQLite database (nexus.db)")
    except Exception as e:
        print(f"❌ Error checking Hub blocklist: {e}")

    # Step 5: Clean Request to Site B (Port 3001) -> Expect 403 Forbidden
    print("\n--- STEP 5: Testing Cross-Site Immunization on Site B (Port 3001) ---")
    site_b_url = f"{SITE_B_URL}/"
    print(f"GET {site_b_url}")
    res_b = requests.get(site_b_url)
    print(f"Status Code: {res_b.status_code}")
    print(f"Response: {res_b.text}")

    assert res_b.status_code == 403, f"Expected 403 Forbidden on Site B, got {res_b.status_code}"
    print("\n" + "*" * 65)
    print("🎉 ADVANCED THREAT VERIFICATION SUCCESSFUL!")
    print("✅ Site B automatically blocked IP (403 Forbidden) based on persistent threat intelligence from Site A!")
    print("*" * 65 + "\n")

if __name__ == "__main__":
    main()
