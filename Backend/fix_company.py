
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred_path = os.path.join(os.path.dirname(__file__), "firebase-credentials.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def fix_corrupted_company():
    company_id = "HJKGWytm20dqHrZpKQOP"
    doc_ref = db.collection("companies").document(company_id)
    
    doc = doc_ref.get()
    if doc.exists:
        print(f"Found company {company_id}")
        data = doc.to_dict()
        print(f"Current name: {data.get('name')}")
        
        if not data.get('name'):
            print("Name is missing. Updating to 'Restored Company'...")
            doc_ref.update({
                "name": "Restored Company",
                "updatedAt": firestore.SERVER_TIMESTAMP
            })
            print("Company updated successfully.")
        else:
            print("Company already has a name.")
    else:
        print("Company not found.")

if __name__ == "__main__":
    fix_corrupted_company()
