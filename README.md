# InvoiceHub (inv-gen)

A full-stack GST invoice / billing system combining a Next.js 14 frontend and a FastAPI backend using Firestore as the primary datastore. The codebase contains both the frontend app (Next.js + shadcn/ui + Tailwind) and a Python FastAPI backend that exposes REST endpoints under `/api/v1`.

This README reflects the current state of the repository on branch `withfast` (Nov 2025): features, architecture, running instructions and where to look for role-based access control (RBAC) and user management code.

---

**Quick summary**
- Frontend: Next.js (TypeScript), shadcn/ui, Tailwind CSS — UI, routing, client-side state.
- Backend: FastAPI (Python) — REST API, Firestore access, auth and RBAC logic.
- Data: Google Firestore collections (users, organizations, companies, products, clients, invoices, ...).
- Auth: JWT + cookie-based sessions handled in `AuthContext` (frontend) and `app/core/deps.py` (backend). Role-based permissions enforced server-side.

---

**Key features (current)**
- Organization and user signup/login (organization-scoped auth).
- Role-based access control: `super_admin`, `admin`, `employee`.
- Centralized User Management (Super Admin): Create/update users, set role, manage `allowedCompanyIds` (company allotment).
- Company-level access control: users only see and act on companies in their `allowedCompanyIds` (unless `super_admin`).
- CRUD for companies, clients, products, invoices, quotations — enforced on server by company access checks.
- Mobile-first responsive UI with a dedicated User Management page in `Settings` (visible only to `super_admin`).

---

Project structure (high level)

- `Backend/` — FastAPI app
  - `app/api/v1/*.py` — API routes (see `auth_firestore.py`, `companies_firestore.py`, `invoices_firestore.py`, etc.)
  - `app/core/` — helpers: `deps.py`, `firebase.py`, `security.py`
  - `app/schemas/` — Pydantic models (e.g., `user.py` defines `UserCreate` and `UserUpdate` and required fields)

- `src/` — Next.js frontend
  - `src/app/` — pages and app routes (for invoices, settings, onboarding)
  - `src/components/` — UI components (layout, settings, clients, invoices, shared)
  - `src/contexts/` — `AuthContext`, `AppDataContext` (companies/clients/products loader)
  - `src/lib/api/` — frontend API clients (`client.ts`, `users.api.ts`, `companies.api.ts`)
  - `src/hooks/` — custom hooks (`useAuth`, `useCompany`, etc.)

---

Notable files and locations

- Backend API routing aggregation: `Backend/app/api/v1/__init__.py` (includes `auth_firestore` as `/auth`).
- User management endpoints (create/update/list) live in: `Backend/app/api/v1/auth_firestore.py` (prefixed with `/auth`).
- RBAC and current-user resolution: `Backend/app/core/deps.py` and `app/core/security.py`.
- Frontend User Management page (Super Admin): `src/app/invoices/settings/users/page.tsx`.
- Frontend User form & list components: `src/components/settings/UserForm.tsx`, `UserList.tsx`.
- Frontend app-wide data loader that enforces user-scoped companies: `src/contexts/AppDataContext.tsx`.
- API client and error handling: `src/lib/api/client.ts` (throws ApiError on status >=400).

---

RBAC and company allotment (how it works)

- Each user document contains fields: `role` and `allowedCompanyIds` (array of company IDs).
- Backend endpoints verify company-level access. Example: creating/fetching invoices or products checks that `companyId` is in the caller's `allowedCompanyIds` unless the caller is `super_admin`.
- User management: a `super_admin` can create/update users and set `allowedCompanyIds` for each user. The frontend `UserForm` provides a multi-select checkbox list for companies.

---

Running locally

Prereqs
- Python 3.10+ and `pip` for backend
- Node 18+ and `pnpm` (or npm/yarn) for frontend
- Google service account credentials (for Firestore admin access) placed in the backend config as expected (see `Backend/app/core/firebase.py` and `Backend/firbase-credentials.json` or similar).

Backend (FastAPI)

1. Create a virtual environment and install backend requirements:

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Ensure Firestore credentials are available to the backend (follow `Backend/README` or `app/core/firebase.py`).

3. Start the backend:

```powershell
uvicorn app.main:app --reload
```

The backend API will be available at `http://127.0.0.1:8000/api/v1` by default.

Frontend (Next.js)

1. Install dependencies and run dev server:

```powershell
cd ..\src
pnpm install
pnpm dev
```

2. Open `http://localhost:3000`.

Notes: The frontend expects `NEXT_PUBLIC_API_URL` set to the backend (default `http://127.0.0.1:8000/api/v1`). See `src/lib/api/client.ts` for base URL logic.

---

Common troubleshooting

- 403 Forbidden when switching users: caused when the frontend still has a persisted/selected company that the new user is not allowed to access. The app includes guards in `AppDataContext` to revalidate and re-load companies when the logged-in user changes.
- 422 Unprocessable Content when creating users: the backend requires `organizationId` and other required fields defined in `Backend/app/schemas/user.py`. Make sure the frontend includes `organizationId` in the create payload (the user creation page does this automatically if you are a super admin).
- ApiError from `src/lib/api/client.ts`: inspect `error.response?.data` in the console to see backend `detail` or validation errors. Backend uses Pydantic/HTTPException to return clear messages (e.g., `Field required`).

---

UX / UI notes

- There is a single canonical User Management UI under `Settings -> User Management` (`/invoices/settings/users`). That page is the authoritative place for creating/editing users and setting `allowedCompanyIds`.
- The `Sidebar` renders links conditionally based on the logged-in user's role (example: `User Management` link is shown only to `super_admin`). Certain actions like `Add Client` are hidden for `employee` users in the UI, and server-side checks enforce the same restrictions.

---

Contributing & next steps

- Add unit & integration tests for backend endpoints (FastAPI `pytest`).
- Harden permission checks and add logging for denied accesses.
- Add better onboarding flow for first `super_admin` and sample seed data.

---

If you need a short walkthrough for a specific piece (example: how to run the backend locally with Firestore emulator, or how to seed companies/users), tell me which part and I will add a step-by-step section.

---

Author: team working on `inv-gen` (branch `withfast`)
# 🧾 GST Invoice Billing System

A modern, professional invoice billing system built with Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, and Firebase. Designed for Indian businesses to create GST-compliant invoices with automatic tax calculations, GSTIN validation, and professional PDF generation.

## ✨ Features

### 🔐 Authentication
- Email/Password authentication
- Google Sign-in integration
- Protected routes with Firebase Auth
- Multi-user support with isolated data

### 🏢 Company Management
- Create and manage multiple companies
- GSTIN verification and validation
- Company profile with logo and digital signature upload
- Bank details and address management
- State-wise GST configuration

### 📦 Product & Service Management
- Add products/services with HSN/SAC codes
- Automatic HSN code validation and GST rate fetching
- Stock management
- Price and tax rate configuration
- Product categorization

### 👥 Client Management
- Complete client database
- Automatic GSTIN lookup and validation
- Client contact and address management
- Client-wise invoice history

### 📄 Invoice Generation
- Auto-generated invoice numbers (INV-2025-001)
- Professional PDF generation with proper formatting
- Automatic tax calculation (CGST/SGST for intrastate, IGST for interstate)
- Multiple tax rates support (5%, 12%, 18%, 28%)
- Round-off calculations
- Payment terms and notes
- Invoice preview before download
- Firebase Storage integration for PDF backup

### 📊 Reports & Analytics
- Monthly sales reports
- Tax collection summary (CGST, SGST, IGST)
- Client-wise statistics
- Top products/services analysis

### 🎨 UI/UX
- Modern, clean design with shadcn/ui components
- Fully responsive (mobile, tablet, desktop)
- Dark mode support
- Smooth animations with Framer Motion
- Toast notifications for user feedback
- Professional invoice layouts with formal fonts

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.1 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Forms**: React Hook Form + Zod validation
- **PDF Generation**: pdfmake
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: Sonner
- **Date Handling**: date-fns

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- Firebase project created ([Firebase Console](https://console.firebase.google.com/))

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd invoice
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure Firebase**
   - Create a new Firebase project
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Enable Storage
   - Get your Firebase config from Project Settings

4. **Setup environment variables**
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Firebase credentials
```

5. **Run development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 📁 Project Structure

```
invoice/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── auth/              # Auth-related components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── company/           # Company management
│   │   ├── products/          # Product management
│   │   ├── clients/           # Client management
│   │   ├── invoices/          # Invoice components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── firebase/          # Firebase configuration
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils.ts           # Utility functions
│   ├── types/                 # TypeScript type definitions
│   └── utils/
│       ├── taxCalculator.ts   # GST calculation logic
│       ├── gstApi.ts          # GSTIN/HSN API integration
│       ├── pdfGenerator.ts    # PDF generation
│       └── formatters.ts      # Date/number formatters
├── public/                    # Static assets
├── .env.local                 # Environment variables (not in git)
├── .env.example              # Example environment file
├── components.json           # shadcn/ui configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## 🔥 Firestore Schema

```
users/{userId}
  ├── name: string
  ├── email: string
  └── createdAt: timestamp

users/{userId}/companies/{companyId}
  ├── name: string
  ├── gstin: string
  ├── address: object
  ├── contact: object
  ├── bankDetails: object
  ├── logoUrl: string
  └── signatureUrl: string

users/{userId}/companies/{companyId}/products/{productId}
  ├── productName: string
  ├── hsn: string
  ├── price: number
  ├── gstRate: number
  └── stock: number

users/{userId}/companies/{companyId}/clients/{clientId}
  ├── clientName: string
  ├── gstin: string
  ├── address: object
  └── contact: object

users/{userId}/companies/{companyId}/invoices/{invoiceId}
  ├── invoiceNumber: string
  ├── date: timestamp
  ├── clientId: string
  ├── items: array
  ├── subtotal: number
  ├── totalTax: number
  ├── grandTotal: number
  └── pdfUrl: string
```

## 🚀 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 📝 Development Phases

- [x] **Phase 1**: Project Setup & Dependencies
- [ ] **Phase 2**: Project Structure & TypeScript Interfaces
- [ ] **Phase 3**: Firebase Setup & Authentication
- [ ] **Phase 4**: Core Utilities & Helpers
- [ ] **Phase 5**: Dashboard Layout & Navigation
- [ ] **Phase 6**: Company Management Module
- [ ] **Phase 7**: Product Management Module
- [ ] **Phase 8**: Client Management Module
- [ ] **Phase 9**: Invoice Generation & PDF Creation
- [ ] **Phase 10**: Invoice History & Reports
- [ ] **Phase 11**: Testing & Demo Data
- [ ] **Phase 12**: Final Polish & Documentation

## 📄 License

This project is for educational and commercial use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

Built with ❤️ for Indian businesses

---

**Note**: This is a client-side application using Firebase. No traditional backend server is required.
