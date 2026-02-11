$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEwMDcxIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6IkdQX25vc2hhaGlkZXZlbG9wZXJzaW5jQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Im5vc2hhaGlkZXZlbG9wZXJzaW5jQGdtYWlsLmNvbSIsIkFzcE5ldC5JZGVudGl0eS5TZWN1cml0eVN0YW1wIjoiQ0pHWUpaR1FVRlFLSTdGQlNSUkNWM09TT0JLSk9JVUYiLCJodHRwOi8vd3d3LmFzcG5ldGJvaWxlcnBsYXRlLmNvbS9pZGVudGl0eS9jbGFpbXMvdGVuYW50SWQiOiIzIiwibmFtZSI6IlVzZXIgVXNlciIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2dpdmVubmFtZSI6IlVzZXIiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zdXJuYW1lIjoiVXNlciIsInN1YiI6IjEwMDcxIiwianRpIjoiMWI1NmUxYmUtMGYyZC00ZjY4LThkZDAtNzdlNjJiZDNiOTgwIiwiaWF0IjoxNzcwNzg0NjY0LCJuYmYiOjE3NzA3ODQ2NjQsImV4cCI6MTc3MDg3MTA2NCwiaXNzIjoiRWxpY29tIiwiYXVkIjoiRWxpY29tIn0.K0xhzzAu4wKqyOp20dyPBojBICAl9rR0wVPYysLBlFs"
$baseUrl = "http://127.0.0.1:5000"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

try {
    Write-Host "`nFetching All Card Applications..."
    $response = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/GetCardApplications" -Method Get -Headers $headers
    
    $apps = $response.result.items
    Write-Host "Found $($apps.Count) applications." -ForegroundColor Cyan
    
    # Show the most recent one
    if ($apps.Count -gt 0) {
        $recent = $apps | Sort-Object creationTime -Descending | Select-Object -First 1
        Write-Host "`nMost Recent Application:" -ForegroundColor Yellow
        $recent | ConvertTo-Json
    }
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
