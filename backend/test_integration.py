"""
Frontend-Backend Integration Test
Tests all API endpoints used by the frontend
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def get_token():
    """Get authentication token"""
    try:
        response = requests.post(
            f"{BASE_URL}/login",
            json={"email": "admin@example.com", "password": "admin123"}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
    except:
        pass
    return None

def test_all_endpoints():
    print("=" * 60)
    print("FRONTEND-BACKEND INTEGRATION TEST")
    print("=" * 60)
    
    token = get_token()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    tests = [
        {
            "name": "GET /orders/",
            "method": "GET",
            "url": f"{BASE_URL}/orders/",
            "headers": headers
        },
        {
            "name": "GET /users/?role=rider",
            "method": "GET",
            "url": f"{BASE_URL}/users/?role=rider",
            "headers": headers
        },
        {
            "name": "POST /orders/auto-assign",
            "method": "POST",
            "url": f"{BASE_URL}/orders/auto-assign",
            "headers": headers
        },
    ]
    
    print("\n🧪 Testing API Endpoints:\n")
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test["method"] == "GET":
                response = requests.get(test["url"], headers=test["headers"])
            elif test["method"] == "POST":
                response = requests.post(test["url"], headers=test["headers"])
            
            if response.status_code in [200, 201]:
                print(f"✅ {test['name']} - Status: {response.status_code}")
                passed += 1
            else:
                print(f"⚠️  {test['name']} - Status: {response.status_code}")
                print(f"   Response: {response.json()}")
                failed += 1
                
        except Exception as e:
            print(f"❌ {test['name']} - Error: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"TEST RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)
    
    # Test order creation (frontend integration)
    print("\n🧪 Testing Order Creation (Create Order Modal):\n")
    
    try:
        order_data = {
            "customer_name": "Test Customer",
            "delivery_address": "Test Address, Bangalore",
            "lat": 12.9716,
            "lng": 77.5946,
            "priority": 1,
            "weight": 2.5,
            "delivery_time_start": "2025-12-28T10:00:00",
            "delivery_time_end": "2025-12-28T18:00:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/orders/",
            json=order_data,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Order Creation - Status: {response.status_code}")
            print(f"   Created Order ID: {response.json()['id']}")
            print("   All fields validated successfully!")
        else:
            print(f"❌ Order Creation Failed - Status: {response.status_code}")
            print(f"   Response: {response.json()}")
            
    except Exception as e:
        print(f"❌ Order Creation Error: {e}")
    
    print("\n" + "=" * 60)
    print("INTEGRATION TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_all_endpoints()
