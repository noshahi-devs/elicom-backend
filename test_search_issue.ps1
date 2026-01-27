
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{ "abp-tenantid" = "2"; "accept" = "application/json" }

$term = "digital product"
Write-Host "Searching for '$term'..." -ForegroundColor Cyan

$response = Invoke-WebRequest -Uri "$baseUrl/GetProducts?searchTerm=$([uri]::EscapeDataString($term))" -Headers $headers -UseBasicParsing
$products = ($response.Content | ConvertFrom-Json).result.items

Write-Host "Found $($products.Count) products."
if ($products.Count -eq 0) {
    Write-Host "FAILURE: Expected to find products matching category 'Digital Products' or similar." -ForegroundColor Red
}
else {
    foreach ($p in $products) {
        Write-Host "MATCH: $($p.name) | Category: $($p.categoryName)" -ForegroundColor Green
    }
}

# Test partial word if above fails
$term2 = "digital"
Write-Host "`nSearching for '$term2'..." -ForegroundColor Cyan
$response2 = Invoke-WebRequest -Uri "$baseUrl/GetProducts?searchTerm=$([uri]::EscapeDataString($term2))" -Headers $headers -UseBasicParsing
$products2 = ($response2.Content | ConvertFrom-Json).result.items
Write-Host "Found $($products2.Count) products."
foreach ($p in $products2) {
    Write-Host "MATCH: $($p.name) | Category: $($p.categoryName)"
}
