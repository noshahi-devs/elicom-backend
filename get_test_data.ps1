$baseUrl = "https://localhost:44311/api/services/app"
$headers = @{
    "accept"       = "application/json"
    "abp-tenantid" = "2"
}

Write-Host "Fetching Products..."
try {
    $resp = Invoke-WebRequest -Uri "$baseUrl/Public/GetAllProducts" -Headers $headers -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    $p = $data.result.items[0]
    Write-Host "Product Found: $($p.title) (Id: $($p.productId), StoreProductId: $($p.storeProductId))"
}
catch {
    Write-Host "Failed to fetch products: $($_.Exception.Message)"
}

Write-Host "`nFetching Users (trying without auth)..."
try {
    $resp = Invoke-WebRequest -Uri "$baseUrl/User/GetAll" -Headers $headers -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    $u = $data.result.items[0]
    Write-Host "User Found: $($u.userName) (Id: $($u.id))"
}
catch {
    Write-Host "Failed to fetch users (Expected if unauthorized): $($_.Exception.Message)"
}
