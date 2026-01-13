# Debug token
$loginBody = @{
    email = "admin@meyadleyad.com"
    password = "admin123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
Write-Host "Full response:"
$loginResponse | ConvertTo-Json -Depth 10
Write-Host "`nToken: $($loginResponse.data.token)"
