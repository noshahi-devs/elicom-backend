$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEwMDcxIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6IkdQX25vc2hhaGlkZXZlbG9wZXJzaW5jQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Im5vc2hhaGlkZXZlbG9wZXJzaW5jQGdtYWlsLmNvbSIsIkFzcE5ldC5JZGVudGl0eS5TZWN1cml0eVN0YW1wIjoiQ0pHWUpaR1FVRlFLSTdGQlNSUkNWM09TT0JLSk9JVUYiLCJodHRwOi8vd3d3LmFzcG5ldGJvaWxlcnBsYXRlLmNvbS9pZGVudGl0eS9jbGFpbXMvdGVuYW50SWQiOiIzIiwibmFtZSI6IlVzZXIgVXNlciIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2dpdmVubmFtZSI6IlVzZXIiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zdXJuYW1lIjoiVXNlciIsInN1YiI6IjEwMDcxIiwianRpIjoiMWI1NmUxYmUtMGYyZC00ZjY4LThkZDAtNzdlNjJiZDNiOTgwIiwiaWF0IjoxNzcwNzg0NjY0LCJuYmYiOjE3NzA3ODQ2NjQsImV4cCI6MTc3MDg3MTA2NCwiaXNzIjoiRWxpY29tIiwiYXVkIjoiRWxpY29tIn0.K0xhzzAu4wKqyOp20dyPBojBICAl9rR0wVPYysLBlFs"
$baseUrl = "http://127.0.0.1:5000"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

try {
    # Submit new application
    $uniqueName = "Test User Local IPv4 " + (Get-Date -Format "HH:mm:ss")
    $payload = @{
        fullName       = $uniqueName
        contactNumber  = "03001234567"
        address        = "123 Test Street, Localhost IPv4"
        cardType       = "Visa"
        documentBase64 = "U01BUlQgU1RPUkUgVEVTVCBET0NVTUVOVA==" 
        documentType   = "pdf"
    } | ConvertTo-Json

    Write-Host "`nSubmitting new Card Application..."
    $submitResult = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/SubmitCardApplication" -Method Post -Headers $headers -Body $payload
    
    Write-Host "SUCCESS: Card Application Submitted" -ForegroundColor Green
    Write-Host "Application ID: $($submitResult.result.id)"
    Write-Host "Status: $($submitResult.result.status)"
}
catch {
    Write-Host "`nERROR: Request Failed" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response: $errorBody"
    }
    else {
        Write-Host "Message: $($_.Exception.Message)"
    }
}
