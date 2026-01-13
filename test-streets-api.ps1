# Test Streets API
# Quick script to test the streets endpoints

$baseUrl = "http://localhost:5000/api"

Write-Host "🧪 Testing Streets API" -ForegroundColor Green
Write-Host ""

# Test 1: Get Beit Shemesh City
Write-Host "📍 Test 1: Get Beit Shemesh City" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/streets/city/beit-shemesh" -Method Get
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "City: $($response.name)" -ForegroundColor White
    Write-Host "ID: $($response.id)" -ForegroundColor Gray
    $cityId = $response.id
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the server is running on port 5000" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Search streets
Write-Host "📍 Test 2: Search for streets containing 'נחל'" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/streets?query=נחל&cityId=$cityId&limit=5" -Method Get
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Found $($response.Length) streets:" -ForegroundColor White
    foreach ($street in $response) {
        Write-Host "  - $($street.name)" -ForegroundColor White
        if ($street.neighborhoodName) {
            Write-Host "    שכונה: $($street.neighborhoodName)" -ForegroundColor Gray
        }
    }
    $streetId = $response[0].id
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Get specific street
Write-Host "📍 Test 3: Get street by ID" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/streets/$streetId" -Method Get
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Street: $($response.name)" -ForegroundColor White
    Write-Host "Code: $($response.code)" -ForegroundColor Gray
    if ($response.neighborhoodName) {
        Write-Host "Neighborhood: $($response.neighborhoodName)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 4: Search more streets
Write-Host "📍 Test 4: Search for streets containing 'הרצל'" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/streets?query=הרצל&cityId=$cityId" -Method Get
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Found $($response.Length) streets" -ForegroundColor White
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 5: Get all streets (limited)
Write-Host "📍 Test 5: Get all streets (first 10)" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/streets?cityId=$cityId&limit=10" -Method Get
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Got $($response.Length) streets" -ForegroundColor White
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "  - City endpoint: ✅" -ForegroundColor White
Write-Host "  - Street search: ✅" -ForegroundColor White
Write-Host "  - Street by ID: ✅" -ForegroundColor White
Write-Host "  - Hebrew support: ✅" -ForegroundColor White
Write-Host ""
