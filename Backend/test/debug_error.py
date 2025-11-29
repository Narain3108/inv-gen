import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def debug():
    # Login
    auth_data = {"email": "testuser1620071250@example.com", "password": "password123"}
    # Try login, if fail (user might not exist if server restarted with in-memory db? No, it's firestore), create new
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
        if res.status_code != 200:
            # Signup
            res = requests.post(f"{BASE_URL}/auth/signup", json={**auth_data, "name": "Debug"})
            res = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
    except:
        print("Auth failed")
        return

    token = res.json().get("localId")
    headers = {"x-user-id": token}
    print(f"Logged in as {token}")

    # Create Company
    res = requests.post(f"{BASE_URL}/companies", json={"name": "Debug Co"}, headers=headers)
    company_id = res.json()["id"]
    print(f"Company: {company_id}")

    # Create Product
    res = requests.post(f"{BASE_URL}/products", json={"product_name": "P1", "price": 10, "companyId": company_id}, headers=headers)
    product_id = res.json()["id"]
    print(f"Product: {product_id}")

    # Fail 1: List without companyId
    print("\n--- Testing Collection Group List ---")
    res = requests.get(f"{BASE_URL}/products", headers=headers)
    if res.status_code != 200:
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text}")
    else:
        print("Success")

    # Fail 2: Get by ID
    print("\n--- Testing Get By ID ---")
    res = requests.get(f"{BASE_URL}/products/{product_id}", headers=headers)
    if res.status_code != 200:
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text}")
    else:
        print("Success")

if __name__ == "__main__":
    debug()
