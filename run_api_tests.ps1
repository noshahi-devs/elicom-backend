
$baseUrl = "https://localhost:44311/api"
$authUrl = "$baseUrl/TokenAuth/Authenticate"

# Disable SSL verification for development
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

$authPayload = @{
    "userNameOrEmailAddress" = "GP_noshahi@easyfinora.com"
    "password"               = "Noshahi.000"
    "tenancyName"            = "globalpay"
} | ConvertTo-Json

Write-Host "Authenticating..." -ForegroundColor Yellow
try {
    $authResponse = Invoke-RestMethod -Uri $authUrl -Method Post -Body $authPayload -ContentType "application/json"
    $token = $authResponse.result.accessToken
    Write-Host "✅ Authenticated successfully." -ForegroundColor Green
}
catch {
    Write-Host "❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

$appApiBase = "https://localhost:44311/api/services/app"

$apis = @(
    @{ name = "Store/GetAll"; url = "/Store/GetAll"; method = "GET" },
    @{ name = "Category/GetAll"; url = "/Category/GetAll"; method = "GET" },
    @{ name = "Product/GetAll"; url = "/Product/GetAll"; method = "GET" },
    @{ name = "Wallet/GetMyWallet"; url = "/Wallet/GetMyWallet"; method = "GET" },
    @{ name = "Transaction/GetHistory"; url = "/Transaction/GetAll"; method = "GET"; body = '{"maxResultCount": 10, "skipCount": 0}' },
    @{ name = "Withdraw/GetMyWithdrawRequests"; url = "/Withdraw/GetMyWithdrawRequests"; method = "GET"; body = '{"maxResultCount": 10, "skipCount": 0}' }
)

$results = @()

foreach ($api in $apis) {
    Write-Host "Testing $($api.name)..." -ForegroundColor Cyan
    $fullUrl = $appApiBase + $api.url
    $status = ""
    try {
        if ($api.method -eq "GET") {
            if ($api.body) {
                # ABP GET methods often take params as query strings or JSON in body depending on config
                # Try as POST if body is present (Standard ABP pattern for complex GET)
                $response = Invoke-RestMethod -Uri $fullUrl -Headers $headers -Method Post -Body $api.body
            }
            else {
                $response = Invoke-RestMethod -Uri $fullUrl -Headers $headers -Method Get
            }
        }
        $status = "✅ PASS"
        Write-Host "✅ Success!" -ForegroundColor Green
    }
    catch {
        $status = "❌ FAIL ($($_.Exception.Message))"
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    $results += [PSCustomObject]@{
        Name   = $api.name
        Status = $status
    }
}

$results | Format-Table -AutoSize
