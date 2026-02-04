# Test General Newspaper Sheet
# בדיקת לוח מודעות כללי

Write-Host "🧪 Testing General Newspaper Sheet..." -ForegroundColor Cyan
Write-Host ""

# Change to server directory
Set-Location -Path "$PSScriptRoot\server"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules not found. Please run 'npm install' first." -ForegroundColor Red
    exit 1
}

# Run the test script
Write-Host "📄 Running test script..." -ForegroundColor Yellow
Write-Host ""

try {
    # Use tsx to run TypeScript directly
    npx tsx test-general-sheet.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Test completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📁 Check the generated PDFs in:" -ForegroundColor Cyan
        Write-Host "   server/uploads/newspaper-sheets/" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Test failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running test: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Done!" -ForegroundColor Green
