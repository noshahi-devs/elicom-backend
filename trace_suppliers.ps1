
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{ "abp-tenantid" = "2"; "accept" = "application/json" }

$slug = "electronics"
$products = (Invoke-WebRequest -Uri "$baseUrl/GetProductsByCategory?categorySlug=$slug" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result

Write-Host "Product | SupplierID | TenantID"
foreach ($p in $products) {
    Write-Host "$($p.name) | $($p.supplierId) | $($p.supplierTenantId)"
}
