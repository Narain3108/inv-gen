
$baseUrl = "http://localhost:8000/api/v1"
$headers = @{
    "Content-Type" = "application/json"
    "x-user-id" = "test-user-123"
}

Write-Host "Testing Invoice Creation with Frontend Payload..."

$payload = @{
    clientId = "client-123"
    companyId = "company-123"
    invoiceNumber = "INV-001"
    date = "2023-10-27"
    dueDate = "2023-11-27"
    items = @(
        @{
            description = "Test Item"
            quantity = 1
            unitPrice = 100
            gstRate = 18
            productId = "prod-123"
        }
    )
    status = "draft"
    paymentStatus = "unpaid"
    totalAmount = 118
    taxableAmount = 100
    cgst = 9
    sgst = 9
    igst = 0
} | ConvertTo-Json -Depth 10

Write-Host "Payload:"
Write-Host $payload

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Body $payload -Headers $headers
    Write-Host "✅ Invoice Created: $($response.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Response Body: $body" -ForegroundColor Yellow
    }
}
