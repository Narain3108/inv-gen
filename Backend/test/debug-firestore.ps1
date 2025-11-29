
$baseUrl = "http://localhost:8000/api/v1"
$headers = @{ "Content-Type" = "application/json" }

# 1. Login to get token/user_id
$loginBody = @{
    email = "testuser1620071250@example.com" # Using the email from the previous run if possible, or create new
    password = "password123"
} | ConvertTo-Json

# We'll just create a new user to be clean
$rand = Get-Random
$email = "debug$rand@example.com"
$signupBody = @{ email = $email; password = "password123"; name = "Debug User" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST -Body $signupBody -Headers $headers
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -Headers $headers
$userId = $loginRes.localId
$headers["x-user-id"] = $userId
Write-Host "Logged in as $userId"

# 2. Create Company
$comp = Invoke-RestMethod -Uri "$baseUrl/companies" -Method POST -Body (@{name="Debug Co"} | ConvertTo-Json) -Headers $headers
$compId = $comp.id
Write-Host "Created Company $compId"

# 3. Create Product
$prodBody = @{
    product_name = "Debug Product"
    price = 100
    companyId = $compId
} | ConvertTo-Json
$prod = Invoke-RestMethod -Uri "$baseUrl/products" -Method POST -Body $prodBody -Headers $headers
$prodId = $prod.id
Write-Host "Created Product $prodId"

# 4. Try to fetch using List (which uses Collection Group OR direct collection)
# The list endpoint uses:
# if company_id: direct collection
# else: collection group
Write-Host "Fetching via Company ID (Direct Collection)..."
try {
    $list1 = Invoke-RestMethod -Uri "$baseUrl/products?companyId=$compId" -Method GET -Headers $headers
    Write-Host "Success. Count: $($list1.Count)"
    Write-Host "First Item User ID: $($list1[0].user_id)"
} catch {
    Write-Host "Failed: $($_.Exception.Message)"
}

Write-Host "Fetching via Collection Group (No Company ID)..."
try {
    $list2 = Invoke-RestMethod -Uri "$baseUrl/products" -Method GET -Headers $headers
    Write-Host "Success. Count: $($list2.Count)"
} catch {
    Write-Host "Failed: $($_.Exception.Message)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
}

# 5. Try to fetch single (Collection Group)
Write-Host "Fetching Single via ID..."
try {
    $single = Invoke-RestMethod -Uri "$baseUrl/products/$prodId" -Method GET -Headers $headers
    Write-Host "Success: $($single.name)"
} catch {
    Write-Host "Failed: $($_.Exception.Message)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
}
