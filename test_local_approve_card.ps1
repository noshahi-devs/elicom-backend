$applicationId = "8c005e61-50d5-48db-0127-08de6947f37e"
$baseUrl = "http://127.0.0.1:5000"

$headers = @{
    "Content-Type" = "application/json"
}

$payload = @{
    applicationId = $applicationId
    reviewNotes   = "Approved locally for verification"
} | ConvertTo-Json

try {
    Write-Host "`nApproving Card Application ID: $applicationId..."
    $result = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/ApproveApplication" -Method Post -Headers $headers -Body $payload
    
    Write-Host "SUCCESS: Application Approved" -ForegroundColor Green
    Write-Host "Card ID: $($result.result.cardId)"
    Write-Host "Card Number: $($result.result.cardNumber)"
}
catch {
    Write-Host "`nERROR: Approval Failed" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response: $errorBody"
    }
    else {
        Write-Host "Message: $($_.Exception.Message)"
    }
}
