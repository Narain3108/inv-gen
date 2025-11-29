# Firestore API - Complete Documentation

## Firestore Structure

### Global Collections (Top-Level)
- `users` - User accounts
- `companies` - Company profiles  
- `clients` - Clients (shared across all users)
- `products` - Products/services (shared across all users)

### Company Subcollections (Under each company)
- `companies/{companyId}/invoices` - Invoices for specific company
- `companies/{companyId}/quotations` - Quotations for specific company
- `companies/{companyId}/customizations` - Settings/customization for company
- `companies/{companyId}/productCategories` - Product categories for company

---

## Base URL
```
http://localhost:8000/api/v1
```

---

## 1. Users (Global Collection)

### Create User
```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","name":"John Doe","photo_url":"https://example.com/photo.jpg"}'
```

### List Users
```bash
curl http://localhost:8000/api/v1/users
```

### Get User
```bash
curl http://localhost:8000/api/v1/users/{user_id}
```

### Update User
```bash
curl -X PUT http://localhost:8000/api/v1/users/{user_id} \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","name":"John Updated"}'
```

### Delete User
```bash
curl -X DELETE http://localhost:8000/api/v1/users/{user_id}
```

---

## 2. Companies (Global Collection)

### Create Company
```bash
curl -X POST http://localhost:8000/api/v1/companies \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"USER_ID_HERE",
    "name":"Tech Solutions Pvt Ltd",
    "gstin":"29AABCT1332L1Z1",
    "pan":"AABCT1332L",
    "address":{"street":"123 MG Road","city":"Bangalore","state":"Karnataka","pincode":"560001"},
    "contact":{"phone":"+91-9876543210","email":"info@techsolutions.com"},
    "bank_details":{"account_number":"1234567890","ifsc":"HDFC0001234","bank_name":"HDFC Bank"}
  }'
```

### List Companies
```bash
# All companies
curl http://localhost:8000/api/v1/companies

# Filter by user_id
curl "http://localhost:8000/api/v1/companies?user_id=USER_ID"
```

### Get Company
```bash
curl http://localhost:8000/api/v1/companies/{company_id}
```

### Update Company
```bash
curl -X PUT http://localhost:8000/api/v1/companies/{company_id} \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","name":"Updated Company Name"}'
```

### Delete Company
```bash
curl -X DELETE http://localhost:8000/api/v1/companies/{company_id}
```

---

## 3. Clients (Global Collection)

### Create Client
```bash
curl -X POST http://localhost:8000/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"USER_ID_HERE",
    "name":"Acme Corporation",
    "gstin":"27AACCM9731F1ZW",
    "contact_person":"Jane Smith",
    "email":"jane@acme.com",
    "phone":"+91-9123456789",
    "addresses":[{"type":"billing","street":"456 Park Street","city":"Mumbai","state":"Maharashtra","pincode":"400001"}]
  }'
```

### List Clients
```bash
# All clients
curl http://localhost:8000/api/v1/clients

# Filter by user_id
curl "http://localhost:8000/api/v1/clients?user_id=USER_ID"
```

### Get Client
```bash
curl http://localhost:8000/api/v1/clients/{client_id}
```

### Update Client
```bash
curl -X PUT http://localhost:8000/api/v1/clients/{client_id} \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","name":"Updated Client Name"}'
```

### Delete Client
```bash
curl -X DELETE http://localhost:8000/api/v1/clients/{client_id}
```

---

## 4. Products (Global Collection)

### Create Product
```bash
curl -X POST http://localhost:8000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"USER_ID_HERE",
    "name":"Software License",
    "description":"Annual software license",
    "hsn":"998314",
    "unit":"License",
    "unit_price":50000,
    "gst_rate":18,
    "stock_quantity":100
  }'
```

### List Products
```bash
# All products
curl http://localhost:8000/api/v1/products

# Filter by user_id
curl "http://localhost:8000/api/v1/products?user_id=USER_ID"
```

### Get Product
```bash
curl http://localhost:8000/api/v1/products/{product_id}
```

### Update Product
```bash
curl -X PUT http://localhost:8000/api/v1/products/{product_id} \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER_ID","name":"Updated Product","unit_price":55000}'
```

### Delete Product
```bash
curl -X DELETE http://localhost:8000/api/v1/products/{product_id}
```

---

## 5. Invoices (Company Subcollection)

⚠️ **Note:** Invoices are stored under `companies/{companyId}/invoices`

### Create Invoice
```bash
curl -X POST "http://localhost:8000/api/v1/companies/COMPANY_ID/invoices" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id":"CLIENT_ID_HERE",
    "date":"2024-11-27",
    "due_date":"2024-12-27",
    "items":[
      {"description":"Software License","hsn":"998314","quantity":2,"unit":"License","unit_price":50000,"discount":5000,"gst_rate":18},
      {"description":"Consulting Services","hsn":"998311","quantity":10,"unit":"Hour","unit_price":2000,"discount":0,"gst_rate":18}
    ],
    "notes":"Payment within 30 days"
  }'
```

### List Invoices for Company
```bash
# All invoices for a company
curl "http://localhost:8000/api/v1/companies/COMPANY_ID/invoices"

# Filter by client_id
curl "http://localhost:8000/api/v1/companies/COMPANY_ID/invoices?client_id=CLIENT_ID"
```

### Get Invoice
```bash
curl "http://localhost:8000/api/v1/companies/COMPANY_ID/invoices/INVOICE_ID"
```

### Update Invoice
```bash
curl -X PUT "http://localhost:8000/api/v1/companies/COMPANY_ID/invoices/INVOICE_ID" \
  -H "Content-Type: application/json" \
  -d '{...invoice data...}'
```

### Delete Invoice
```bash
curl -X DELETE "http://localhost:8000/api/v1/companies/COMPANY_ID/invoices/INVOICE_ID"
```

---

## 6. Quotations (Company Subcollection)

⚠️ **Note:** Quotations are stored under `companies/{companyId}/quotations`

### Create Quotation
```bash
curl -X POST "http://localhost:8000/api/v1/companies/COMPANY_ID/quotations" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id":"CLIENT_ID_HERE",
    "date":"2024-11-27",
    "valid_until":"2024-12-27",
    "items":[
      {"description":"Software License","hsn":"998314","quantity":2,"unit":"License","unit_price":50000,"discount":0,"gst_rate":18}
    ],
    "notes":"Valid for 30 days",
    "terms":"Payment on acceptance"
  }'
```

### List Quotations for Company
```bash
curl "http://localhost:8000/api/v1/companies/COMPANY_ID/quotations"
```

### Get Quotation
```bash
curl "http://localhost:8000/api/v1/companies/COMPANY_ID/quotations/QUOTATION_ID"
```

### Delete Quotation
```bash
curl -X DELETE "http://localhost:8000/api/v1/companies/COMPANY_ID/quotations/QUOTATION_ID"
```

---

## 7. Customizations (Company Subcollection)

⚠️ **Note:** Customizations are stored under `companies/{companyId}/customizations`

### Create/Update Customization
```bash
curl -X POST "http://localhost:8000/api/v1/companies/COMPANY_ID/customizations" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_prefix":"INV",
    "quotation_prefix":"QUO",
    "invoice_starting_number":1,
    "quotation_starting_number":1,
    "terms_and_conditions":"Payment within 30 days",
    "payment_terms":"Net 30",
    "theme_color":"#6366f1",
    "font_family":"Arial",
    "logo_position":"left"
  }'
```

### Get Customization
```bash
curl "http://localhost:8000/api/v1/companies/COMPANY_ID/customizations"
```

### Update Customization
```bash
curl -X PUT "http://localhost:8000/api/v1/companies/COMPANY_ID/customizations/CUSTOMIZATION_ID" \
  -H "Content-Type: application/json" \
  -d '{...customization data...}'
```

### Delete Customization
```bash
curl -X DELETE "http://localhost:8000/api/v1/companies/COMPANY_ID/customizations/CUSTOMIZATION_ID"
```

---

## 8. Product Categories (Company Subcollection)

⚠️ **Note:** Product Categories are stored under `companies/{companyId}/productCategories`

### Create Product Category
```bash
curl -X POST "http://localhost:8000/api/v1/companies/COMPANY_ID/product-categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Software",
    "description":"Software products and licenses",
    "color":"#6366f1"
  }'
```

### List Product Categories
```bash
curl "http://localhost:8000/api/v1/companies/COMPANY_ID/product-categories"
```

### Get Product Category
```bash
curl "http://localhost:8000/api/v1/companies/COMPANY_ID/product-categories/CATEGORY_ID"
```

### Update Product Category
```bash
curl -X PUT "http://localhost:8000/api/v1/companies/COMPANY_ID/product-categories/CATEGORY_ID" \
  -H "Content-Type: application/json" \
  -d '{...category data...}'
```

### Delete Product Category
```bash
curl -X DELETE "http://localhost:8000/api/v1/companies/COMPANY_ID/product-categories/CATEGORY_ID"
```

---

## Architecture Summary

**100% Firebase Firestore - No PostgreSQL**

**Global Collections** (top-level):
- `/users`
- `/companies`
- `/clients`
- `/products`

**Company Subcollections** (nested):
- `/companies/{companyId}/invoices`
- `/companies/{companyId}/quotations`
- `/companies/{companyId}/customizations`
- `/companies/{companyId}/productCategories`

This structure allows:
1. **Shared data** (users, companies, clients, products) at the global level
2. **Company-specific data** (invoices, quotations, settings) isolated per company
3. **Better organization** and **data isolation** for multi-company scenarios
