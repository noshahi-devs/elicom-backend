
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{ "abp-tenantid" = "2"; "accept" = "application/json" }

$cats = (Invoke-WebRequest -Uri "$baseUrl/GetCategories" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result | Select-Object -ExpandProperty items
$target = $cats | Where-Object { $_.name -like "*Digital Products*" }

Write-Host "Categories found with 'Digital Products' in name:"
$target | Format-Table -AutoSize

# Fetch all directly from repo if possible? No, use API.
# Let's try to fetch products again and see their CategoryID
$slug = "digitalproductsalibhai"
$prods = (Invoke-WebRequest -Uri "$baseUrl/GetProductsByCategory?categorySlug=$slug" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result
Write-Host "`nProducts in this category:"
$prods | Select-Object Name, CategoryID, CategoryName | Format-Table -AutoSize
