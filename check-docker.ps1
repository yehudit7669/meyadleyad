Write-Host "Checking Docker Status..." -ForegroundColor Cyan
Write-Host ""
Write-Host "WSL2:" -ForegroundColor Yellow
wsl --list --verbose
Write-Host ""
Write-Host "Docker Engine:" -ForegroundColor Yellow
docker ps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Docker is READY! Run: .\start-system.ps1" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Docker NOT ready. Wait 30 seconds and try again." -ForegroundColor Yellow
}
