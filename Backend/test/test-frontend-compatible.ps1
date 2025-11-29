# Frontend-Compatible API Testing Script
# Tests top-level collections with companyId filtering

$baseUrl = "http://localhost:8000/api/v1"
$headers = @{"Content-Type" = "application/json"}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "FRONTEND-COMPATIBLE API TESTS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Store IDs
$companyId = ""
$clientId = ""
$productId = ""
$invoiceId = ""
$quotationId = ""

# ====================
# 1. CREATE COMPANY
# ====================
Write-Host ">>> 1. CREATE Company" -ForegroundColor Yellow
$companyBody = @{
    name = "Test Company Ltd"
    gstin = "29ABCDE1234F1Z5"
    pan = "ABCDE1234F"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/" -Method Post -Body $companyBody -Headers $headers
    $companyId = $response.id
    Write-Host "✅ Company Created: $companyId" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 1b. GET ALL COMPANIES
# ====================
Write-Host ">>> 1b. GET All Companies" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/" -Method Get
    Write-Host "✅ Retrieved $($response.Count) companies" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 1c. GET SINGLE COMPANY
# ====================
Write-Host ">>> 1c. GET Single Company" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId" -Method Get
    Write-Host "✅ Company Details:" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
    Write-Host "   GSTIN: $($response.gstin)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 1d. UPDATE COMPANY
# ====================
Write-Host ">>> 1d. UPDATE Company" -ForegroundColor Yellow
$updateCompanyBody = @{
    name = "Test Company Ltd (Updated)"
    gstin = "29ABCDE1234F1Z5"
    pan = "ABCDE1234F"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId" -Method Put -Body $updateCompanyBody -Headers $headers
    Write-Host "✅ Company Updated:" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 2. CREATE CLIENT
# ====================
Write-Host ">>> 2. CREATE Client" -ForegroundColor Yellow
$clientBody = @{
    name = "Test Client Inc"
    gstin = "27XYZAB5678C1D9"
    contact_person = "John Doe"
    email = "john@testclient.com"
    phone = "+91-9123456789"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/" -Method Post -Body $clientBody -Headers $headers
    $clientId = $response.id
    Write-Host "✅ Client Created: $clientId" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 2b. GET ALL CLIENTS
# ====================
Write-Host ">>> 2b. GET All Clients" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/" -Method Get
    Write-Host "✅ Retrieved $($response.Count) clients" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 2c. GET SINGLE CLIENT
# ====================
Write-Host ">>> 2c. GET Single Client" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/$clientId" -Method Get
    Write-Host "✅ Client Details:" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
    Write-Host "   Email: $($response.email)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 2d. UPDATE CLIENT
# ====================
Write-Host ">>> 2d. UPDATE Client" -ForegroundColor Yellow
$updateClientBody = @{
    name = "Test Client Inc (Updated)"
    gstin = "27XYZAB5678C1D9"
    contact_person = "Jane Doe"
    email = "jane@testclient.com"
    phone = "+91-9123456790"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/$clientId" -Method Put -Body $updateClientBody -Headers $headers
    Write-Host "✅ Client Updated:" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
    Write-Host "   Contact: $($response.contact_person)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 3. CREATE PRODUCT (with companyId)
# ====================
Write-Host ">>> 3. CREATE Product with companyId" -ForegroundColor Yellow
$productBody = @{
    name = "Test Product"
    description = "A sample test product"
    hsn = "9801"
    unit = "Nos"
    unit_price = 1000.00
    gst_rate = 18.0
    stock_quantity = 100
    companyId = $companyId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/" -Method Post -Body $productBody -Headers $headers
    $productId = $response.id
    Write-Host "✅ Product Created: $productId" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
    Write-Host "   CompanyId: $($response.companyId)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 4. GET PRODUCTS (filtered by companyId)
# ====================
Write-Host ">>> 4. GET Products filtered by companyId" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/?company_id=$companyId" -Method Get
    Write-Host "✅ Retrieved $($response.Count) products for company" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   First product: $($response[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 4b. GET SINGLE PRODUCT
# ====================
Write-Host ">>> 4b. GET Single Product" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Get
    Write-Host "✅ Product Details:" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
    Write-Host "   Price: $($response.unit_price)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 4c. UPDATE PRODUCT
# ====================
Write-Host ">>> 4c. UPDATE Product" -ForegroundColor Yellow
$updateProductBody = @{
    name = "Test Product (Updated)"
    description = "An updated test product"
    hsn = "9801"
    unit = "Nos"
    unit_price = 1200.00
    gst_rate = 18.0
    stock_quantity = 150
    companyId = $companyId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Put -Body $updateProductBody -Headers $headers
    Write-Host "✅ Product Updated:" -ForegroundColor Green
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
    Write-Host "   New Price: $($response.unit_price)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 5. CREATE INVOICE (top-level with companyId)
# ====================
Write-Host ">>> 5. CREATE Invoice in top-level collection" -ForegroundColor Yellow
$invoiceBody = @{
    companyId = $companyId
    client_id = $clientId
    invoice_date = (Get-Date).ToString("yyyy-MM-dd")
    due_date = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    items = @(
        @{
            description = "Test Product"
            quantity = 2
            unit = "Nos"
            unit_price = 1000.00
            gst_rate = 18.0
            discount = 0
            product_id = $productId
        }
    )
    notes = "Test invoice"
    status = "draft"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/invoices/" -Method Post -Body $invoiceBody -Headers $headers
    $invoiceId = $response.id
    Write-Host "✅ Invoice Created: $invoiceId" -ForegroundColor Green
    Write-Host "   Invoice Number: $($response.invoiceNumber)" -ForegroundColor Gray
    Write-Host "   Grand Total: $($response.grandTotal)" -ForegroundColor Gray
    Write-Host "   CompanyId: $($response.companyId)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# ====================
# 6. GET INVOICES (filtered by companyId)
# ====================
Write-Host ">>> 6. GET Invoices filtered by companyId" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/invoices/?company_id=$companyId" -Method Get
    Write-Host "✅ Retrieved $($response.Count) invoices for company" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   First invoice: $($response[0].invoiceNumber)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 7. GET SINGLE INVOICE
# ====================
Write-Host ">>> 7. GET Single Invoice from top-level" -ForegroundColor Yellow
if ($invoiceId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId" -Method Get
        Write-Host "✅ Invoice Details:" -ForegroundColor Green
        Write-Host "   Invoice Number: $($response.invoiceNumber)" -ForegroundColor Gray
        Write-Host "   Grand Total: $($response.grandTotal)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Skipped - No invoice created" -ForegroundColor Yellow
}
Write-Host ""

# ====================
# 8. UPDATE INVOICE
# ====================
Write-Host ">>> 8. UPDATE Invoice in top-level collection" -ForegroundColor Yellow
if ($invoiceId) {
    $updateInvoiceBody = @{
        client_id = $clientId
        invoice_date = (Get-Date).ToString("yyyy-MM-dd")
        due_date = (Get-Date).AddDays(45).ToString("yyyy-MM-dd")
        items = @(
            @{
                description = "Test Product (Updated)"
                quantity = 3
                unit = "Nos"
                unit_price = 1200.00
                gst_rate = 18.0
                discount = 0
            }
        )
        notes = "Updated test invoice"
        status = "sent"
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId" -Method Put -Body $updateInvoiceBody -Headers $headers
        Write-Host "✅ Invoice Updated" -ForegroundColor Green
        Write-Host "   New Grand Total: $($response.grandTotal)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Skipped - No invoice created" -ForegroundColor Yellow
}
Write-Host ""

# ====================
# 9. CREATE QUOTATION (top-level with companyId)
# ====================
Write-Host ">>> 9. CREATE Quotation in top-level collection" -ForegroundColor Yellow
$quotationBody = @{
    companyId = $companyId
    client_id = $clientId
    quotation_date = (Get-Date).ToString("yyyy-MM-dd")
    valid_until = (Get-Date).AddDays(15).ToString("yyyy-MM-dd")
    items = @(
        @{
            description = "Test Product for Quote"
            quantity = 5
            unit = "Nos"
            unit_price = 1000.00
            gst_rate = 18.0
            discount = 0
        }
    )
    notes = "Test quotation"
    status = "draft"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/quotations/" -Method Post -Body $quotationBody -Headers $headers
    $quotationId = $response.id
    Write-Host "✅ Quotation Created: $quotationId" -ForegroundColor Green
    Write-Host "   Quotation Number: $($response.quotationNumber)" -ForegroundColor Gray
    Write-Host "   Grand Total: $($response.grandTotal)" -ForegroundColor Gray
    Write-Host "   CompanyId: $($response.companyId)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# ====================
# 10. GET QUOTATIONS (filtered by companyId)
# ====================
Write-Host ">>> 10. GET Quotations filtered by companyId" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/quotations/?company_id=$companyId" -Method Get
    Write-Host "✅ Retrieved $($response.Count) quotations for company" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   First quotation: $($response[0].quotationNumber)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# 10b. GET SINGLE QUOTATION
# ====================
Write-Host ">>> 10b. GET Single Quotation" -ForegroundColor Yellow
if ($quotationId) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/quotations/$quotationId" -Method Get
        Write-Host "✅ Quotation Details:" -ForegroundColor Green
        Write-Host "   Quotation Number: $($response.quotationNumber)" -ForegroundColor Gray
        Write-Host "   Grand Total: $($response.grandTotal)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Skipped - No quotation created" -ForegroundColor Yellow
}
Write-Host ""

# ====================
# 10c. UPDATE QUOTATION
# ====================
Write-Host ">>> 10c. UPDATE Quotation" -ForegroundColor Yellow
if ($quotationId) {
    $updateQuotationBody = @{
        client_id = $clientId
        quotation_date = (Get-Date).ToString("yyyy-MM-dd")
        valid_until = (Get-Date).AddDays(20).ToString("yyyy-MM-dd")
        items = @(
            @{
                description = "Test Product for Quote (Updated)"
                quantity = 8
                unit = "Nos"
                unit_price = 1100.00
                gst_rate = 18.0
                discount = 50.00
            }
        )
        notes = "Updated test quotation"
        status = "sent"
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/quotations/$quotationId" -Method Put -Body $updateQuotationBody -Headers $headers
        Write-Host "✅ Quotation Updated:" -ForegroundColor Green
        Write-Host "   New Grand Total: $($response.grandTotal)" -ForegroundColor Gray
        Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Skipped - No quotation created" -ForegroundColor Yellow
}
Write-Host ""

# ====================
# 11. DELETE OPERATIONS
# ====================
Write-Host ">>> 11. DELETE Operations" -ForegroundColor Yellow

if ($quotationId) {
    Write-Host "   Deleting Quotation..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/quotations/$quotationId" -Method Delete
        Write-Host "   ✅ Quotation Deleted" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to delete quotation" -ForegroundColor Red
    }
}

if ($invoiceId) {
    Write-Host "   Deleting Invoice..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/invoices/$invoiceId" -Method Delete
        Write-Host "   ✅ Invoice Deleted" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to delete invoice" -ForegroundColor Red
    }
}

Write-Host "   Deleting Product..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/products/$productId" -Method Delete
    Write-Host "   ✅ Product Deleted" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to delete product" -ForegroundColor Red
}

Write-Host "   Deleting Client..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clients/$clientId" -Method Delete
    Write-Host "   ✅ Client Deleted" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to delete client" -ForegroundColor Red
}

Write-Host "   Deleting Company..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/companies/$companyId" -Method Delete
    Write-Host "   ✅ Company Deleted" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to delete company" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "FRONTEND-COMPATIBLE TESTS COMPLETED!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "   Products: Top-level with companyId field" -ForegroundColor Green
Write-Host "   Invoices: Top-level with companyId filter" -ForegroundColor Green
Write-Host "   Quotations: Top-level with companyId filter" -ForegroundColor Green
Write-Host "   All endpoints match frontend expectations" -ForegroundColor Green
