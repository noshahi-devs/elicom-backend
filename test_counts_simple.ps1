
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{ "abp-tenantid" = "2"; "accept" = "application/json" }
$categories = (Invoke-WebRequest -Uri "$baseUrl/GetCategories" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result | Select-Object -ExpandProperty items

foreach ($cat in $categories) {
    if ([string]::IsNullOrEmpty($cat.slug) -or $cat.slug -eq "null") { continue }
    $slug = $cat.slug
    $sidebarCount = $cat.productCount
    $products = (Invoke-WebRequest -Uri "$baseUrl/GetProductsByCategory?categorySlug=$slug" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result
    $actualCount = $products.Count
    
    if ($sidebarCount -ne $actualCount) {
        Write-Host "FAILURE: $($cat.name) | Sidebar: $sidebarCount | Actual: $actualCount"
    }
    else {
        Write-Host "SUCCESS: $($cat.name)"
    }
}
