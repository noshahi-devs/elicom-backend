# verify_storage_access.ps1
param(
    [Parameter(Mandatory = $true)]
    [string]$Url
)

Write-Host "🔍 Verifying public access for: $Url" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -MaximumRedirection 0 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Public Access Verified: HTTP 200 OK" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Unexpected Status Code: $($response.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Access Denied or URL Invalid: $($_.Exception.Message)" -ForegroundColor Red
}
