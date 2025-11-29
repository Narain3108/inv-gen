# Firestore API Testing Script - PowerShell
# Tests Firestore-based FastAPI endpoints

$BASE_URL = "http://localhost:8000/api/v1"
$headers = @{"Content-Type" = "application/json"}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing Firestore API" -ForegroundColor Cyan
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
Write-Host "2. Creating User in Firestore..." -ForegroundColor Yellow
$userPayload = @{
    email = "test@example.com"
    name = "Test User"
    photo_url = "https://example.com/photo.jpg"
} | ConvertTo-Json

try {
    $user = Invoke-RestMethod -Uri "$BASE_URL/users" -Method Post -Body $userPayload -Headers $headers
    $userId = $user.id
    Write-Host "✓ User Created in Firestore: $userId" -ForegroundColor Green
    Write-Host $($user | ConvertTo-Json)
} catch {
    Write-Host "✗ User Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Users List
Write-Host "3. Getting Users List from Firestore..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$BASE_URL/users" -Method Get
    Write-Host "✓ Users Retrieved: $($users.Count) users" -ForegroundColor Green
    Write-Host $($users | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "✗ Get Users Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Single User
Write-Host "4. Getting Single User from Firestore..." -ForegroundColor Yellow
if ($userId) {
    try {
        $singleUser = Invoke-RestMethod -Uri "$BASE_URL/users/$userId" -Method Get
        Write-Host "✓ User Retrieved: $($singleUser.name)" -ForegroundColor Green
        Write-Host $($singleUser | ConvertTo-Json)
    } catch {
        Write-Host "✗ Get User Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Skipping - no user ID available" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Update User
Write-Host "5. Updating User in Firestore..." -ForegroundColor Yellow
if ($userId) {
    $updatePayload = @{
        email = "updated@example.com"
        name = "Updated Test User"
        photo_url = "https://example.com/new-photo.jpg"
    } | ConvertTo-Json

    try {
        $updatedUser = Invoke-RestMethod -Uri "$BASE_URL/users/$userId" -Method Put -Body $updatePayload -Headers $headers
        Write-Host "✓ User Updated: $($updatedUser.name)" -ForegroundColor Green
        Write-Host $($updatedUser | ConvertTo-Json)
    } catch {
        Write-Host "✗ User Update Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Skipping - no user ID available" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: Create Another User
Write-Host "6. Creating Another User..." -ForegroundColor Yellow
$user2Payload = @{
    email = "user2@example.com"
    name = "Second User"
} | ConvertTo-Json

try {
    $user2 = Invoke-RestMethod -Uri "$BASE_URL/users" -Method Post -Body $user2Payload -Headers $headers
    $userId2 = $user2.id
    Write-Host "✓ Second User Created: $userId2" -ForegroundColor Green
    Write-Host $($user2 | ConvertTo-Json)
} catch {
    Write-Host "✗ Second User Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: List All Users
Write-Host "7. Listing All Users..." -ForegroundColor Yellow
try {
    $allUsers = Invoke-RestMethod -Uri "$BASE_URL/users?limit=100" -Method Get
    Write-Host "✓ Total Users in Firestore: $($allUsers.Count)" -ForegroundColor Green
    foreach ($u in $allUsers) {
        Write-Host "  - $($u.name) ($($u.email))" -ForegroundColor White
    }
} catch {
    Write-Host "✗ List All Users Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Delete User
Write-Host "8. Deleting User from Firestore..." -ForegroundColor Yellow
if ($userId2) {
    try {
        $deleteResponse = Invoke-RestMethod -Uri "$BASE_URL/users/$userId2" -Method Delete
        Write-Host "✓ User Deleted: $($deleteResponse.message)" -ForegroundColor Green
        Write-Host $($deleteResponse | ConvertTo-Json)
    } catch {
        Write-Host "✗ User Deletion Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Skipping - no user ID available" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Firestore API Testing Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Created User ID: $userId" -ForegroundColor White
Write-Host "- Using Database: Firebase Firestore" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Check Firestore Console: https://console.firebase.google.com/project/bill-6a1a2/firestore" -ForegroundColor Cyan
