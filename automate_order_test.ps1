$baseUrl = "https://localhost:44311"
$tenantId = "2"

# 1. Login
Write-Host "Logging in..."
$loginPayload = @{
    userNameOrEmailAddress = "GP_noshahi@easyfinora.com"
    password               = "Noshahi.000"
} | ConvertTo-Json

$loginResp = Invoke-WebRequest -Uri "$baseUrl/api/TokenAuth/Authenticate" `
    -Method Post -Body $loginPayload -ContentType "application/json" `
    -Headers @{"abp-tenantid" = $tenantId } -UseBasicParsing

$loginData = $loginResp.Content | ConvertFrom-Json
$token = $loginData.result.accessToken
$userId = $loginData.result.userId

Write-Host "Logged in as User: $userId"

$headers = @{
    "Authorization" = "Bearer $token"
    "abp-tenantid"  = $tenantId
    "accept"        = "application/json"
}

# 2. Get a Product
Write-Host "Fetching products..."
$productResp = Invoke-WebRequest -Uri "$baseUrl/api/services/app/SmartStorePublic/GetGlobalMarketplaceProducts" `
    -Headers $headers -UseBasicParsing

$productData = $productResp.Content | ConvertFrom-Json
$product = $productData.result.items[0]
if (!$product) {
    $product = $productData.result[0]
}

if (!$product) {
    Write-Host "No products found!"
    exit
}

$storeProductId = $product.id
if (!$storeProductId) { $storeProductId = $product.storeProductId }

Write-Host "Using Product: $($product.productName) (StoreProductId: $storeProductId)"

# 3. Add to Cart
Write-Host "Adding to cart..."
$cartPayload = @{
    userId         = $userId
    storeProductId = $storeProductId
    quantity       = 1
} | ConvertTo-Json

try {
    $cartResp = Invoke-WebRequest -Uri "$baseUrl/api/services/app/Cart/AddToCart" `
        -Method Post -Body $cartPayload -ContentType "application/json" `
        -Headers $headers -UseBasicParsing

    Write-Host "Add to Cart Response Code: $($cartResp.StatusCode)"
}
catch {
    Write-Host "Add to Cart FAILED!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $respContent = $reader.ReadToEnd()
        Write-Host "Response content: $respContent"
    }
}

# 4. Verify Cart
Write-Host "Verifying cart content..."
$cartItemsResp = Invoke-WebRequest -Uri "$baseUrl/api/services/app/Cart/GetCartItems?userId=$userId" `
    -Headers $headers -UseBasicParsing

$cartItemsData = $cartItemsResp.Content | ConvertFrom-Json
$count = $cartItemsData.result.Count
Write-Host "Cart Items Count: $count"

if ($count -eq 0) {
    Write-Host "ERROR: Cart is still empty after AddToCart!" -ForegroundColor Red
    # exit
}

# 5. Create Order
Write-Host "Creating Order..."
$orderPayload = @{
    userId          = $userId
    paymentMethod   = "Wallet"
    shippingAddress = "Automated Test Address"
    country         = "TestCountry"
    state           = "TestState"
    city            = "TestCity"
    postalCode      = "12345"
    shippingCost    = 0
    discount        = 0
    sourcePlatform  = "SmartStore"
} | ConvertTo-Json

try {
    $orderResp = Invoke-WebRequest -Uri "$baseUrl/api/services/app/Order/Create" `
        -Method Post -Body $orderPayload -ContentType "application/json" `
        -Headers $headers -UseBasicParsing

    Write-Host "Order Created Successfully!" -ForegroundColor Green
    Write-Host $orderResp.Content
}
catch {
    Write-Host "Order Creation FAILED!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $respContent = $reader.ReadToEnd()
        Write-Host "Response content: $respContent"
    }
}
