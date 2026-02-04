[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6Ijc4IiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvc3ViIjoicHJpc21hdGljYWRlZWxAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvZW1haWxhZGRyZXNzIjoicHJpc21hdGljYWRlZWxAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiQnV5ZXIiLCJodHRwOi8vd3d3LmFzcG5ldGJvaWxlcnBsYXRlLmNvbS9pZGVudGl0eS9jbGFpbXMvdGVuYW50SWQiOiIxIiwibmFtZSI6IkN1c3RvbWVyIFVzZXIiLCJzdWIiOiI3OCIsImlzcyI6IkVsaWNvbSIsImF1ZCI6IkVsaWNvbSJ9.Z0l8h2O8gNjSDPsH_35BBAl5NPJiD7BchlZ2TwyPdwg"
$baseUrl = "https://localhost:44311"
$headers = @{ "Authorization" = "Bearer $authToken"; "Content-Type" = "application/json"; "Abp-TenantId" = "1" }

Write-Host "--- Step 1: AddToCart ---"
$cartBody = @{ userId = 78; storeProductId = "30d336e6-0bca-4dd1-b279-44563149cd1b"; quantity = 1 } | ConvertTo-Json
$cartRes = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Cart/AddToCart" -Method Post -Headers $headers -Body $cartBody
Write-Host "Cart Result: Success"

Write-Host "--- Step 2: CreateOrder ---"
$orderBody = @{
    userId = 78
    paymentMethod = "finora"
    shippingAddress = "American Lycetuff ZZR School System Khayaban e Quaid Campus Lahore"
    country = "Pakistan"
    state = "Punjab"
    city = "Lahore"
    postalCode = "54000"
    shippingCost = 0
    discount = 0
    sourcePlatform = "SmartStore"
    cardNumber = "4319952196637239"
    cvv = "597"
    expiryDate = "01/29"
} | ConvertTo-Json
$orderRes = Invoke-RestMethod -Uri "$baseUrl/api/services/app/Order/Create" -Method Post -Headers $headers -Body $orderBody
Write-Host "Order Result: Success"
$orderRes.result | ConvertTo-Json
