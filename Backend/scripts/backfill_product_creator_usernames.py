r"""
Backfill script: populate `createdByUsername` and `createdByRole` on products

Run this script from the `Backend` folder after activating the Python venv:

    venv\Scripts\Activate.ps1
    python scripts\backfill_product_creator_usernames.py

This will iterate the `products` collection and for each document that has
`createdBy` but lacks `createdByUsername`, it will fetch the corresponding
user document from `users` collection and update the product doc.
"""
import sys
from pathlib import Path

# Ensure the Backend package root is on sys.path so `import app` works
BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
from app.core.firebase import initialize_firebase, get_firestore_db
import time


def main():
    print("Initializing Firebase...")
    initialize_firebase()
    db = get_firestore_db()

    products_ref = db.collection('products')
    users_ref = db.collection('users')

    print('Querying products...')
    docs = products_ref.stream()
    count = 0
    updated = 0
    missing_user = 0

    for doc in docs:
        count += 1
        data = doc.to_dict()
        created_by = data.get('createdBy')
        if not created_by:
            continue
        if data.get('createdByUsername'):
            continue

        # Fetch user
        user_doc = users_ref.document(created_by).get()
        if not user_doc.exists:
            missing_user += 1
            print(f"User doc not found for id={created_by}, skipping product {doc.id}")
            continue

        user_data = user_doc.to_dict()
        username = user_data.get('username') or user_data.get('name') or None
        role = user_data.get('role')

        update_payload = {}
        if username:
            update_payload['createdByUsername'] = username
        if role:
            update_payload['createdByRole'] = role

        if update_payload:
            products_ref.document(doc.id).update(update_payload)
            updated += 1
            print(f"Updated product {doc.id} with username={username} role={role}")

        # A small sleep to avoid hitting quota limits in large datasets
        time.sleep(0.05)

    print(f"Done. Scanned {count} products, updated {updated}, missing user docs: {missing_user}")


if __name__ == '__main__':
    main()
