# System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  React Components │ Context API │ Hooks │ Services              │
└───────────────────┬─────────────────────────────────────────────┘
                    │ HTTP/REST API
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                    FASTAPI BACKEND (Python)                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              API Layer (app/api/v1/*.py)                   │ │
│  │  Users │ Companies │ Clients │ Products │ Invoices etc.   │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
│  ┌────────────────▼───────────────────────────────────────────┐ │
│  │          Schemas Layer (app/schemas/*.py)                  │ │
│  │     Pydantic Models for Validation & Serialization        │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
│  ┌────────────────▼───────────────────────────────────────────┐ │
│  │        Business Logic (app/services/*.py)                  │ │
│  │  Tax Calculator │ Number Generator │ Number to Words      │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
│  ┌────────────────▼───────────────────────────────────────────┐ │
│  │          Database Layer (app/db/models.py)                 │ │
│  │            SQLAlchemy ORM Models                           │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
└───────────────────┼───────────────────────────────────────────────┘
                    │ asyncpg Driver
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                          │
│  Tables: users, companies, clients, products, invoices, etc.    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │◄───┐
│ email        │    │
│ name         │    │
│ photo_url    │    │
└──────────────┘    │
                    │
                    │ user_id (FK)
                    │
┌──────────────┐    │
│  companies   │◄───┘
├──────────────┤
│ id (PK)      │◄───┐
│ user_id (FK) │    │
│ name         │    │
│ gstin        │    │
│ address      │    │ company_id (FK)
│ contact      │    │
│ bank_details │    ├──────────────────────────┐
└──────────────┘    │                          │
                    │                          │
┌──────────────┐    │    ┌──────────────┐     │    ┌──────────────┐
│   clients    │    │    │  products    │     │    │ quotations   │
├──────────────┤    │    ├──────────────┤     │    ├──────────────┤
│ id (PK)      │◄───┼───┐│ id (PK)      │◄────┼───┐│ id (PK)      │
│ company_id   │    │   ││ company_id   │     │   ││ company_id   │
│ name         │    │   ││ name         │     │   ││ client_id    │
│ gstin        │    │   ││ hsn          │     │   ││ quotation_no │
│ addresses    │    │   ││ gst_rate     │     │   ││ date         │
└──────┬───────┘    │   │└──────────────┘     │   │└──────┬───────┘
       │            │   │                     │   │       │
       │            │   │                     │   │       │ quotation_id (FK)
       │ client_id  │   │                     │   │       │
       │ (FK)       │   │                     │   │       ▼
       │            │   │                     │   │ ┌──────────────────┐
       │            │   │                     │   │ │ quotation_items  │
       │            │   │                     │   │ ├──────────────────┤
       │            │   │                     │   │ │ id (PK)          │
       │            │   │                     │   │ │ quotation_id(FK) │
       │            │   │                     │   │ │ description      │
       │            │   │                     │   │ │ quantity         │
       │            │   │                     │   │ │ unit_price       │
       │            │   │                     │   │ │ gst_rate         │
       │            │   │                     │   │ └──────────────────┘
       │            │   │                     │   │
       ▼            │   │                     │   │
┌──────────────┐    │   │                     │   │
│  invoices    │◄───┘   │                     │   │
├──────────────┤        │                     │   │
│ id (PK)      │        │                     │   │
│ company_id   │        │                     │   │
│ client_id    │        │                     │   │
│ invoice_no   │        │                     │   │
│ date         │        │                     │   │
│ amount_paid  │        │                     │   │
│ payment_stat │        │                     │   │
└──────┬───────┘        │                     │   │
       │                │                     │   │
       │ invoice_id(FK) │                     │   │
       │                │                     │   │
       ├────────────────┴─────────────────────┘   │
       │                                           │
       ├────────────────┐                          │
       │                │                          │
       ▼                ▼                          │
┌──────────────┐  ┌──────────────┐                │
│invoice_items │  │   payments   │                │
├──────────────┤  ├──────────────┤                │
│ id (PK)      │  │ id (PK)      │                │
│ invoice_id   │  │ invoice_id   │                │
│ description  │  │ amount       │                │
│ quantity     │  │ date         │                │
│ unit_price   │  │ mode         │                │
│ gst_rate     │  │ reference    │                │
│ cgst_amount  │  └──────────────┘                │
│ sgst_amount  │                                   │
│ igst_amount  │                                   │
└──────────────┘                                   │
                                                   │
┌──────────────────┐                               │
│product_categories│                               │
├──────────────────┤                               │
│ id (PK)          │                               │
│ name             │                               │
│ description      │                               │
│ products (JSONB) │                               │
└──────────────────┘                               │
                                                   │
┌──────────────────┐                               │
│ customizations   │◄──────────────────────────────┘
├──────────────────┤
│ id (PK)          │
│ company_id (FK)  │
│ type             │
│ payload (JSONB)  │
└──────────────────┘
```

**Key Relationships:**
- One User → Many Companies
- One Company → Many Clients, Products, Invoices, Quotations
- One Client → Many Invoices, Quotations
- One Invoice → Many InvoiceItems, Payments
- One Quotation → Many QuotationItems

**Cascade Behavior:**
- Delete User → Cascade delete Companies
- Delete Company → Cascade delete Clients, Products, Invoices, Quotations
- Delete Invoice → Cascade delete InvoiceItems, Payments
- Delete Quotation → Cascade delete QuotationItems

---

## 🔄 Request Flow

### Example: Create Invoice

```
1. Frontend Request
   ↓
   POST /api/v1/invoices
   {
     "company_id": "uuid",
     "client_id": "uuid",
     "date": "2025-01-27",
     "items": [
       {
         "description": "Product A",
         "quantity": 10,
         "unit_price": 100,
         "gst_rate": 18
       }
     ]
   }

2. API Layer (app/api/v1/invoices.py)
   ↓
   @router.post("/")
   async def create_invoice(data: InvoiceCreate)
   - Validates request with Pydantic schema
   - Extracts data

3. Business Logic (app/services/tax_calculator.py)
   ↓
   calculate_line_taxes()
   - For each item:
     * Calculate taxable amount (quantity × unit_price - discount)
     * Determine inter-state vs intra-state
     * Calculate CGST, SGST, or IGST
     * Calculate CESS if applicable
   - Returns tax breakdown

4. Business Logic (app/services/number_generator.py)
   ↓
   generate_invoice_number(company)
   - Gets last invoice number from DB
   - Increments counter
   - Formats with prefix/suffix: "INV-2025-001"

5. Database Layer (app/db/models.py)
   ↓
   - Create Invoice record
   - Create InvoiceItem records (with calculated taxes)
   - Commit transaction

6. Response
   ↓
   {
     "id": "uuid",
     "invoice_number": "INV-2025-001",
     "total_amount": 1180.00,
     "cgst_total": 90.00,
     "sgst_total": 90.00,
     "grand_total": 1180.00,
     "items": [...],
     "created_at": "2025-01-27T10:00:00Z"
   }
```

---

## 🔐 Authentication Flow (Future)

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ 1. User signs in with Google
       ▼
┌──────────────┐
│ Firebase Auth│
└──────┬───────┘
       │
       │ 2. Get ID Token
       │
       ▼
┌──────────────┐
│   Frontend   │ 3. Include token in request header
└──────┬───────┘    Authorization: Bearer <token>
       │
       │ HTTP Request
       ▼
┌──────────────────────────────────┐
│      FastAPI Backend             │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Middleware/Dependency      │ │ 4. Extract token
│  │ verify_firebase_token()    │ │    from header
│  └─────────┬──────────────────┘ │
│            │                     │
│            │ 5. Verify with      │
│            │    Firebase Admin   │
│            ▼                     │
│  ┌────────────────────────────┐ │
│  │ Firebase Admin SDK         │ │ 6. Get user info
│  │ auth.verify_id_token()     │ │    (uid, email)
│  └─────────┬──────────────────┘ │
│            │                     │
│            │ 7. User context     │
│            ▼                     │
│  ┌────────────────────────────┐ │
│  │ Endpoint Handler           │ │ 8. Check permissions
│  │ @router.get("/invoices")   │ │    User owns company?
│  └─────────┬──────────────────┘ │
│            │                     │
│            ▼                     │
│  ┌────────────────────────────┐ │
│  │ Database Query             │ │ 9. Filter by user_id
│  │ WHERE user_id = ...        │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

---

## 📦 Data Flow Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (API Endpoints - app/api/v1/*.py)      │
│  - Handle HTTP requests/responses       │
│  - Route to appropriate handlers        │
│  - Return JSON responses                │
└───────────────┬─────────────────────────┘
                │
                ↓ Pydantic Schemas
                │
┌───────────────▼─────────────────────────┐
│        Validation Layer                 │
│  (Pydantic Schemas - app/schemas/*.py)  │
│  - Validate input data                  │
│  - Serialize output data                │
│  - Type checking                        │
└───────────────┬─────────────────────────┘
                │
                ↓ Business Rules
                │
┌───────────────▼─────────────────────────┐
│        Business Logic Layer             │
│  (Services - app/services/*.py)         │
│  - Tax calculations                     │
│  - Invoice numbering                    │
│  - Amount conversions                   │
│  - Domain-specific logic                │
└───────────────┬─────────────────────────┘
                │
                ↓ ORM Operations
                │
┌───────────────▼─────────────────────────┐
│        Data Access Layer                │
│  (SQLAlchemy Models - app/db/models.py) │
│  - Define database schema               │
│  - Handle relationships                 │
│  - Execute queries                      │
└───────────────┬─────────────────────────┘
                │
                ↓ SQL Queries
                │
┌───────────────▼─────────────────────────┐
│        Persistence Layer                │
│  (PostgreSQL Database)                  │
│  - Store data                           │
│  - Enforce constraints                  │
│  - Execute transactions                 │
└─────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

```
┌─────────────────────────────────────────────────┐
│                    Frontend                     │
├─────────────────────────────────────────────────┤
│ • Next.js 14 (React Framework)                  │
│ • TypeScript                                    │
│ • Tailwind CSS                                  │
│ • Firebase Auth (Client-side)                   │
│ • Context API for State Management             │
└────────────────┬────────────────────────────────┘
                 │ REST API (JSON)
┌────────────────▼────────────────────────────────┐
│                    Backend                      │
├─────────────────────────────────────────────────┤
│ • FastAPI 0.109.0 (Web Framework)               │
│ • Python 3.10+                                  │
│ • Pydantic 2.5.3 (Validation)                   │
│ • SQLAlchemy 2.0.25 (ORM)                       │
│ • Uvicorn (ASGI Server)                         │
│ • Firebase Admin SDK (Future Auth)              │
└────────────────┬────────────────────────────────┘
                 │ asyncpg Driver
┌────────────────▼────────────────────────────────┐
│                   Database                      │
├─────────────────────────────────────────────────┤
│ • PostgreSQL 14+                                │
│ • UUID Extensions                               │
│ • JSONB Support                                 │
└─────────────────────────────────────────────────┘

Additional Tools:
├─ Development: pytest, black, mypy
├─ Deployment: Docker, Gunicorn
├─ Migration: Alembic
└─ Monitoring: Logging, Health Checks
```

---

## 🔄 Development Workflow

```
1. Local Development
   ├─ Edit code in app/
   ├─ Auto-reload with --reload flag
   ├─ Test with Swagger UI
   └─ Debug with print() or debugger

2. Database Changes
   ├─ Modify app/db/models.py
   ├─ Generate migration: alembic revision --autogenerate
   ├─ Review migration script
   └─ Apply: alembic upgrade head

3. API Changes
   ├─ Update schemas in app/schemas/
   ├─ Update endpoint in app/api/v1/
   ├─ Test manually in Swagger UI
   └─ Write automated tests

4. Business Logic
   ├─ Add service in app/services/
   ├─ Import in endpoint
   └─ Use in API handlers

5. Deploy
   ├─ Set environment variables
   ├─ Run migrations
   ├─ Start server with Gunicorn
   └─ Monitor logs
```

---

## 📈 Scaling Strategy

```
Current: Single Instance
┌────────────────┐
│   FastAPI      │
│   (Uvicorn)    │
└───────┬────────┘
        │
┌───────▼────────┐
│  PostgreSQL    │
└────────────────┘

Phase 1: Multiple Workers
┌────────────────┐
│   Gunicorn     │
│  ┌──────────┐  │
│  │ Worker 1 │  │
│  │ Worker 2 │  │
│  │ Worker 3 │  │
│  │ Worker 4 │  │
│  └──────────┘  │
└───────┬────────┘
        │
┌───────▼────────┐
│  PostgreSQL    │
└────────────────┘

Phase 2: Load Balancing
┌────────────────┐
│ Load Balancer  │
│   (Nginx)      │
└───┬────────┬───┘
    │        │
┌───▼───┐ ┌──▼────┐
│ API 1 │ │ API 2 │
└───┬───┘ └──┬────┘
    │        │
┌───▼────────▼───┐
│  PostgreSQL    │
│  (Primary)     │
└────────────────┘

Phase 3: Database Scaling
┌────────────────┐
│ Load Balancer  │
└───┬────────┬───┘
    │        │
┌───▼───┐ ┌──▼────┐
│ API 1 │ │ API 2 │
└───┬───┘ └──┬────┘
    │        │
┌───▼────────▼───┐
│  PostgreSQL    │
│   Primary      │◄─── Replication
└───┬────────────┘
    │
┌───▼────────────┐
│  PostgreSQL    │
│   Read Replica │
└────────────────┘

Phase 4: Caching + Microservices
┌────────────────┐
│ Load Balancer  │
└───┬────────┬───┘
    │        │
┌───▼───┐ ┌──▼────┐
│ API 1 │ │ API 2 │
└───┬───┘ └──┬────┘
    │   ┌────▼─────┐
    │   │  Redis   │ (Cache)
    │   └──────────┘
    │
┌───▼────────────┐
│  PostgreSQL    │
│   Primary      │
└────────────────┘
    │
    ├─ PDF Generation Service
    ├─ Email Service
    └─ Analytics Service
```

---

## 🎯 Key Design Decisions

### 1. **Async vs Sync**
- **Choice**: Async SQLAlchemy
- **Reason**: Better scalability for I/O-bound operations
- **Trade-off**: Slightly more complex code

### 2. **UUID vs Auto-increment IDs**
- **Choice**: UUID primary keys
- **Reason**: Distributed system friendly, no ID collision
- **Trade-off**: Larger storage, slightly slower joins

### 3. **JSONB vs Separate Tables**
- **Choice**: JSONB for addresses, contacts, bank details
- **Reason**: Flexible schema, matches Firebase structure
- **Trade-off**: Less queryable, no foreign key constraints

### 4. **Server-side Tax Calculation**
- **Choice**: Calculate taxes on backend
- **Reason**: Single source of truth, consistency
- **Trade-off**: Extra API call for calculations

### 5. **Cascade Deletes**
- **Choice**: CASCADE for owned entities, RESTRICT for references
- **Reason**: Prevent orphaned data, protect critical references
- **Trade-off**: Must be careful with delete operations

---

**This architecture is designed for:**
✅ Maintainability  
✅ Scalability  
✅ Type Safety  
✅ Testing  
✅ Future Growth  
