$baseUrl = "https://localhost:44311"
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
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

function Get-Token {
    param($email, $password, $tenancyName)
    $body = @{
        userNameOrEmailAddress = $email
        password = $password
        tenancyName = $tenancyName
    } | ConvertTo-Json
    
    $loginHeaders = @{
        "Content-Type" = "application/json"
        "Abp-TenantId" = "3"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/api/TokenAuth/Authenticate" -Method Post -Body $body -Headers $loginHeaders
    return $response.result.accessToken
}

# 1. Login
$token = Get-Token -email "GP_noshahi@easyfinora.com" -password "Noshahi.000" -tenancyName "globalpay"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "Abp-TenantId" = "3" # EasyFinora
}

# 2. Submit Card Application
# We generate a unique name to ensure we are looking at a new application
$uniqueName = "Test User " + (Get-Date -Format "yyyyMMddHHmmss")
$applyPayload = @{
    fullName = $uniqueName
    contactNumber = "1234567890"
    address = "123 Test St"
    cardType = "Visa"
    documentBase64 = "SGVsbG8gV29ybGQ=" 
} | ConvertTo-Json

Write-Host "Submitting Card Application for '$uniqueName'..."
try {
    Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/SubmitCardApplication" -Method Post -Headers $headers -Body $applyPayload
    Write-Host "OK: Application Submitted Successfully"
} catch {
    Write-Host "Note: Application submission might have been skipped if already pending."
}

# 3. Get Applications (Admin)
Write-Host "`nFetching Card Applications..."
try {
    $apps = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/GetCardApplications" -Method Get -Headers $headers
    $pendingApps = @($apps.result | Where-Object { $_.status -eq "Pending" })
    
    if ($pendingApps.Count -gt 0) {
        $app = $pendingApps | Where-Object { $_.fullName -eq $uniqueName } | Select-Object -First 1
        if ($null -eq $app) {
             # Fallback to latest if unique name not found (unlikely)
             $app = $pendingApps[-1]
        }
        
        $appId = $app.id
        Write-Host "OK: Found $($pendingApps.Count) pending applications. Approving LATEST ID: $appId ($($app.fullName))"
        
        # 4. Approve Application
        Write-Host "`nApproving Application $appId ..."
        try {
            Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/ApproveCardApplication?id=$appId" -Method Post -Headers $headers -Body "{}"
            Write-Host "OK: Application Approved Successfully"
        } catch {
            Write-Host "Error: Failed to Approve Application: $($_.Exception.Message)"
            exit
        }
    } else {
        Write-Host "Warning: No pending applications found."
    }
} catch {
    Write-Host "Error: Failed to Fetch Applications: $($_.Exception.Message)"
    exit
}

# 5. Verify Card Created
Write-Host "`nVerifying Card Creation..."
try {
    $cards = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/GetUserCards" -Method Get -Headers $headers
    $myCard = $cards.result | Where-Object { $_.holderName -eq $uniqueName.ToUpper() }
    Write-Host "OK: User now has $($cards.result.Count) total cards."
    if ($myCard) {
        Write-Host "SUCCESS: Found the newly generated card!" -ForegroundColor Green
        $myCard | ConvertTo-Json
    } else {
        Write-Host "Warning: Could not find the specific card for '$uniqueName'. Checking latest card..."
        $cards.result[-1] | ConvertTo-Json
    }
} catch {
    Write-Host "Error: Failed to Verify Cards: $($_.Exception.Message)"
}
