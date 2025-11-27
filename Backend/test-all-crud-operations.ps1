# Complete CRUD Testing Script for Invoice Management API
# Tests all endpoints with CREATE, READ, UPDATE, DELETE operations

$baseUrl = "http://localhost:8000/api/v1"
$headers = @{"Content-Type" = "application/json"}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "INVOICE MANAGEMENT API - FULL CRUD TESTS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Store IDs for later operations
$companyId = ""
$clientId = ""
$productId = ""
$invoiceId = ""
$quotationId = ""
$categoryId = ""

# ====================
# 1. COMPANIES (Global Collection)
# ====================
Write-Host ">>> TESTING COMPANIES ENDPOINTS" -ForegroundColor Yellow
Write-Host ""

# CREATE Company
Write-Host "1. CREATE Company:" -ForegroundColor Green
$companyBody = @{
    name = "Test Company Ltd"
    gstin = "29ABCDE1234F1Z5"
    pan = "ABCDE1234F"
    address = @{
        line1 = "123 Test Street"
        city = "Mumbai"
        state = "Maharashtra"
        pincode = "400001"
    }
    contact = @{
        email = "test@company.com"
        phone = "+91-9876543210"
    }
    bank_details = @{
        account_name = "Test Company Ltd"
        account_number = "1234567890"
        ifsc = "SBIN0001234"
        bank_name = "State Bank of India"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/" -Method Post -Body $companyBody -Headers $headers
    $companyId = $response.id
    Write-Host "✅ Company Created: $companyId" -ForegroundColor Green
    Write-Host "Company Name: $($response.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ All Companies
Write-Host "2. GET All Companies:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/" -Method Get
    Write-Host "✅ Retrieved $($response.Count) companies" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ Single Company
Write-Host "3. GET Single Company:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId" -Method Get
    Write-Host "✅ Company Details: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# UPDATE Company
Write-Host "4. UPDATE Company:" -ForegroundColor Green
$updateCompanyBody = @{
    name = "Test Company Ltd (Updated)"
    gstin = "29ABCDE1234F1Z5"
    pan = "ABCDE1234F"
    address = @{
        line1 = "456 Updated Street"
        city = "Mumbai"
        state = "Maharashtra"
        pincode = "400002"
    }
    contact = @{
        email = "updated@company.com"
        phone = "+91-9876543211"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId" -Method Put -Body $updateCompanyBody -Headers $headers
    Write-Host "✅ Company Updated: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 2. CLIENTS (Global Collection)
# ====================
Write-Host ">>> TESTING CLIENTS ENDPOINTS" -ForegroundColor Yellow
Write-Host ""

# CREATE Client
Write-Host "5. CREATE Client:" -ForegroundColor Green
$clientBody = @{
    name = "Test Client Inc"
    gstin = "27XYZAB5678C1D9"
    contact_person = "John Doe"
    email = "john@testclient.com"
    phone = "+91-9123456789"
    addresses = @(
        @{
            type = "billing"
            line1 = "789 Client Avenue"
            city = "Delhi"
            state = "Delhi"
            pincode = "110001"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/" -Method Post -Body $clientBody -Headers $headers
    $clientId = $response.id
    Write-Host "✅ Client Created: $clientId" -ForegroundColor Green
    Write-Host "Client Name: $($response.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ All Clients
Write-Host "6. GET All Clients:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/" -Method Get
    Write-Host "✅ Retrieved $($response.Count) clients" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ Single Client
Write-Host "7. GET Single Client:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/$clientId" -Method Get
    Write-Host "✅ Client Details: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# UPDATE Client
Write-Host "8. UPDATE Client:" -ForegroundColor Green
$updateClientBody = @{
    name = "Test Client Inc (Updated)"
    gstin = "27XYZAB5678C1D9"
    contact_person = "Jane Doe"
    email = "jane@testclient.com"
    phone = "+91-9123456790"
    addresses = @(
        @{
            type = "billing"
            line1 = "999 Updated Avenue"
            city = "Delhi"
            state = "Delhi"
            pincode = "110002"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/$clientId" -Method Put -Body $updateClientBody -Headers $headers
    Write-Host "✅ Client Updated: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 3. PRODUCTS (Global Collection)
# ====================
Write-Host ">>> TESTING PRODUCTS ENDPOINTS" -ForegroundColor Yellow
Write-Host ""

# CREATE Product
Write-Host "9. CREATE Product:" -ForegroundColor Green
$productBody = @{
    name = "Test Product"
    description = "A sample test product"
    hsn = "9801"
    unit = "Nos"
    unit_price = 1000.00
    gst_rate = 18.0
    stock_quantity = 100
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/" -Method Post -Body $productBody -Headers $headers
    $productId = $response.id
    Write-Host "✅ Product Created: $productId" -ForegroundColor Green
    Write-Host "Product Name: $($response.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ All Products
Write-Host "10. GET All Products:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/" -Method Get
    Write-Host "✅ Retrieved $($response.Count) products" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ Single Product
Write-Host "11. GET Single Product:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Get
    Write-Host "✅ Product Details: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# UPDATE Product
Write-Host "12. UPDATE Product:" -ForegroundColor Green
$updateProductBody = @{
    name = "Test Product (Updated)"
    description = "An updated test product"
    hsn = "9801"
    unit = "Nos"
    unit_price = 1200.00
    gst_rate = 18.0
    stock_quantity = 150
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Put -Body $updateProductBody -Headers $headers
    Write-Host "✅ Product Updated: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 4. PRODUCT CATEGORIES (Company Subcollection)
# ====================
Write-Host ">>> TESTING PRODUCT CATEGORIES ENDPOINTS" -ForegroundColor Yellow
Write-Host ""

# CREATE Product Category
Write-Host "13. CREATE Product Category:" -ForegroundColor Green
$categoryBody = @{
    name = "Test Category"
    description = "A test category"
    color = "#FF5733"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/product-categories/" -Method Post -Body $categoryBody -Headers $headers
    $categoryId = $response.id
    Write-Host "✅ Category Created: $categoryId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ All Categories
Write-Host "14. GET All Product Categories:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/product-categories/" -Method Get
    Write-Host "✅ Retrieved $($response.Count) categories" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ Single Category
Write-Host "15. GET Single Product Category:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/product-categories/$categoryId" -Method Get
    Write-Host "✅ Category Details: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# UPDATE Category
Write-Host "16. UPDATE Product Category:" -ForegroundColor Green
$updateCategoryBody = @{
    name = "Test Category (Updated)"
    description = "An updated category"
    color = "#33FF57"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/product-categories/$categoryId" -Method Put -Body $updateCategoryBody -Headers $headers
    Write-Host "✅ Category Updated: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 5. CUSTOMIZATIONS (Company Subcollection)
# ====================
Write-Host ">>> TESTING CUSTOMIZATIONS ENDPOINTS" -ForegroundColor Yellow
Write-Host ""

# CREATE/UPDATE Customization
Write-Host "17. CREATE/UPDATE Customization:" -ForegroundColor Green
$customizationBody = @{
    invoice_prefix = "INV"
    quotation_prefix = "QUO"
    invoice_starting_number = 1
    quotation_starting_number = 1
    terms_and_conditions = "Payment due within 30 days"
    payment_terms = "Net 30"
    theme_color = "#007BFF"
    font_family = "Arial"
    logo_position = "left"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/customizations/" -Method Post -Body $customizationBody -Headers $headers
    Write-Host "✅ Customization Created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ Customization
Write-Host "18. GET Customization:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/customizations/" -Method Get
    Write-Host "✅ Customization Details Retrieved" -ForegroundColor Green
    Write-Host "Invoice Prefix: $($response.invoice_prefix)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 6. INVOICES (Company Subcollection)
# ====================
Write-Host ">>> TESTING INVOICES ENDPOINTS" -ForegroundColor Yellow
Write-Host ""

# CREATE Invoice
Write-Host "19. CREATE Invoice:" -ForegroundColor Green
$invoiceBody = @{
    client_id = $clientId
    invoice_date = (Get-Date).ToString("yyyy-MM-dd")
    due_date = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    items = @(
        @{
            product_id = $productId
            description = "Test Product"
            quantity = 2
            unit_price = 1000.00
            gst_rate = 18.0
        }
    )
    notes = "Test invoice"
    status = "draft"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/invoices/" -Method Post -Body $invoiceBody -Headers $headers
    $invoiceId = $response.id
    Write-Host "✅ Invoice Created: $invoiceId" -ForegroundColor Green
    Write-Host "Invoice Number: $($response.invoice_number)" -ForegroundColor Gray
    Write-Host "Grand Total: $($response.grand_total)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ All Invoices
Write-Host "20. GET All Invoices:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/invoices/" -Method Get
    Write-Host "✅ Retrieved $($response.Count) invoices" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ Single Invoice
Write-Host "21. GET Single Invoice:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/invoices/$invoiceId" -Method Get
    Write-Host "✅ Invoice Details: $($response.invoice_number)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# UPDATE Invoice
Write-Host "22. UPDATE Invoice:" -ForegroundColor Green
$updateInvoiceBody = @{
    client_id = $clientId
    invoice_date = (Get-Date).ToString("yyyy-MM-dd")
    due_date = (Get-Date).AddDays(45).ToString("yyyy-MM-dd")
    items = @(
        @{
            product_id = $productId
            description = "Test Product (Updated)"
            quantity = 3
            unit_price = 1200.00
            gst_rate = 18.0
        }
    )
    notes = "Updated test invoice"
    status = "sent"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/invoices/$invoiceId" -Method Put -Body $updateInvoiceBody -Headers $headers
    Write-Host "✅ Invoice Updated: $($response.invoice_number)" -ForegroundColor Green
    Write-Host "New Grand Total: $($response.grand_total)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 7. QUOTATIONS (Company Subcollection)
# ====================
Write-Host ">>> TESTING QUOTATIONS ENDPOINTS" -ForegroundColor Yellow
Write-Host ""

# CREATE Quotation
Write-Host "23. CREATE Quotation:" -ForegroundColor Green
$quotationBody = @{
    client_id = $clientId
    quotation_date = (Get-Date).ToString("yyyy-MM-dd")
    valid_until = (Get-Date).AddDays(15).ToString("yyyy-MM-dd")
    items = @(
        @{
            product_id = $productId
            description = "Test Product for Quote"
            quantity = 5
            unit_price = 1000.00
            gst_rate = 18.0
        }
    )
    notes = "Test quotation"
    status = "draft"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/quotations/" -Method Post -Body $quotationBody -Headers $headers
    $quotationId = $response.id
    Write-Host "✅ Quotation Created: $quotationId" -ForegroundColor Green
    Write-Host "Quotation Number: $($response.quotation_number)" -ForegroundColor Gray
    Write-Host "Total: $($response.total)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ All Quotations
Write-Host "24. GET All Quotations:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/quotations/" -Method Get
    Write-Host "✅ Retrieved $($response.Count) quotations" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# READ Single Quotation
Write-Host "25. GET Single Quotation:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/quotations/$quotationId" -Method Get
    Write-Host "✅ Quotation Details: $($response.quotation_number)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 8. DELETE OPERATIONS
# ====================
Write-Host ">>> TESTING DELETE ENDPOINTS" -ForegroundColor Yellow
Write-Host ""

# DELETE Quotation
Write-Host "26. DELETE Quotation:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/quotations/$quotationId" -Method Delete
    Write-Host "✅ Quotation Deleted: $quotationId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# DELETE Invoice
Write-Host "27. DELETE Invoice:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/invoices/$invoiceId" -Method Delete
    Write-Host "✅ Invoice Deleted: $invoiceId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# DELETE Product Category
Write-Host "28. DELETE Product Category:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId/product-categories/$categoryId" -Method Delete
    Write-Host "✅ Category Deleted: $categoryId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# DELETE Product
Write-Host "29. DELETE Product:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Delete
    Write-Host "✅ Product Deleted: $productId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# DELETE Client
Write-Host "30. DELETE Client:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/$clientId" -Method Delete
    Write-Host "✅ Client Deleted: $clientId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# DELETE Company
Write-Host "31. DELETE Company:" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId" -Method Delete
    Write-Host "✅ Company Deleted: $companyId" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "ALL CRUD TESTS COMPLETED!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
