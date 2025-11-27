# Invoice Management API - Backend

A production-ready FastAPI backend for invoice, quotation, and billing management system with automatic GST calculation, invoice numbering, and comprehensive CRUD operations.

## 🚀 Features

- **Complete REST API** for invoice billing system
- **Automatic GST Calculations** (CGST, SGST, IGST, CESS)
- **Invoice & Quotation Management** with automatic numbering
- **Product & Client Management** with search and filtering
- **Multi-Company Support** with company-specific configurations
- **Payment Tracking** with multiple payment records per invoice
- **PostgreSQL Database** with async SQLAlchemy ORM
- **Type-Safe** with Pydantic schemas and Python type hints
- **Auto-Generated API Documentation** (Swagger UI & ReDoc)
- **CORS Enabled** for frontend integration

## 📋 Prerequisites

- Python 3.10+
- PostgreSQL 14+
- pip or poetry for package management

## 🛠️ Installation

### 1. Clone and Setup Virtual Environment

```powershell
cd Backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update with your settings:

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/invoice_db
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
```

### 4. Create Database

```powershell
# Using PostgreSQL CLI
psql -U postgres
CREATE DATABASE invoice_db;
\q
```

### 5. Run Database Migrations (Optional - Auto-creates in DEBUG mode)

For production, use Alembic:

```powershell
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## 🏃 Running the Application

### Development Mode

```powershell
# Method 1: Direct Python
python -m app.main

# Method 2: Uvicorn with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```powershell
# Using Gunicorn with Uvicorn workers
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Main Endpoints

#### Users
- `POST /users` - Create user
- `GET /users` - List users (paginated)
- `GET /users/{user_id}` - Get user
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Delete user

#### Companies
- `POST /companies` - Create company
- `GET /companies` - List companies (with filters)
- `GET /companies/{company_id}` - Get company
- `PUT /companies/{company_id}` - Update company
- `DELETE /companies/{company_id}` - Delete company

#### Clients
- `POST /clients` - Create client
- `GET /clients` - List clients (with filters)
- `GET /clients/{client_id}` - Get client
- `PUT /clients/{client_id}` - Update client
- `DELETE /clients/{client_id}` - Delete client

#### Products
- `POST /products` - Create product
- `GET /products` - List products (with filters)
- `GET /products/{product_id}` - Get product
- `PUT /products/{product_id}` - Update product
- `DELETE /products/{product_id}` - Delete product
- `POST /products/{product_id}/stock` - Update stock

#### Product Categories
- `POST /products/categories` - Create category
- `GET /products/categories` - List categories
- `GET /products/categories/{category_id}` - Get category
- `PUT /products/categories/{category_id}` - Update category
- `DELETE /products/categories/{category_id}` - Delete category

#### Invoices
- `POST /invoices` - Create invoice (auto-calculates taxes)
- `GET /invoices` - List invoices (with filters)
- `GET /invoices/{invoice_id}` - Get invoice with items
- `PUT /invoices/{invoice_id}` - Update invoice
- `DELETE /invoices/{invoice_id}` - Delete invoice
- `POST /invoices/{invoice_id}/payments` - Record payment
- `GET /invoices/{invoice_id}/payments` - List payments

#### Quotations
- `POST /quotations` - Create quotation
- `GET /quotations` - List quotations (with filters)
- `GET /quotations/{quotation_id}` - Get quotation with items
- `PUT /quotations/{quotation_id}` - Update quotation
- `DELETE /quotations/{quotation_id}` - Delete quotation
- `POST /quotations/{quotation_id}/convert` - Convert to invoice

#### Customizations
- `POST /customizations` - Create/Update customization
- `GET /customizations?company_id={id}&type={type}` - Get customization
- `PUT /customizations/{customization_id}` - Update customization
- `DELETE /customizations/{customization_id}` - Delete customization

### Example API Calls

#### Create a User
```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

#### Create an Invoice
```bash
curl -X POST http://localhost:8000/api/v1/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "uuid-here",
    "client_id": "uuid-here",
    "date": "2025-11-27T10:00:00Z",
    "items": [
      {
        "description": "Product 1",
        "hsn": "12345678",
        "quantity": 10,
        "unit": "Nos",
        "unit_price": 100.00,
        "discount": 0,
        "gst_rate": 18,
        "cess_rate": 0
      }
    ]
  }'
```

## 🏗️ Project Structure

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py           # Application settings
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py             # SQLAlchemy base and mixins
│   │   ├── models.py           # Database models
│   │   └── session.py          # Database session management
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── users.py
│   │       ├── companies.py
│   │       ├── clients.py
│   │       ├── products.py
│   │       ├── invoices.py
│   │       ├── quotations.py
│   │       └── customizations.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py           # Common schemas (pagination, etc.)
│   │   ├── user.py
│   │   ├── company.py
│   │   ├── client.py
│   │   ├── product.py
│   │   ├── invoice.py
│   │   ├── quotation.py
│   │   └── customization.py
│   └── services/
│       ├── __init__.py
│       ├── tax_calculator.py   # GST calculation logic
│       ├── number_generator.py # Invoice/quotation numbering
│       └── number_to_words.py  # Amount to words converter
├── requirements.txt
├── .env.example
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `DEBUG` | Enable debug mode | False |
| `ENVIRONMENT` | Environment name | production |
| `API_V1_PREFIX` | API version prefix | /api/v1 |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | [] |
| `MAX_PAGE_SIZE` | Maximum pagination limit | 1000 |
| `DEFAULT_PAGE_SIZE` | Default pagination limit | 50 |

## 📊 Database Schema

- **users** - User accounts
- **companies** - Company/business entities
- **clients** - Customer/client records
- **products** - Products and services catalog
- **product_categories** - Global product categories
- **invoices** - Invoice headers
- **invoice_items** - Invoice line items
- **payments** - Payment records
- **quotations** - Quotation/estimate headers
- **quotation_items** - Quotation line items
- **customizations** - Invoice/quotation customizations

All tables include:
- UUID primary keys
- `created_at` and `updated_at` timestamps
- Proper foreign key relationships with cascading deletes
- Indexes on frequently queried columns

## 🧪 Testing

```powershell
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v
```

## 🐳 Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```powershell
docker build -t invoice-api .
docker run -p 8000:8000 --env-file .env invoice-api
```

## 🔐 Security Notes

- All endpoints validate input using Pydantic schemas
- SQL injection protection via SQLAlchemy parameterized queries
- CORS configured for specific origins only
- No authentication implemented yet - add JWT/OAuth2 as needed
- Use HTTPS in production
- Store sensitive config in environment variables

## 📈 Performance Tips

- Use connection pooling (configured in `session.py`)
- Add database indexes for frequently queried fields
- Use `selectinload` for eager loading relationships
- Implement caching for frequently accessed data (Redis)
- Use background tasks for heavy operations

## 🤝 Contributing

1. Create feature branch
2. Make changes with proper type hints
3. Run tests and linting
4. Submit pull request

## 📝 License

Private/Proprietary

## 💡 Support

For issues or questions, contact the development team.

---

**Built with ❤️ using FastAPI, SQLAlchemy, and PostgreSQL**
