import firebase_admin
from firebase_admin import credentials, firestore
import os
import sys
from datetime import datetime
import uuid

# Initialize Firebase (similar to app/core/firebase.py but standalone)
def init_firebase():
    if not firebase_admin._apps:
        # Try to find credentials file
        cred_path = "firebase-credentials.json"
        if not os.path.exists(cred_path):
            print(f"Error: {cred_path} not found.")
            sys.exit(1)
        
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

def fix_user(email):
    db = init_firebase()
    users_ref = db.collection("users")
    
    # Find user by email
    query = users_ref.where("email", "==", email).limit(1).stream()
    user_doc = None
    for doc in query:
        user_doc = doc
        break
    
    if not user_doc:
        print(f"User with email {email} not found.")
        return

    user_data = user_doc.to_dict()
    print(f"Found user: {user_data.get('name')} ({user_doc.id})")
    
    updates = {}
    
    # Check Role
    if not user_data.get("role"):
        print("User has no role. Setting to super_admin.")
        updates["role"] = "super_admin"
    
    # Check Organization
    if not user_data.get("organizationId"):
        print("User has no organization. Creating one.")
        org_id = str(uuid.uuid4())
        org_data = {
            "id": org_id,
            "name": f"{user_data.get('name', 'User')}'s Organization",
            "orgCode": str(uuid.uuid4())[:8],
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        db.collection("organizations").document(org_id).set(org_data)
        updates["organizationId"] = org_id
        print(f"Created organization: {org_data['name']} ({org_id})")

    # Check Allowed Companies
    if "allowedCompanyIds" not in user_data:
        print("User has no allowedCompanyIds. Initializing to empty list.")
        updates["allowedCompanyIds"] = []

    if updates:
        updates["updatedAt"] = datetime.utcnow().isoformat()
        users_ref.document(user_doc.id).update(updates)
        print("User updated successfully.")
    else:
        print("User is already correctly configured.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fix_user_role.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    fix_user(email)
