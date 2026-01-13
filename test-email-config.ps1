# Test Email System Configuration
# This script checks if SMTP is properly configured

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   Email System Configuration Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path "server\.env") {
    Write-Host "[OK] server\.env exists" -ForegroundColor Green
    
    # Read .env file
    $envContent = Get-Content "server\.env" -Raw
    
    # Check critical SMTP variables
    $checks = @{
        "SMTP_HOST" = $envContent -match "SMTP_HOST\s*=\s*.+"
        "SMTP_PORT" = $envContent -match "SMTP_PORT\s*=\s*.+"
        "SMTP_USER" = $envContent -match "SMTP_USER\s*=\s*.+"
        "SMTP_PASS" = $envContent -match "SMTP_PASS\s*=\s*.+"
        "SMTP_FROM" = $envContent -match "SMTP_FROM\s*=\s*.+"
        "FRONTEND_URL" = $envContent -match "FRONTEND_URL\s*=\s*.+"
    }
    
    Write-Host ""
    Write-Host "Checking SMTP Configuration:" -ForegroundColor Yellow
    Write-Host "----------------------------" -ForegroundColor Yellow
    
    $allConfigured = $true
    foreach ($key in $checks.Keys) {
        if ($checks[$key]) {
            Write-Host "[OK] $key is set" -ForegroundColor Green
        } else {
            Write-Host "[MISSING] $key is not configured!" -ForegroundColor Red
            $allConfigured = $false
        }
    }
    
    Write-Host ""
    
    if ($allConfigured) {
        Write-Host "Configuration Status: READY" -ForegroundColor Green -BackgroundColor Black
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Make sure you're using Gmail App Password (not regular password)" -ForegroundColor White
        Write-Host "2. Start the server: cd server; npm run dev" -ForegroundColor White
        Write-Host "3. Check server console for: 'SMTP connection verified successfully'" -ForegroundColor White
        Write-Host "4. Test registration with a real email address" -ForegroundColor White
    } else {
        Write-Host "Configuration Status: INCOMPLETE" -ForegroundColor Red -BackgroundColor Black
        Write-Host ""
        Write-Host "Action Required:" -ForegroundColor Cyan
        Write-Host "1. Copy server\.env.example to server\.env" -ForegroundColor White
        Write-Host "2. Edit server\.env and fill in SMTP credentials" -ForegroundColor White
        Write-Host "3. See EMAIL_SYSTEM_README.md for detailed instructions" -ForegroundColor White
    }
    
} else {
    Write-Host "[ERROR] server\.env not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Action Required:" -ForegroundColor Cyan
    Write-Host "1. Copy server\.env.example to server\.env" -ForegroundColor White
    Write-Host "2. Edit server\.env and configure SMTP settings" -ForegroundColor White
    Write-Host "3. See EMAIL_SYSTEM_README.md for instructions" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Prisma is up to date
Write-Host "Checking Database Schema..." -ForegroundColor Yellow
if (Test-Path "server\prisma\schema.prisma") {
    $schemaContent = Get-Content "server\prisma\schema.prisma" -Raw
    
    $newFields = @(
        "isEmailVerified",
        "verificationToken",
        "verificationExpires",
        "resetPasswordToken",
        "resetPasswordExpires"
    )
    
    $allFieldsPresent = $true
    foreach ($field in $newFields) {
        if ($schemaContent -match $field) {
            Write-Host "[OK] Field '$field' exists in schema" -ForegroundColor Green
        } else {
            Write-Host "[MISSING] Field '$field' is missing!" -ForegroundColor Red
            $allFieldsPresent = $false
        }
    }
    
    if (-not $allFieldsPresent) {
        Write-Host ""
        Write-Host "Database schema needs to be updated!" -ForegroundColor Red
        Write-Host "Run: cd server; npx prisma db push" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Database Schema: UP TO DATE" -ForegroundColor Green -BackgroundColor Black
    }
} else {
    Write-Host "[ERROR] schema.prisma not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "For full documentation, see:" -ForegroundColor Cyan
Write-Host "  EMAIL_SYSTEM_README.md" -ForegroundColor White
Write-Host ""
