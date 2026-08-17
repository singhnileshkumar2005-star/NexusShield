import time
import sys
import requests

# Reconfigure stdout to handle UTF-8 symbols on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SITE_A_URL = "http://127.0.0.1:3000"
SITE_B_URL = "http://127.0.0.1:3001"
HUB_URL = "http://127.0.0.1:8000"

def print_header(title):
    print("\n" + "=" * 60)
    print(f" [*] {title}")
    print("=" * 60)


def main():
    print_header("Zero-Knowledge Collaborative WAF Attack Simulator")

    # Step 0: Ensure Hub & Spokes are reachability check
    print("📋 Checking server availability...")
    try:
        r_hub = requests.get(f"{HUB_URL}/blocklist", timeout=3)
        print(f"  [✓] Central Hub (Port 8000) is online. Initial blocklist: {r_hub.json().get('blocked_ips', [])}")
    except Exception as e:
        print(f"  [❌] Cannot connect to Hub on {HUB_URL}: {e}")
        print("      Please make sure main.py is running on port 8000.")
        sys.exit(1)

    try:
        r_site_a = requests.get(f"{SITE_A_URL}/", timeout=3)
        print(f"  [✓] Site A (Port 3000) is online.")
    except Exception as e:
        print(f"  [❌] Cannot connect to Site A on {SITE_A_URL}: {e}")
        print("      Please make sure Site A is running on port 3000.")
        sys.exit(1)

    try:
        r_site_b = requests.get(f"{SITE_B_URL}/", timeout=3)
        print(f"  [✓] Site B (Port 3001) is online.")
    except Exception as e:
        print(f"  [❌] Cannot connect to Site B on {SITE_B_URL}: {e}")
        print("      Please make sure Site B is running on port 3001.")
        sys.exit(1)

    # Step 1: Send SQL Injection payload to Site A
    print_header("STEP 1: Attacking Site A (Port 3000)")
    sqli_url = f"{SITE_A_URL}/search?q=' OR 1=1"
    print(f"🎯 Sending malicious request: GET {sqli_url}")
    
    try:
        response_a = requests.get(sqli_url)
        print(f"📥 Response Code: {response_a.status_code}")
        print(f"📄 Response Body: {response_a.text}")

        if response_a.status_code == 403:
            print("✅ SUCCESS: Site A detected SQL Injection and returned 403 Forbidden!")
        else:
            print(f"❌ FAILURE: Expected 403 Forbidden, but received {response_a.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error attacking Site A: {e}")
        sys.exit(1)

    # Step 2: Verify Hub received report
    print_header("STEP 2: Verifying Hub Blocklist")
    time.sleep(1) # short pause for async POST to hit Hub
    try:
        hub_res = requests.get(f"{HUB_URL}/blocklist")
        blocked_list = hub_res.json().get("blocked_ips", [])
        print(f"🌐 Hub Global Blocklist: {blocked_list}")
        if len(blocked_list) > 0:
            print("✅ SUCCESS: Attacker IP reported and stored in Hub global blocklist!")
        else:
            print("⚠️ WARNING: Hub blocklist is empty. Async report may still be in flight.")
    except Exception as e:
        print(f"❌ Error checking Hub blocklist: {e}")

    # Step 3: Wait for periodic sync
    print_header("STEP 3: Waiting for Site B Sync Loop (12 seconds)")
    print("⏳ Waiting 12 seconds to allow Site B's 10-second sync loop to fetch the blocklist...")
    for i in range(12, 0, -1):
        print(f"   Syncing in {i} seconds...", end="\r")
        time.sleep(1)
    print("\n⌛ Sync period complete!")

    # Step 4: Send clean request to Site B
    print_header("STEP 4: Requesting Clean Page on Site B (Port 3001)")
    print(f"🎯 Sending normal GET request to Site B: GET {SITE_B_URL}/")
    try:
        response_b = requests.get(f"{SITE_B_URL}/")
        print(f"📥 Response Code: {response_b.status_code}")
        print(f"📄 Response Body: {response_b.text}")

        if response_b.status_code == 403:
            print("\n" + "🎉" * 25)
            print("✨ COLLABORATIVE PROTECTION VERIFIED!")
            print("✅ Site B successfully blocked the IP (403 Forbidden) based on shared intelligence from Site A!")
            print("🎉" * 25)
        else:
            print(f"❌ FAILURE: Site B returned {response_b.status_code} instead of 403 Forbidden.")
            print("    Check if the sync loop updated Site B's local blocklist.")
            sys.exit(1)

    except Exception as e:
        print(f"❌ Error connecting to Site B: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
