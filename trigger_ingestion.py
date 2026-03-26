#!/usr/bin/env python
"""
Trigger email ingestion via the API
Usage: python trigger_ingestion.py [api_key]
"""
import os
import requests
import sys
import time
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join("backend", ".env"))

def trigger_ingestion(api_key=None, max_retries=30):
    """Trigger email ingestion via API endpoint"""
    if not api_key:
        api_key = os.getenv("API_KEY", "invoice-hub-secret-key-2024")
    
    print("\n" + "="*60)
    print("📧 Triggering Email Ingestion...")
    print("="*60)
    
    # Wait for backend to be ready
    print("\n⏳ Waiting for backend to be ready...", end="", flush=True)
    for i in range(max_retries):
        try:
            response = requests.get("http://localhost:8000/docs", timeout=2)
            if response.status_code == 200:
                print(" ✓\n")
                break
        except:
            pass
        print(".", end="", flush=True)
        time.sleep(1)
    else:
        print(" ✗")
        print("⚠️  Backend is not responding. Skipping email ingestion.")
        return False
    
    # Trigger ingestion
    try:
        print("🔍 Processing emails from Gmail...\n")
        response = requests.post(
            "http://localhost:8000/ingestion/trigger",
            headers={"X-API-Key": api_key},
            timeout=120  # 2 minute timeout
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Email ingestion completed!")
            print(f"   Message: {data.get('message')}")
            
            if 'result' in data:
                result = data.get('result')
                if isinstance(result, dict):
                    print(f"   Processed: {result.get('processed_count', 'N/A')} emails")
                    print(f"   Total found: {result.get('total_count', 'N/A')} emails")
            
            print()
            return True
        else:
            print(f"⚠️  Ingestion returned status {response.status_code}")
            print(f"   Response: {response.text[:300]}")
            print()
            return False
    
    except requests.exceptions.ConnectionError:
        print("⚠️  Could not connect to backend")
        print("   Make sure the backend is running on http://localhost:8000")
        print()
        return False
    except requests.exceptions.Timeout:
        print("⚠️  Email ingestion timed out")
        print("   This may mean many emails are being processed")
        print()
        return False
    except Exception as e:
        print(f"⚠️  Error: {str(e)}")
        print()
        return False

if __name__ == "__main__":
    api_key = sys.argv[1] if len(sys.argv) > 1 else None
    success = trigger_ingestion(api_key)
    sys.exit(0 if success else 1)
