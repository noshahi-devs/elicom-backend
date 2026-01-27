
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{
    "abp-tenantid" = "2"
    "accept"       = "application/json"
}

Write-Host "--- Starting Product Count Automation Test ---" -ForegroundColor Cyan

# 1. Fetch Categories
try {
    $catResponse = Invoke-WebRequest -Uri "$baseUrl/GetCategories" -Headers $headers -UseBasicParsing -ErrorAction Stop
    $categories = ($catResponse.Content | ConvertFrom-Json).result.items
}
catch {
    Write-Host "Failed to fetch categories: $_" -ForegroundColor Red
    exit
}

Write-Host "Found $($categories.Count) categories. Checking matches..."

$failures = 0
$results = foreach ($cat in $categories) {
    if ([string]::IsNullOrEmpty($cat.slug) -or $cat.slug -eq "null") { continue }
    
    $slug = $cat.slug
    $sidebarCount = $cat.productCount
    
    # 2. Fetch Products for this slug
    $prodUrl = "$baseUrl/GetProductsByCategory?categorySlug=$slug"
    $prodResponse = Invoke-WebRequest -Uri $prodUrl -Headers $headers -UseBasicParsing
    $products = ($prodResponse.Content | ConvertFrom-Json).result
    $actualCount = $products.Count
    
    $status = "PASS"
    $color = "Green"
    if ($sidebarCount -ne $actualCount) {
        $status = "FAIL"
        $color = "Red"
        $failures++
    }
    
    Write-Host "[$status] Category: $($cat.name) (Slug: $slug) | Sidebar: $sidebarCount | Actual: $actualCount" -ForegroundColor $color
}

Write-Host "--- Test Complete ---" -ForegroundColor Cyan
if ($failures -gt 0) {
    Write-Host "$failures mismatches found! The counting logic between Sidebar (ID-only) and List (Name-Contains) is inconsistent." -ForegroundColor Yellow
}
else {
    Write-Host "All counts match perfectly." -ForegroundColor Green
}
