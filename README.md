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
