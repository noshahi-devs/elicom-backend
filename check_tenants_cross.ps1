
$baseUrl = "https://localhost:44311/api/services/app/Public"

Write-Host "Checking Tenant 2 (Prime Ship)" -ForegroundColor Cyan
$res2 = (Invoke-WebRequest -Uri "$baseUrl/GetProducts" -Headers @{ "abp-tenantid" = "2" } -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "Total Products: $($res2.result.items.Count)"

Write-Host "`nChecking Tenant 3 (Global Pay)" -ForegroundColor Cyan
$res3 = (Invoke-WebRequest -Uri "$baseUrl/GetProducts" -Headers @{ "abp-tenantid" = "3" } -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "Total Products: $($res3.result.items.Count)"

Write-Host "`nChecking Host (Tenant null)" -ForegroundColor Cyan
$res0 = (Invoke-WebRequest -Uri "$baseUrl/GetProducts" -Headers @{} -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "Total Products: $($res0.result.items.Count)"
