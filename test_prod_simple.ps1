Write-Host "Testing PRODUCTION Registration API..." -ForegroundColor Cyan

$body = @{
    emailAddress = "noshahidevelopersinc@gmail.com"
    password     = "Noshahi.000"
    phoneNumber  = "03241642297"
    country      = "Pakistan"
} | ConvertTo-Json

Write-Host "Payload: $body"

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
    
    Write-Host "SUCCESS in $($stopwatch.Elapsed.TotalSeconds) seconds!" -ForegroundColor Green
    $response | ConvertTo-Json
    
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
