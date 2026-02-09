$body = @{
    emailAddress = "noshahidevelopersinc@gmail.com"
    password     = "Noshahi.000"
    phoneNumber  = "03241642297"
    country      = "Pakistan"
} | ConvertTo-Json

Write-Host "Testing RegisterGlobalPayUser API..." -ForegroundColor Cyan
Write-Host "Payload: $body" -ForegroundColor Gray

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    $response = Invoke-RestMethod `
        -Uri 'https://localhost:44311/api/services/app/Account/RegisterGlobalPayUser' `
        -Method Post `
        -Body $body `
        -ContentType 'application/json' `
        -Headers @{ 'Abp-TenantId' = '3' } `
        -TimeoutSec 60
    
    $stopwatch.Stop()
    
    Write-Host "`n✅ SUCCESS! Registration completed in $($stopwatch.Elapsed.TotalSeconds) seconds" -ForegroundColor Green
    
    if ($response) {
        Write-Host "`nResponse:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 5
    }
    else {
        Write-Host "No response body (this is normal for void methods)" -ForegroundColor Gray
    }
    
}
catch {
    Write-Host "`n❌ ERROR occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    
    exit 1
}
