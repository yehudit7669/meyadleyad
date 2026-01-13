# Full System Test
$ErrorActionPreference = "Stop"

Write-Host "`n🧪 בדיקה מלאה של המערכת" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Login and get token
Write-Host "1️⃣ Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@meyadleyad.com"
    password = "admin123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "   ✅ Login successful!" -ForegroundColor Green
    $token = $loginResponse.data.accessToken
    Write-Host "   Token received: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Branding API - GET
Write-Host "`n2️⃣ Testing GET /api/admin/branding..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $brandingResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/branding" -Method Get -Headers $headers
    Write-Host "   ✅ Branding API works!" -ForegroundColor Green
    Write-Host "   Current config:" -ForegroundColor Cyan
    Write-Host "     - Logo: $($brandingResponse.data.logoUrl)" -ForegroundColor Gray
    Write-Host "     - Position: $($brandingResponse.data.position)" -ForegroundColor Gray
    Write-Host "     - Opacity: $($brandingResponse.data.opacity)%" -ForegroundColor Gray
    Write-Host "     - Size: $($brandingResponse.data.sizePct)%" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Branding API failed: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

# Test 3: Branding API - PATCH (update settings)
Write-Host "`n3️⃣ Testing PATCH /api/admin/branding (update settings)..." -ForegroundColor Yellow
$updateBody = @{
    opacity = 80
    sizePct = 20
    position = "bottom-right"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/branding" -Method Patch -Body $updateBody -Headers $headers -ContentType "application/json"
    Write-Host "   ✅ Settings updated!" -ForegroundColor Green
    Write-Host "   New opacity: $($updateResponse.data.opacity)%" -ForegroundColor Gray
    Write-Host "   New size: $($updateResponse.data.sizePct)%" -ForegroundColor Gray
    Write-Host "   New position: $($updateResponse.data.position)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Update failed: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Streets API
Write-Host "`n4️⃣ Testing Streets API..." -ForegroundColor Yellow
try {
    $streetsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/streets?cityId=beit-shemesh&limit=3" -Method Get
    Write-Host "   ✅ Streets API works! Sample streets:" -ForegroundColor Green
    foreach ($street in $streetsResponse) {
        Write-Host "     - $($street.name) ($($street.neighborhoodName))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Streets API failed: $_" -ForegroundColor Red
}

# Test 5: Reset to defaults
Write-Host "`n5️⃣ Testing POST /api/admin/branding/reset..." -ForegroundColor Yellow
try {
    $resetResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/branding/reset" -Method Post -Headers $headers -ContentType "application/json" -Body "{}"
    Write-Host "   ✅ Reset successful!" -ForegroundColor Green
    Write-Host "   Opacity reset to: $($resetResponse.data.opacity)%" -ForegroundColor Gray
    Write-Host "   Size reset to: $($resetResponse.data.sizePct)%" -ForegroundColor Gray
    Write-Host "   Position reset to: $($resetResponse.data.position)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Reset failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ כל הבדיקות עברו בהצלחה!" -ForegroundColor Green
Write-Host "`n📝 עכשיו נסה בממשק:" -ForegroundColor Cyan
Write-Host "   1. פתח: http://localhost:3000/admin/branding" -ForegroundColor White
Write-Host "   2. התחבר עם: admin@meyadleyad.com / admin123456" -ForegroundColor White
Write-Host "   3. המסך אמור להיטען ללא שגיאות" -ForegroundColor White
Write-Host "   4. ההגדרות אמורות להיות:" -ForegroundColor White
Write-Host "      - Position: bottom-left" -ForegroundColor Gray
Write-Host "      - Opacity: 70%" -ForegroundColor Gray
Write-Host "      - Size: 18%" -ForegroundColor Gray
