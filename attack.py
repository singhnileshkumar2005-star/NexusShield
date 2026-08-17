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
    print(" 🚀 NexusShield Zero-Knowledge Collaborative WAF Verification")
    print("=" * 65)

    # Pre-check Hub health
    try:
        # Clear Hub state before starting test for clean reproducible run
        requests.post(f"{HUB_URL}/clear", timeout=3)
        print("[Pre-Check] FastAPI Hub is online. Global blocklist reset for test.")
    except Exception as e:
        print(f"[Error] Cannot connect to FastAPI Hub on {HUB_URL}: {e}")
        print("        Ensure python hub/main.py is running on port 8000.")
        sys.exit(1)

    # Step 1: Clean request to Site A
    print("\n--- STEP 1: Sending Clean Request to Site A (Port 3000) ---")
    url_step1 = f"{SITE_A_URL}/"
    print(f"GET {url_step1}")
    res1 = requests.get(url_step1)
    print(f"Status Code: {res1.status_code}")
    print(f"Response: {res1.text}")
    assert res1.status_code == 200, f"Expected 200 OK, got {res1.status_code}"
    print("✅ PASS: Clean request to Site A allowed (200 OK)")

    # Step 2: Malicious request with SQL Injection to Site A
    print("\n--- STEP 2: Sending Malicious Request to Site A (Port 3000) ---")
    url_step2 = f"{SITE_A_URL}/?search=' OR 1=1--"
    print(f"GET {url_step2}")
    res2 = requests.get(url_step2)
    print(f"Status Code: {res2.status_code}")
    print(f"Response: {res2.text}")
    assert res2.status_code == 403, f"Expected 403 Forbidden, got {res2.status_code}"
    print("✅ PASS: Site A intercepted SQL Injection and returned 403 Forbidden")

    # Step 3: Wait 6 seconds for background sync
    print("\n--- STEP 3: Waiting 6 seconds for Hub-to-Client Background Sync ---")
    for i in range(6, 0, -1):
        print(f"  Syncing... {i} seconds remaining", end="\r")
        time.sleep(1)
    print("\n⌛ Sync period complete!")

    # Step 4 & 5: Clean request to Site B (Port 3001) -> Expect 403 Forbidden
    print("\n--- STEP 4 & 5: Sending Clean Request to Site B (Port 3001) ---")
    url_step4 = f"{SITE_B_URL}/"
    print(f"GET {url_step4}")
    res4 = requests.get(url_step4)
    print(f"Status Code: {res4.status_code}")
    print(f"Response: {res4.text}")
    
    assert res4.status_code == 403, f"Expected 403 Forbidden on Site B, got {res4.status_code}"
    print("\n" + "*" * 65)
    print("🎉 VERIFICATION SUCCESSFUL!")
    print("✅ Site B automatically blocked IP (403 Forbidden) based on threat report from Site A!")
    print("*" * 65 + "\n")

if __name__ == "__main__":
    main()
