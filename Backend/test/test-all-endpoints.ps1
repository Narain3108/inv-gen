# Test All Firestore Endpoints
# Make sure the server is running: uvicorn app.main:app --reload

$baseUrl = "http://localhost:8000/api/v1"
$contentType = "application/json"

Write-Host "=== Testing Firestore API Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# 1. Create User
Write-Host "1. Creating User..." -ForegroundColor Yellow
$userBody = @{
    email = "john@example.com"
    name = "John Doe"
    photo_url = "https://example.com/photo.jpg"
} | ConvertTo-Json

$userResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Body $userBody -ContentType $contentType
$userId = $userResponse.id
Write-Host "✓ User created: $userId" -ForegroundColor Green
Write-Host ""

# 2. Create Company
Write-Host "2. Creating Company..." -ForegroundColor Yellow
$companyBody = @{
    user_id = $userId
    name = "Tech Solutions Pvt Ltd"
    gstin = "29AABCT1332L1Z1"
    pan = "AABCT1332L"
    address = @{
        street = "123 MG Road"
        city = "Bangalore"
        state = "Karnataka"
        pincode = "560001"
    }
    contact = @{
        phone = "+91-9876543210"
        email = "info@techsolutions.com"
    }
    bank_details = @{
        account_number = "1234567890"
        ifsc = "HDFC0001234"
        bank_name = "HDFC Bank"
    }
} | ConvertTo-Json

$companyResponse = Invoke-RestMethod -Uri "$baseUrl/companies" -Method Post -Body $companyBody -ContentType $contentType
$companyId = $companyResponse.id
Write-Host "✓ Company created: $companyId" -ForegroundColor Green
Write-Host ""

# 3. Create Client
Write-Host "3. Creating Client..." -ForegroundColor Yellow
$clientBody = @{
    company_id = $companyId
    name = "Acme Corporation"
    gstin = "27AACCM9731F1ZW"
    contact_person = "Jane Smith"
    email = "jane@acme.com"
    phone = "+91-9123456789"
    addresses = @(
        @{
            type = "billing"
            street = "456 Park Street"
            city = "Mumbai"
            state = "Maharashtra"
            pincode = "400001"
        }
    )
} | ConvertTo-Json

$clientResponse = Invoke-RestMethod -Uri "$baseUrl/clients" -Method Post -Body $clientBody -ContentType $contentType
$clientId = $clientResponse.id
Write-Host "✓ Client created: $clientId" -ForegroundColor Green
Write-Host ""

# 4. Create Products
Write-Host "4. Creating Products..." -ForegroundColor Yellow

$product1Body = @{
    company_id = $companyId
    name = "Software License"
    description = "Annual software license"
    hsn = "998314"
    unit = "License"
    unit_price = 50000
    gst_rate = 18
    stock_quantity = 100
} | ConvertTo-Json

$product1Response = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Body $product1Body -ContentType $contentType
$product1Id = $product1Response.id
Write-Host "✓ Product 1 created: $product1Id" -ForegroundColor Green

$product2Body = @{
    company_id = $companyId
    name = "Consulting Services"
    description = "Technical consulting per hour"
    hsn = "998311"
    unit = "Hour"
    unit_price = 2000
    gst_rate = 18
    stock_quantity = 0
} | ConvertTo-Json

$product2Response = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Body $product2Body -ContentType $contentType
$product2Id = $product2Response.id
Write-Host "✓ Product 2 created: $product2Id" -ForegroundColor Green
Write-Host ""

# 5. Create Invoice
Write-Host "5. Creating Invoice..." -ForegroundColor Yellow
$invoiceBody = @{
    company_id = $companyId
    client_id = $clientId
    date = "2024-11-27"
    due_date = "2024-12-27"
    items = @(
        @{
            description = "Software License"
            hsn = "998314"
            quantity = 2
            unit = "License"
            unit_price = 50000
            discount = 5000
            gst_rate = 18
        }
        @{
            description = "Consulting Services"
            hsn = "998311"
            quantity = 10
            unit = "Hour"
            unit_price = 2000
            discount = 0
            gst_rate = 18
        }
    )
    notes = "Payment within 30 days"
} | ConvertTo-Json -Depth 10

$invoiceResponse = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Body $invoiceBody -ContentType $contentType
$invoiceId = $invoiceResponse.id
Write-Host "✓ Invoice created: $invoiceId" -ForegroundColor Green
Write-Host "  Invoice Number: $($invoiceResponse.invoice_number)" -ForegroundColor Cyan
Write-Host "  Subtotal: ₹$($invoiceResponse.subtotal)" -ForegroundColor Cyan
Write-Host "  Tax: ₹$($invoiceResponse.tax_total)" -ForegroundColor Cyan
Write-Host "  Grand Total: ₹$($invoiceResponse.grand_total)" -ForegroundColor Cyan
Write-Host ""

# 6. List All Data
Write-Host "6. Listing All Data..." -ForegroundColor Yellow

$users = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get
Write-Host "✓ Total Users: $($users.Count)" -ForegroundColor Green

$companies = Invoke-RestMethod -Uri "$baseUrl/companies" -Method Get
Write-Host "✓ Total Companies: $($companies.Count)" -ForegroundColor Green

$clients = Invoke-RestMethod -Uri "$baseUrl/clients?company_id=$companyId" -Method Get
Write-Host "✓ Total Clients: $($clients.Count)" -ForegroundColor Green

$products = Invoke-RestMethod -Uri "$baseUrl/products?company_id=$companyId" -Method Get
Write-Host "✓ Total Products: $($products.Count)" -ForegroundColor Green

$invoices = Invoke-RestMethod -Uri "$baseUrl/invoices?company_id=$companyId" -Method Get
Write-Host "✓ Total Invoices: $($invoices.Count)" -ForegroundColor Green
Write-Host ""

# 7. Get Individual Items
Write-Host "7. Getting Individual Items..." -ForegroundColor Yellow

$user = Invoke-RestMethod -Uri "$baseUrl/users/$userId" -Method Get
Write-Host "✓ User: $($user.name)" -ForegroundColor Green

$company = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId" -Method Get
Write-Host "✓ Company: $($company.name)" -ForegroundColor Green

$client = Invoke-RestMethod -Uri "$baseUrl/clients/$clientId" -Method Get
Write-Host "✓ Client: $($client.name)" -ForegroundColor Green

$invoice = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId" -Method Get
Write-Host "✓ Invoice: $($invoice.invoice_number) - ₹$($invoice.grand_total)" -ForegroundColor Green
Write-Host ""

Write-Host "=== All Tests Completed Successfully! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Created IDs for reference:" -ForegroundColor Cyan
Write-Host "  User ID: $userId"
Write-Host "  Company ID: $companyId"
Write-Host "  Client ID: $clientId"
Write-Host "  Product 1 ID: $product1Id"
Write-Host "  Product 2 ID: $product2Id"
Write-Host "  Invoice ID: $invoiceId"
