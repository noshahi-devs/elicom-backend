
$baseUrl = "https://localhost:44311/api/services/app/Public"
$headers = @{ "abp-tenantid" = "2"; "accept" = "application/json" }

$all = (Invoke-WebRequest -Uri "$baseUrl/GetProducts" -Headers $headers -UseBasicParsing).Content | ConvertFrom-Json | Select-Object -ExpandProperty result | Select-Object -ExpandProperty items

$distinctSuppliers = $all | Select-Object -ExpandProperty supplierId -Unique
Write-Host "Unique Supplier IDs found in Product table: $($distinctSuppliers -join ', ')"

foreach ($sid in $distinctSuppliers) {
    $p = $all | Where-Object { $_.supplierId -eq $sid } | Select-Object -First 1
    Write-Host "Supplier $sid -> Product: $($p.name) | Tenant: $($p.supplierTenantId)"
}
