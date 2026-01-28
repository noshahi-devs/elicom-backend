param (
    [string]$Token = "",
    [string]$TenantId = "2"
)

$baseUrl = "https://localhost:44311/api/services/app"
$headers = @{
    "abp-tenantid" = $TenantId
    "accept"       = "application/json"
}

if ($Token) {
    $headers.Add("Authorization", "Bearer $Token")
}

Write-Host "--- Starting Prime Ship API Verification ---" -ForegroundColor Cyan

$endpoints = @(
    @{ name = "Public Categories"; url = "$baseUrl/Public/GetCategories" },
    @{ name = "Public Products"; url = "$baseUrl/Public/GetAllProducts" },
    @{ name = "Admin Orders"; url = "$baseUrl/SupplierOrder/GetAll" },
    @{ name = "Seller Orders"; url = "$baseUrl/SupplierOrder/GetMyOrders" },
    @{ name = "All Products"; url = "$baseUrl/Product/GetAll" },
    @{ name = "All Categories"; url = "$baseUrl/Category/GetAll" },
    @{ name = "System Users"; url = "$baseUrl/User/GetAll" }
)

$results = foreach ($ep in $endpoints) {
    Write-Host "Testing $($ep.name)..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $ep.url -Headers $headers -UseBasicParsing -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        $count = 0
        if ($data.result.items) {
            $count = $data.result.items.Count
        }
        elseif ($data.result) {
            $count = $data.result.Count
        }

        if ($response.StatusCode -eq 200) {
            Write-Host " [PASS] (Count: $count)" -ForegroundColor Green
        }
        else {
            Write-Host " [FAIL] (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    }
    catch {
        Write-Host " [ERROR] ($($_.Exception.Message))" -ForegroundColor Yellow
        if ($_.Exception.Message -match "401") {
            Write-Host "  -> Authentication required. Please provide a valid Token." -ForegroundColor Gray
        }
    }
}

Write-Host "--- Verification Complete ---" -ForegroundColor Cyan
