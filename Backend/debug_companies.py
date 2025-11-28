
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def list_companies():
    try:
        response = requests.get(f"{BASE_URL}/companies")
        if response.status_code == 200:
            companies = response.json()
            print(f"Found {len(companies)} companies")
            for i, company in enumerate(companies):
                print(f"Company {i+1}:")
                print(json.dumps(company, indent=2))
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    list_companies()
