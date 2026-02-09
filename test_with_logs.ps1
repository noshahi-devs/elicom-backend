Write-Host "`n🧪 Testing PRODUCTION Registration with Enhanced Logging..." -ForegroundColor Cyan

$body = @{
    emailAddress = "noshahidevelopersinc+test2@gmail.com"
    password     = "Noshahi.000"
    phoneNumber  = "03241642297"
    country      = "Pakistan"
} | ConvertTo-Json

Write-Host "Email: noshahidevelopersinc+test2@gmail.com" -ForegroundColor Yellow

try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    $response = Invoke-RestMethod `
        -Uri 'https://app-elicom-backend.azurewebsites.net/api/services/app/Account/RegisterGlobalPayUser' `
        -Method Post `
        -Body $body `
        -ContentType 'application/json' `
        -Headers @{ 'Abp-TenantId' = '3' } `
        -TimeoutSec 60
    
    $stopwatch.Stop()
    
    Write-Host "SUCCESS in $($stopwatch.Elapsed.TotalSeconds) seconds" -ForegroundColor Green
    Write-Host "`nNow checking Azure logs for SMTP details..." -ForegroundColor Cyan
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
