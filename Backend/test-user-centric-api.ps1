# User-Centric API Test Script
# Tests the full flow: Auth -> Global Resources -> Nested Resources

$baseUrl = "http://localhost:8000/api/v1"
$headers = @{
    "Content-Type" = "application/json"
}

# Helper function to print status
function Print-Status {
    param($step, $msg, $success)
    if ($success) {
        Write-Host "[$step] SUCCESS: $msg" -ForegroundColor Green
    } else {
        Write-Host "[$step] FAILED: $msg" -ForegroundColor Red
    }
}

# Helper function to make requests
function Invoke-Api {
    param($method, $endpoint, $body = $null)
    # Write-Host "DEBUG: Invoke-Api $method $endpoint" -ForegroundColor DarkGray
    try {
        $params = @{
            Uri = "$baseUrl$endpoint"
            Method = $method
            Headers = $headers
            ErrorAction = "Stop"
        }
        if ($body) {
            $params.Body = $body
        }
        return Invoke-RestMethod @params
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        }
        Write-Host "API Call Failed: $method $endpoint - $errorMsg" -ForegroundColor Red
        return $null
    }
}

Write-Host "STARTING USER-CENTRIC API TESTS..." -ForegroundColor Cyan

# ---------------------------------------------------------
# 1. AUTHENTICATION
# ---------------------------------------------------------
$rand = Get-Random
$email = "testuser$rand@example.com"
$password = "password123"

Write-Host "`n1. AUTHENTICATION" -ForegroundColor Yellow

# Signup
$signupBody = @{
    email = $email
    password = $password
    name = "Test User"
} | ConvertTo-Json

$signupRes = Invoke-Api "POST" "/auth/signup" $signupBody
if ($signupRes) {
    Print-Status "Signup" "User created: $email" $true
} else {
    exit
}

# Login
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$loginRes = Invoke-Api "POST" "/auth/login" $loginBody
if ($loginRes) {
    $userId = $loginRes.localId
    Print-Status "Login" "Logged in as User ID: $userId" $true
    
    # Add Auth Header for subsequent requests
    $headers["x-user-id"] = $userId
} else {
    exit
}

# Get Profile
$profileRes = Invoke-Api "GET" "/users/me"
if ($profileRes -and $profileRes.email -eq $email) {
    Print-Status "Profile" "Fetched user profile" $true
}

# ---------------------------------------------------------
# 2. GLOBAL RESOURCES (Companies, Clients, Categories)
# ---------------------------------------------------------
Write-Host "`n2. GLOBAL RESOURCES" -ForegroundColor Yellow

# --- Company ---
$companyBody = @{
    name = "Tech Corp $rand"
    gstin = "29ABCDE1234F1Z5"
    address = @{
        line1 = "123 Tech Park"
        city = "Bangalore"
    }
} | ConvertTo-Json

$company = Invoke-Api "POST" "/companies" $companyBody
if ($company) {
    $companyId = $company.id
    Print-Status "Company" "Created Company ID: $companyId" $true
} else {
    exit
}

# --- Client ---
$clientBody = @{
    clientName = "Client One"
    email = "client@one.com"
    companyId = $companyId
} | ConvertTo-Json

$client = Invoke-Api "POST" "/clients" $clientBody
if ($client) {
    $clientId = $client.id
    Print-Status "Client" "Created Client ID: $clientId" $true
}

# --- Category ---
$catBody = @{
    categoryName = "Electronics"
    description = "Gadgets"
} | ConvertTo-Json

$category = Invoke-Api "POST" "/product-categories" $catBody
if ($category) {
    $categoryId = $category.id
    Print-Status "Category" "Created Category ID: $categoryId" $true
}

# ---------------------------------------------------------
# 3. NESTED RESOURCES (Products, Invoices, Quotations)
# ---------------------------------------------------------
Write-Host "`n3. NESTED RESOURCES" -ForegroundColor Yellow

# --- Product ---
$productBody = @{
    product_name = "Laptop Pro"
    price = 50000
    companyId = $companyId
    categoryId = $categoryId
} | ConvertTo-Json

$product = Invoke-Api "POST" "/products" $productBody
if ($product) {
    $productId = $product.id
    Print-Status "Product" "Created Product ID: $productId (Nested under Company)" $true
}

# --- Invoice ---
$invoiceBody = @{
    companyId = $companyId
    clientId = $clientId
    invoiceNumber = "INV-001"
    date = (Get-Date).ToString("yyyy-MM-dd")
    items = @(
        @{
            description = "Laptop Pro"
            quantity = 1
            unitPrice = 50000
            productId = $productId
        }
    )
} | ConvertTo-Json -Depth 5

$invoice = Invoke-Api "POST" "/invoices" $invoiceBody
if ($invoice) {
    $invoiceId = $invoice.id
    Print-Status "Invoice" "Created Invoice ID: $invoiceId (Nested under Company)" $true
}

# --- Quotation ---
$quoteBody = @{
    companyId = $companyId
    clientId = $clientId
    quotationNumber = "QUO-001"
    items = @(
        @{
            description = "Laptop Pro"
            quantity = 2
            unitPrice = 50000
        }
    )
} | ConvertTo-Json -Depth 5

$quote = Invoke-Api "POST" "/quotations" $quoteBody
if ($quote) {
    $quoteId = $quote.id
    Print-Status "Quotation" "Created Quotation ID: $quoteId (Nested under Company)" $true
}

# --- Customization ---
$custBody = @{
    invoicePrefix = "INV-TEST"
    themeColor = "#FF0000"
} | ConvertTo-Json

$cust = Invoke-Api "POST" "/companies/$companyId/customizations" $custBody
if ($cust) {
    Print-Status "Customization" "Created/Updated Customization for Company" $true
}

# ---------------------------------------------------------
# 4. VERIFICATION & UPDATES
# ---------------------------------------------------------
Write-Host "`n4. VERIFICATION & UPDATES" -ForegroundColor Yellow

# List Products for Company
$products = Invoke-Api "GET" "/products?companyId=$companyId"
if ($products -and $products.Count -ge 1) {
    Print-Status "List Products" "Found $($products.Count) products for company" $true
}

# Update Product
$updateProdBody = @{
    product_name = "Laptop Pro Max"
    price = 60000
    companyId = $companyId # Required for validation
} | ConvertTo-Json

$endpoint = "/products/" + $productId + "?companyId=" + $companyId
$updatedProd = Invoke-Api "PUT" $endpoint $updateProdBody
if ($updatedProd -and $updatedProd.productName -eq "Laptop Pro Max") {
    Print-Status "Update Product" "Updated product name successfully" $true
}

# Get Invoice by ID (Direct Query with Company ID)
if (-not $invoiceId) {
    Print-Status "Get Invoice" "Skipping - Invoice ID is missing" $false
} else {
    $endpoint = "/invoices/" + $invoiceId + "?companyId=" + $companyId
    $fetchedInvoice = Invoke-Api "GET" $endpoint
    if ($fetchedInvoice -and $fetchedInvoice.id -eq $invoiceId) {
        Print-Status "Get Invoice" "Fetched invoice by ID (Direct Query)" $true
    }
}

# ---------------------------------------------------------
# 5. CLEANUP (DELETE)
# ---------------------------------------------------------
Write-Host "`n5. CLEANUP" -ForegroundColor Yellow

# Delete Invoice
if ($invoiceId) {
    $endpoint = "/invoices/" + $invoiceId + "?companyId=" + $companyId
    $delInv = Invoke-Api "DELETE" $endpoint
    if ($delInv) { Print-Status "Delete Invoice" "Deleted Invoice" $true }
}

# Delete Product
if ($productId) {
    $endpoint = "/products/" + $productId + "?companyId=" + $companyId
    $delProd = Invoke-Api "DELETE" $endpoint
    if ($delProd) { Print-Status "Delete Product" "Deleted Product" $true }
}

# Delete Company
$delComp = Invoke-Api "DELETE" "/companies/$companyId"
if ($delComp) { Print-Status "Delete Company" "Deleted Company" $true }

Write-Host "`nTESTS COMPLETED." -ForegroundColor Cyan
