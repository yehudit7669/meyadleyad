# Test APIs
$ErrorActionPreference = "Stop"

Write-Host "Testing APIs..." -ForegroundColor Cyan

# Test 1: Login
Write-Host "`n1. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@meyadleyad.com"
    password = "admin123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
Write-Host "   ✅ Login successful!" -ForegroundColor Green
$token = $loginResponse.data.accessToken

# Test 2: Branding API
Write-Host "`n2. Testing Branding API..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}
$brandingResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/branding" -Method Get -Headers $headers
Write-Host "   ✅ Branding API works!" -ForegroundColor Green
Write-Host "`n   Config:" -ForegroundColor Cyan
$brandingResponse.data | ConvertTo-Json

# Test 3: Streets API
Write-Host "`n3. Testing Streets API..." -ForegroundColor Yellow
$streetsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/streets?cityId=beit-shemesh&limit=5" -Method Get
Write-Host "   ✅ Streets API works! Found $($streetsResponse.Length) streets" -ForegroundColor Green

# Test 4: Cities API
Write-Host "`n4. Testing Cities API..." -ForegroundColor Yellow
$citiesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/cities" -Method Get
Write-Host "   ✅ Cities API works! Found $($citiesResponse.data.Length) cities" -ForegroundColor Green

Write-Host "`n✅ All APIs working!" -ForegroundColor Green
