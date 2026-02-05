# Provision Azure Resources for Elicom
# Required: Azure CLI installed and logged in (az login)

$ResourceGroup = "rg-elicom-prod"
$Location = "eastus2" # Updated for region compatibility
$AppServicePlan = "plan-elicom"
$WebAppBackend = "app-elicom-backend"
$SqlServer = "sql-elicom-server-" + (Get-Random -Maximum 9999)
$DbName = "db-elicom"
$StaticWebAppEasyFinora = "stapp-elicom-easyfinora"
$StaticWebAppMain = "stapp-elicom-main"
$StaticWebAppPrimeship = "stapp-elicom-primeship"

Write-Host "🚀 Starting Resource Provisioning..." -ForegroundColor Cyan

# 1. Create Resource Group
Write-Host "Creating Resource Group: $ResourceGroup..."
az group create --name $ResourceGroup --location $Location

# 2. Create Azure SQL Server and Database
Write-Host "Creating SQL Server: $SqlServer..."
$SqlAdmin = "elicomadmin"
$SqlPassword = "Noshahi.000" # Updated as per user request
az sql server create --name $SqlServer --resource-group $ResourceGroup --location $Location --admin-user $SqlAdmin --admin-password $SqlPassword
az sql server firewall-rule create --resource-group $ResourceGroup --server $SqlServer --name AllowAllAzureIPs --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

Write-Host "Creating Database: $DbName..."
az sql db create --resource-group $ResourceGroup --server $SqlServer --name $DbName --service-objective Basic

# 3. Create App Service Plan (Linux B1)
Write-Host "Creating App Service Plan in centralus (avoiding eastus2 quota limits)..."
az appservice plan create --name $AppServicePlan --resource-group $ResourceGroup --location "centralus" --is-linux --sku B1

# 4. Create Web App for Backend
Write-Host "Creating Web App: $WebAppBackend..."
az webapp create --resource-group $ResourceGroup --plan $AppServicePlan --name $WebAppBackend --runtime "DOTNETCORE|9.0"

# 5. Create Static Web Apps for Frontends
Write-Host "Creating Static Web Apps..."
az staticwebapp create --name $StaticWebAppEasyFinora --resource-group $ResourceGroup --location $Location
az staticwebapp create --name $StaticWebAppMain --resource-group $ResourceGroup --location $Location
az staticwebapp create --name $StaticWebAppPrimeship --resource-group $ResourceGroup --location $Location

Write-Host "✅ Provisioning Complete!" -ForegroundColor Green
Write-Host "Please save these values for CI/CD setup:" -ForegroundColor Yellow
Write-Host "SQL Connection String: Server=tcp:$SqlServer.database.windows.net,1433;Initial Catalog=$DbName;Persist Security Info=False;User ID=$SqlAdmin;Password=$SqlPassword;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
