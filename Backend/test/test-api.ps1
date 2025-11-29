# API Testing Script - PowerShell
# Tests all FastAPI endpoints

$BASE_URL = "http://localhost:8000/api/v1"
$headers = @{"Content-Type" = "application/json"}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing Invoice Management API" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
    Write-Host "✓ Health Check: $($response.status)" -ForegroundColor Green
    Write-Host $($response | ConvertTo-Json)
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Create User
Write-Host "2. Creating User..." -ForegroundColor Yellow
$userPayload = @{
    email = "test@example.com"
    name = "Test User"
    photo_url = "https://example.com/photo.jpg"
} | ConvertTo-Json

try {
    $user = Invoke-RestMethod -Uri "$BASE_URL/users" -Method Post -Body $userPayload -Headers $headers
    $userId = $user.id
    Write-Host "✓ User Created: $userId" -ForegroundColor Green
    Write-Host $($user | ConvertTo-Json)
} catch {
    Write-Host "✗ User Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Users List
Write-Host "3. Getting Users List..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$BASE_URL/users" -Method Get
    Write-Host "✓ Users Retrieved: $($users.total) users" -ForegroundColor Green
    Write-Host $($users | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Get Users Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Create Company
Write-Host "4. Creating Company..." -ForegroundColor Yellow
$companyPayload = @{
    user_id = $userId
    name = "Test Company Ltd"
    gstin = "27AAAAA1234A1Z5"
    pan = "AAAAA1234A"
    address = @{
        line1 = "123 Main Street"
        line2 = "Floor 2"
        city = "Mumbai"
        state = "Maharashtra"
        pincode = "400001"
        country = "India"
    }
    contact = @{
        email = "company@test.com"
        phone = "+91-9876543210"
        website = "https://testcompany.com"
    }
    bank_details = @{
        bank_name = "HDFC Bank"
        account_number = "1234567890"
        ifsc_code = "HDFC0001234"
        branch = "Mumbai Branch"
    }
} | ConvertTo-Json -Depth 5

try {
    $company = Invoke-RestMethod -Uri "$BASE_URL/companies" -Method Post -Body $companyPayload -Headers $headers
    $companyId = $company.id
    Write-Host "✓ Company Created: $companyId" -ForegroundColor Green
    Write-Host $($company | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Company Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Create Client
Write-Host "5. Creating Client..." -ForegroundColor Yellow
$clientPayload = @{
    company_id = $companyId
    name = "Test Client"
    gstin = "29BBBBB5678B1Z6"
    contact_person = "John Doe"
    email = "client@test.com"
    phone = "+91-9876543211"
    addresses = @(
        @{
            line1 = "456 Client Street"
            city = "Bangalore"
            state = "Karnataka"
            pincode = "560001"
            country = "India"
            is_default = $true
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $client = Invoke-RestMethod -Uri "$BASE_URL/clients" -Method Post -Body $clientPayload -Headers $headers
    $clientId = $client.id
    Write-Host "✓ Client Created: $clientId" -ForegroundColor Green
    Write-Host $($client | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Client Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Create Product Category
Write-Host "6. Creating Product Category..." -ForegroundColor Yellow
$categoryPayload = @{
    name = "Electronics"
    description = "Electronic items"
} | ConvertTo-Json

try {
    $category = Invoke-RestMethod -Uri "$BASE_URL/products/categories" -Method Post -Body $categoryPayload -Headers $headers
    $categoryId = $category.id
    Write-Host "✓ Category Created: $categoryId" -ForegroundColor Green
    Write-Host $($category | ConvertTo-Json)
} catch {
    Write-Host "✗ Category Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Create Product
Write-Host "7. Creating Product..." -ForegroundColor Yellow
$productPayload = @{
    company_id = $companyId
    category_id = $categoryId
    name = "Laptop"
    description = "Dell Laptop"
    hsn = "84713000"
    unit = "Nos"
    unit_price = 50000.00
    gst_rate = 18.0
    stock_quantity = 10
} | ConvertTo-Json

try {
    $product = Invoke-RestMethod -Uri "$BASE_URL/products" -Method Post -Body $productPayload -Headers $headers
    $productId = $product.id
    Write-Host "✓ Product Created: $productId" -ForegroundColor Green
    Write-Host $($product | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Product Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Create Invoice
Write-Host "8. Creating Invoice..." -ForegroundColor Yellow
$invoicePayload = @{
    company_id = $companyId
    client_id = $clientId
    date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    due_date = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss")
    items = @(
        @{
            description = "Laptop - Dell Inspiron"
            hsn = "84713000"
            quantity = 2
            unit = "Nos"
            unit_price = 50000.00
            discount = 1000.00
            gst_rate = 18.0
            cess_rate = 0
        },
        @{
            description = "Mouse - Wireless"
            hsn = "84716000"
            quantity = 2
            unit = "Nos"
            unit_price = 500.00
            discount = 0
            gst_rate = 18.0
            cess_rate = 0
        }
    )
    notes = "Payment terms: Net 30 days"
} | ConvertTo-Json -Depth 5

try {
    $invoice = Invoke-RestMethod -Uri "$BASE_URL/invoices" -Method Post -Body $invoicePayload -Headers $headers
    $invoiceId = $invoice.id
    Write-Host "✓ Invoice Created: $($invoice.invoice_number)" -ForegroundColor Green
    Write-Host "  Total Amount: $($invoice.total_amount)" -ForegroundColor Cyan
    Write-Host "  CGST: $($invoice.cgst_total)" -ForegroundColor Cyan
    Write-Host "  SGST: $($invoice.sgst_total)" -ForegroundColor Cyan
    Write-Host "  Grand Total: $($invoice.grand_total)" -ForegroundColor Cyan
    Write-Host $($invoice | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Invoice Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: Get Invoice with Items
Write-Host "9. Getting Invoice Details..." -ForegroundColor Yellow
try {
    $invoiceDetails = Invoke-RestMethod -Uri "$BASE_URL/invoices/$invoiceId" -Method Get
    Write-Host "✓ Invoice Retrieved: $($invoiceDetails.invoice_number)" -ForegroundColor Green
    Write-Host "  Items Count: $($invoiceDetails.items.Count)" -ForegroundColor Cyan
    Write-Host $($invoiceDetails | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Get Invoice Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 10: Record Payment
Write-Host "10. Recording Payment..." -ForegroundColor Yellow
$paymentPayload = @{
    amount = 50000.00
    date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    mode = "UPI"
    reference = "UPI-123456789"
    notes = "Partial payment received"
} | ConvertTo-Json

try {
    $payment = Invoke-RestMethod -Uri "$BASE_URL/invoices/$invoiceId/payments" -Method Post -Body $paymentPayload -Headers $headers
    Write-Host "✓ Payment Recorded: $($payment.amount)" -ForegroundColor Green
    Write-Host $($payment | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Payment Recording Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 11: Get Invoice Payments
Write-Host "11. Getting Invoice Payments..." -ForegroundColor Yellow
try {
    $payments = Invoke-RestMethod -Uri "$BASE_URL/invoices/$invoiceId/payments" -Method Get
    Write-Host "✓ Payments Retrieved: $($payments.Count) payments" -ForegroundColor Green
    Write-Host $($payments | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Get Payments Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 12: Create Quotation
Write-Host "12. Creating Quotation..." -ForegroundColor Yellow
$quotationPayload = @{
    company_id = $companyId
    client_id = $clientId
    date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    valid_until = (Get-Date).AddDays(15).ToString("yyyy-MM-ddTHH:mm:ss")
    items = @(
        @{
            description = "Server Setup"
            hsn = "99830000"
            quantity = 1
            unit = "Service"
            unit_price = 100000.00
            discount = 5000.00
            gst_rate = 18.0
            cess_rate = 0
        }
    )
    notes = "Quotation valid for 15 days"
} | ConvertTo-Json -Depth 5

try {
    $quotation = Invoke-RestMethod -Uri "$BASE_URL/quotations" -Method Post -Body $quotationPayload -Headers $headers
    $quotationId = $quotation.id
    Write-Host "✓ Quotation Created: $($quotation.quotation_number)" -ForegroundColor Green
    Write-Host "  Total Amount: $($quotation.total_amount)" -ForegroundColor Cyan
    Write-Host "  Grand Total: $($quotation.grand_total)" -ForegroundColor Cyan
    Write-Host $($quotation | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Quotation Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 13: Convert Quotation to Invoice
Write-Host "13. Converting Quotation to Invoice..." -ForegroundColor Yellow
try {
    $convertedInvoice = Invoke-RestMethod -Uri "$BASE_URL/quotations/$quotationId/convert" -Method Post -Headers $headers
    Write-Host "✓ Quotation Converted: $($convertedInvoice.invoice_number)" -ForegroundColor Green
    Write-Host $($convertedInvoice | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Quotation Conversion Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 14: List Invoices with Filters
Write-Host "14. Listing Invoices (with filters)..." -ForegroundColor Yellow
try {
    $invoices = Invoke-RestMethod -Uri "$BASE_URL/invoices?company_id=$companyId&skip=0&limit=10" -Method Get
    Write-Host "✓ Invoices Retrieved: $($invoices.total) invoices" -ForegroundColor Green
    Write-Host $($invoices | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ List Invoices Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 15: Create Customization
Write-Host "15. Creating Invoice Customization..." -ForegroundColor Yellow
$customizationPayload = @{
    company_id = $companyId
    type = "invoice"
    payload = @{
        template = "modern"
        colors = @{
            primary = "#2563eb"
            secondary = "#64748b"
        }
        font = "Inter"
        show_logo = $true
        show_signature = $false
    }
} | ConvertTo-Json -Depth 5

try {
    $customization = Invoke-RestMethod -Uri "$BASE_URL/customizations" -Method Post -Body $customizationPayload -Headers $headers
    Write-Host "✓ Customization Created: $($customization.id)" -ForegroundColor Green
    Write-Host $($customization | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "✗ Customization Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 16: Update Stock
Write-Host "16. Updating Product Stock..." -ForegroundColor Yellow
$stockPayload = @{
    quantity_change = -2
    notes = "Sold 2 units"
} | ConvertTo-Json

try {
    $updatedProduct = Invoke-RestMethod -Uri "$BASE_URL/products/$productId/stock" -Method Post -Body $stockPayload -Headers $headers
    Write-Host "✓ Stock Updated: $($updatedProduct.stock_quantity) units remaining" -ForegroundColor Green
    Write-Host $($updatedProduct | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Stock Update Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "API Testing Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- User ID: $userId" -ForegroundColor White
Write-Host "- Company ID: $companyId" -ForegroundColor White
Write-Host "- Client ID: $clientId" -ForegroundColor White
Write-Host "- Product ID: $productId" -ForegroundColor White
Write-Host "- Invoice ID: $invoiceId" -ForegroundColor White
Write-Host "- Quotation ID: $quotationId" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
