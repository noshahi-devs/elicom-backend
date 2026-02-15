$body = @{
    fullName     = "Adeel Noshahi"
    emailAddress = "prismaticadeel@gmail.com"
    password     = "Noshahi.000"
    phoneNumber  = "03281642297"
    country      = "Pakistan"
} | ConvertTo-Json

Write-Host "🚀 Testing Prime Ship Seller Registration..." -ForegroundColor Cyan
Write-Host "Data: Adeel Noshahi <prismaticadeel@gmail.com>" -ForegroundColor Gray

try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    $response = Invoke-RestMethod `
        -Uri 'https://app-elicom-backend.azurewebsites.net/api/services/app/Account/RegisterPrimeShipSeller' `
        -Method Post `
        -Body $body `
        -ContentType 'application/json' `
        -Headers @{ 'Abp-TenantId' = '2' } `
        -TimeoutSec 120
    
    $stopwatch.Stop()
    
    Write-Host "`n✅ SUCCESS! Registration completed in $($stopwatch.Elapsed.TotalSeconds) seconds" -ForegroundColor Green
    
    if ($response) {
        $response | ConvertTo-Json -Depth 5
    }
}
catch {
    Write-Host "`n❌ FAILED with status code: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "`nDetails: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
