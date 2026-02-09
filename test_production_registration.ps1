$body = @{
    emailAddress = "noshahidevelopersinc+test$(Get-Date -Format 'HHmmss')@gmail.com"
    password     = "Noshahi.000"
    phoneNumber  = "03241642297"
    country      = "Pakistan"
} | ConvertTo-Json

Write-Host "`n🚀 Testing PRODUCTION Registration API..." -ForegroundColor Cyan
Write-Host "Endpoint: https://app-elicom-backend.azurewebsites.net" -ForegroundColor Gray
Write-Host "Email: $($body | ConvertFrom-Json | Select-Object -ExpandProperty emailAddress)" -ForegroundColor Gray
Write-Host "`nPayload: $body`n" -ForegroundColor DarkGray

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
    
    Write-Host "SUCCESS! Registration completed in $($stopwatch.Elapsed.TotalSeconds) seconds" -ForegroundColor Green
    
    if ($response) {
        Write-Host "`nResponse:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 5
    }
    
    Write-Host "`nCheck your Gmail for the verification email from no-reply@easyfinora.com" -ForegroundColor Cyan
    
}
catch {
    Write-Host "`nERROR occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    
    exit 1
}
