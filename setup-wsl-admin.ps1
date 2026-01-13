# =====================================================
# WSL 2 Setup Script - Must run as Administrator
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WSL 2 Setup for Docker Desktop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "How to run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click on SETUP-WSL-ADMIN.bat" -ForegroundColor White
    Write-Host "2. Choose 'Run as administrator'" -ForegroundColor White
    Write-Host "3. Click 'Yes' in UAC prompt" -ForegroundColor White
    Write-Host ""
    Write-Host "Or:" -ForegroundColor Yellow
    Write-Host "1. Open PowerShell as Administrator" -ForegroundColor White
    Write-Host "2. Run: .\setup-wsl-admin.ps1" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Step 1: Enable WSL
Write-Host "[1/4] Enabling Windows Subsystem for Linux..." -ForegroundColor Yellow
try {
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Out-Null
    Write-Host "      WSL enabled successfully" -ForegroundColor Green
} catch {
    Write-Host "      WSL already enabled or error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 2: Enable Virtual Machine Platform
Write-Host "[2/4] Enabling Virtual Machine Platform..." -ForegroundColor Yellow
try {
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Out-Null
    Write-Host "      Virtual Machine Platform enabled successfully" -ForegroundColor Green
} catch {
    Write-Host "      Virtual Machine Platform already enabled or error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 3: Download WSL2 Kernel Update
Write-Host "[3/4] Downloading WSL2 Linux Kernel Update..." -ForegroundColor Yellow
$wslUpdateUrl = "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi"
$wslUpdatePath = "$env:TEMP\wsl_update_x64.msi"

try {
    Invoke-WebRequest -Uri $wslUpdateUrl -OutFile $wslUpdatePath -UseBasicParsing
    Write-Host "      Download completed" -ForegroundColor Green
    
    # Install
    Write-Host "      Installing WSL2 Kernel..." -ForegroundColor Yellow
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$wslUpdatePath`" /quiet /norestart"
    Write-Host "      WSL2 Kernel installed" -ForegroundColor Green
} catch {
    Write-Host "      Error downloading/installing: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "      You can download manually from: https://aka.ms/wsl2kernel" -ForegroundColor Cyan
}

# Step 4: Set WSL 2 as default
Write-Host "[4/4] Setting WSL 2 as default version..." -ForegroundColor Yellow
try {
    wsl --set-default-version 2 2>&1 | Out-Null
    Write-Host "      WSL 2 set as default" -ForegroundColor Green
} catch {
    Write-Host "      Will be set after restart" -ForegroundColor Yellow
}

# Done
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS (Important!):" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Restart your computer (Required!)" -ForegroundColor Yellow
Write-Host "   Run: Restart-Computer -Force" -ForegroundColor White
Write-Host "   Or: Close this window and restart via Start > Power > Restart" -ForegroundColor White
Write-Host ""
Write-Host "2. After restart:" -ForegroundColor Yellow
Write-Host "   - Open Docker Desktop" -ForegroundColor White
Write-Host "   - Wait until the taskbar icon turns green" -ForegroundColor White
Write-Host ""
Write-Host "3. Run the script:" -ForegroundColor Yellow
Write-Host "   cd C:\Users\User\Desktop\meyadleyad" -ForegroundColor White
Write-Host "   .\after-restart.ps1" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask to restart now
$restart = Read-Host "Restart computer now? (Y/N)"
if ($restart -eq 'Y' -or $restart -eq 'y') {
    Write-Host ""
    Write-Host "Restarting computer..." -ForegroundColor Yellow
    Write-Host "See you after restart!" -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    Restart-Computer -Force
} else {
    Write-Host ""
    Write-Host "OK! Remember to restart before continuing." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
}
