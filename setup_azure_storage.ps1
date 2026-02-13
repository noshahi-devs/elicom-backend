# setup_azure_storage.ps1
$resourceGroup = "elicom-storage-rg"
$location = "eastus"
$storageAccount = "primeshipstg" + (Get-Random -Minimum 1000 -Maximum 9999)
$containerName = "primeship-products"

Write-Host "🚀 Starting Azure Infrastructure Setup..." -ForegroundColor Cyan

# 1. Create Resource Group
Write-Host "Creating Resource Group: $resourceGroup..."
az group create --name $resourceGroup --location $location

# 2. Create Storage Account
Write-Host "Creating Storage Account: $storageAccount..."
az storage account create `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --location $location `
    --sku Standard_LRS `
    --allow-blob-public-access true

# 3. Get Connection String
$connectionString = az storage account show-connection-string `
    --name $storageAccount `
    --resource-group $resourceGroup `
    --query connectionString `
    --output tsv

Write-Host "✅ Storage Account Created." -ForegroundColor Green

# 4. Create Container with Public Access
Write-Host "Creating Container: $containerName..."
az storage container create `
    --name $containerName `
    --account-name $storageAccount `
    --public-access blob `
    --connection-string $connectionString

Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "--------------------------------------------------"
Write-Host "Connection String (Save this):"
Write-Host $connectionString -ForegroundColor Yellow
Write-Host "--------------------------------------------------"
