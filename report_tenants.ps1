
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{ "abp-tenantid" = "2"; "accept" = "application/json" }

Write-Host "Tenant Identification for Products" -ForegroundColor Cyan
$categories = (Invoke-WebRequest -Uri "$baseUrl/GetCategories" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result | Select-Object -ExpandProperty items

$report = foreach ($cat in $categories) {
    if ([string]::IsNullOrEmpty($cat.slug) -or $cat.slug -eq "null") { continue }
    $products = (Invoke-WebRequest -Uri "$baseUrl/GetProductsByCategory?categorySlug=$($cat.slug)" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result
    foreach ($p in $products) {
        [PSCustomObject]@{
            ProductName    = $p.name
            Category       = $cat.name
            SupplierTenant = if ($p.supplierTenantId -eq $null) { "Host/Shared" } else { $p.supplierTenantId }
            Price          = $p.resellerMaxPrice
        }
    }
}

$report | Sort-Object SupplierTenant | Format-Table -AutoSize
