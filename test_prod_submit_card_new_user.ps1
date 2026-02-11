$baseUrl = "https://app-elicom-backend.azurewebsites.net"
$email = "noshahidevelopersinc@gmail.com"
$password = "Noshahi.000"
$tenancyName = "" # Try without tenancy first, or default to host if needed

function Get-Token {
    param($email, $password, $tenancyName)
    $body = @{
        userNameOrEmailAddress = $email
        password               = $password
    }
    if ($tenancyName) { $body.tenancyName = $tenancyName }
    
    $bodyJson = $body | ConvertTo-Json
    
    $loginHeaders = @{
        "Content-Type" = "application/json"
    }

    Write-Host "Authenticating as $email..."
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/TokenAuth/Authenticate" -Method Post -Body $bodyJson -Headers $loginHeaders
        return $response.result.accessToken
    }
    catch {
        Write-Host "Auth Failed: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Auth Error Details: $($reader.ReadToEnd())"
        }
        return $null
    }
}

$token = Get-Token -email $email -password $password -tenancyName $tenancyName
if (-not $token) { exit }

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

try {
    # 1. Check existing applications
    Write-Host "`nChecking existing applications for user..."
    $appsResponse = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/GetMyApplications" -Method Get -Headers $headers
    $apps = $appsResponse.result
    Write-Host "Found $($apps.Count) existing applications."
    
    $pendingApps = $apps | Where-Object { $_.status -eq "Pending" }
    if ($pendingApps) {
        Write-Host "User already has a pending application. ID: $($pendingApps[0].id)" -ForegroundColor Yellow
    }

    # 2. Submit new application
    $uniqueName = "Noshahi Dev " + (Get-Date -Format "yyyyMMddHHmmss")
    $applyPayload = @{
        fullName       = $uniqueName
        contactNumber  = "03211234567"
        address        = "Noshahi Developers Office, Suite 501"
        cardType       = 0 # Visa (0)
        documentBase64 = "U01BUlQgU1RPUkUgVEVTVCBET0NVTUVOVA==" 
        documentType   = "pdf"
    } | ConvertTo-Json

    Write-Host "`nSubmitting new Card Application for '$uniqueName'..."
    $submitResult = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Card/SubmitCardApplication" -Method Post -Headers $headers -Body $applyPayload
    
    Write-Host "SUCCESS: Card Application Submitted" -ForegroundColor Green
    $submitResult.result | ConvertTo-Json
}
catch {
    Write-Host "`nERROR: Request Failed" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response: $errorBody"
    }
    else {
        Write-Host "Message: $($_.Exception.Message)"
    }
}
