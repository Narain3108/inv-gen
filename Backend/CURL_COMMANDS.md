# Firestore API - cURL Commands

All endpoints now use **Firebase Firestore** exclusively. No PostgreSQL is used.

## Base URL
```
http://localhost:8000/api/v1
```

## 1. Users Endpoints

### Create User
```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"name\":\"John Doe\",\"photo_url\":\"https://example.com/photo.jpg\"}"
```

### List Users
```bash
curl http://localhost:8000/api/v1/users
```

### Get User by ID
```bash
curl http://localhost:8000/api/v1/users/{user_id}
```

### Update User
```bash
curl -X PUT http://localhost:8000/api/v1/users/{user_id} \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john.updated@example.com\",\"name\":\"John Updated\"}"
```

### Delete User
```bash
curl -X DELETE http://localhost:8000/api/v1/users/{user_id}
```

---

## 2. Companies Endpoints

### Create Company
```bash
curl -X POST http://localhost:8000/api/v1/companies \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\":\"USER_ID_HERE\",
    \"name\":\"Tech Solutions Pvt Ltd\",
    \"gstin\":\"29AABCT1332L1Z1\",
    \"pan\":\"AABCT1332L\",
    \"address\":{\"street\":\"123 MG Road\",\"city\":\"Bangalore\",\"state\":\"Karnataka\",\"pincode\":\"560001\"},
    \"contact\":{\"phone\":\"+91-9876543210\",\"email\":\"info@techsolutions.com\"},
    \"bank_details\":{\"account_number\":\"1234567890\",\"ifsc\":\"HDFC0001234\",\"bank_name\":\"HDFC Bank\"}
  }"
```

### List Companies
```bash
# All companies
curl http://localhost:8000/api/v1/companies

# Filter by user_id
curl "http://localhost:8000/api/v1/companies?user_id=USER_ID_HERE"
```

### Get Company by ID
```bash
curl http://localhost:8000/api/v1/companies/{company_id}
```

### Update Company
```bash
curl -X PUT http://localhost:8000/api/v1/companies/{company_id} \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"USER_ID\",\"name\":\"Updated Company Name\",\"gstin\":\"29AABCT1332L1Z1\"}"
```

### Delete Company
```bash
curl -X DELETE http://localhost:8000/api/v1/companies/{company_id}
```

---

## 3. Clients Endpoints

### Create Client
```bash
curl -X POST http://localhost:8000/api/v1/clients \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\":\"COMPANY_ID_HERE\",
    \"name\":\"Acme Corporation\",
    \"gstin\":\"27AACCM9731F1ZW\",
    \"contact_person\":\"Jane Smith\",
    \"email\":\"jane@acme.com\",
    \"phone\":\"+91-9123456789\",
    \"addresses\":[{\"type\":\"billing\",\"street\":\"456 Park Street\",\"city\":\"Mumbai\",\"state\":\"Maharashtra\",\"pincode\":\"400001\"}]
  }"
```

### List Clients
```bash
# All clients
curl http://localhost:8000/api/v1/clients

# Filter by company_id
curl "http://localhost:8000/api/v1/clients?company_id=COMPANY_ID_HERE"
```

### Get Client by ID
```bash
curl http://localhost:8000/api/v1/clients/{client_id}
```

### Update Client
```bash
curl -X PUT http://localhost:8000/api/v1/clients/{client_id} \
  -H "Content-Type: application/json" \
  -d "{\"company_id\":\"COMPANY_ID\",\"name\":\"Updated Client Name\",\"email\":\"newemail@example.com\"}"
```

### Delete Client
```bash
curl -X DELETE http://localhost:8000/api/v1/clients/{client_id}
```

---

## 4. Products Endpoints

### Create Product
```bash
curl -X POST http://localhost:8000/api/v1/products \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\":\"COMPANY_ID_HERE\",
    \"name\":\"Software License\",
    \"description\":\"Annual software license\",
    \"hsn\":\"998314\",
    \"unit\":\"License\",
    \"unit_price\":50000,
    \"gst_rate\":18,
    \"stock_quantity\":100
  }"
```

### List Products
```bash
# All products
curl http://localhost:8000/api/v1/products

# Filter by company_id
curl "http://localhost:8000/api/v1/products?company_id=COMPANY_ID_HERE"
```

### Get Product by ID
```bash
curl http://localhost:8000/api/v1/products/{product_id}
```

### Update Product
```bash
curl -X PUT http://localhost:8000/api/v1/products/{product_id} \
  -H "Content-Type: application/json" \
  -d "{\"company_id\":\"COMPANY_ID\",\"name\":\"Updated Product\",\"unit_price\":55000}"
```

### Delete Product
```bash
curl -X DELETE http://localhost:8000/api/v1/products/{product_id}
```

---

## 5. Invoices Endpoints

### Create Invoice
```bash
curl -X POST http://localhost:8000/api/v1/invoices \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\":\"COMPANY_ID_HERE\",
    \"client_id\":\"CLIENT_ID_HERE\",
    \"date\":\"2024-11-27\",
    \"due_date\":\"2024-12-27\",
    \"items\":[
      {\"description\":\"Software License\",\"hsn\":\"998314\",\"quantity\":2,\"unit\":\"License\",\"unit_price\":50000,\"discount\":5000,\"gst_rate\":18},
      {\"description\":\"Consulting Services\",\"hsn\":\"998311\",\"quantity\":10,\"unit\":\"Hour\",\"unit_price\":2000,\"discount\":0,\"gst_rate\":18}
    ],
    \"notes\":\"Payment within 30 days\"
  }"
```

### List Invoices
```bash
# All invoices
curl http://localhost:8000/api/v1/invoices

# Filter by company_id
curl "http://localhost:8000/api/v1/invoices?company_id=COMPANY_ID_HERE"

# Filter by client_id
curl "http://localhost:8000/api/v1/invoices?client_id=CLIENT_ID_HERE"

# Filter by both
curl "http://localhost:8000/api/v1/invoices?company_id=COMPANY_ID&client_id=CLIENT_ID"
```

### Get Invoice by ID
```bash
curl http://localhost:8000/api/v1/invoices/{invoice_id}
```

### Delete Invoice
```bash
curl -X DELETE http://localhost:8000/api/v1/invoices/{invoice_id}
```

---

## Testing Workflow

1. **Start the server** (if not already running):
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Run the comprehensive test script**:
   ```powershell
   .\test-all-endpoints.ps1
   ```

This script will:
- Create a user
- Create a company for that user
- Create a client for the company
- Create products for the company
- Create an invoice with those products
- List all created items
- Display all IDs for further testing

---

## PowerShell Alternative

If using PowerShell instead of bash/curl:

```powershell
# Example: Create User
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users" `
  -Method Post `
  -Body '{"email":"test@example.com","name":"Test User"}' `
  -ContentType "application/json"

# Example: List Companies
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/companies" `
  -Method Get
```

---

## Firestore Collections Structure

All data is stored in these Firestore collections:
- `users` - User accounts
- `companies` - Company profiles
- `clients` - Clients for each company
- `products` - Products/services for each company
- `invoices` - Invoices with line items

**No PostgreSQL is used anywhere in the system.**
