
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{ "abp-tenantid" = "2"; "accept" = "application/json" }
$categories = (Invoke-WebRequest -Uri "$baseUrl/GetCategories" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result | Select-Object -ExpandProperty items

$report = foreach ($cat in $categories) {
    if ([string]::IsNullOrEmpty($cat.slug) -or $cat.slug -eq "null") { continue }
    $products = (Invoke-WebRequest -Uri "$baseUrl/GetProductsByCategory?categorySlug=$($cat.slug)" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result
    [PSCustomObject]@{
        Name    = $cat.name
        Sidebar = $cat.productCount
        Actual  = $products.Count
        Slug    = $cat.slug
        Match   = if ($cat.productCount -eq $products.Count) { "YES" } else { "NO" }
    }
}

$report | Format-Table -AutoSize
