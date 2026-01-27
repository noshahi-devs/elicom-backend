
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{ "abp-tenantid" = "2"; "accept" = "application/json" }

Write-Host "Diagnostic for 'digitalproductsalibhai'" -ForegroundColor Cyan
$slug = "digitalproductsalibhai"
$products = (Invoke-WebRequest -Uri "$baseUrl/GetProductsByCategory?categorySlug=$slug" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result

Write-Host "Found $($products.Count) products."
foreach ($p in $products) {
    Write-Host "Product: $($p.name) | CategoryID: $($p.categoryId) | CategoryName: $($p.categoryName)"
}

Write-Host "`nDiagnostic for Categories" -ForegroundColor Cyan
$catResult = (Invoke-WebRequest -Uri "$baseUrl/GetCategories" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result | Select-Object -ExpandProperty items
$targetCat = $catResult | Where-Object { $_.slug -eq $slug -or $_.name -like "*Digital Products*" }

foreach ($tc in $targetCat) {
    Write-Host "Category Entry: $($tc.name) | ID: $($tc.id) | SidebarCount: $($tc.productCount) | Slug: $($tc.slug)"
}
