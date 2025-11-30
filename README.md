# InvoiceHub (inv-gen)

InvoiceHub is a simple invoicing and billing application that helps small businesses create and manage GST-compliant invoices.

What it does (plain language)
- Lets you create companies, add products and clients, and generate invoices.
- Lets an administrator add users and give them access to one or more companies.

Short tech summary (for context)
- Frontend: Next.js (React + TypeScript) — the web interface your users interact with.
- Backend: FastAPI (Python) — a small API that stores and returns data.
- Database: Google Firestore — stores users, companies, invoices, and related data.

How the pieces fit together
- The web UI calls the API to save and load data. The API talks to Firestore and enforces who can see or change which company data.

Quick start (development)
1. Start the backend API:
```powershell
cd Backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
2. Start the frontend:
```powershell
cd src
pnpm install
pnpm dev
```

If you want a version of this README written for non-technical stakeholders or a short setup guide (emulator, seeding sample data), I can add that.

