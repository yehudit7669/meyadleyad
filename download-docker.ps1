# סקריפט להורדת Docker Desktop Installer

Write-Host "=== הורדת Docker Desktop Installer ===" -ForegroundColor Cyan

$downloadUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$destinationPath = "$env:USERPROFILE\Downloads\DockerDesktopInstaller.exe"

Write-Host "`nמוריד Docker Desktop Installer..." -ForegroundColor Yellow
Write-Host "מ: $downloadUrl" -ForegroundColor Gray
Write-Host "אל: $destinationPath" -ForegroundColor Gray

try {
    # הורדה עם סרגל התקדמות
    $ProgressPreference = 'Continue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $destinationPath -UseBasicParsing
    
    Write-Host "`n✓ ההורדה הושלמה בהצלחה!" -ForegroundColor Green
    Write-Host "`nהקובץ נשמר ב:" -ForegroundColor Cyan
    Write-Host "  $destinationPath" -ForegroundColor White
    
    # בדיקת גודל הקובץ
    $fileSize = (Get-Item $destinationPath).Length / 1MB
    Write-Host "`nגודל הקובץ: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
    
    # שאלה אם להפעיל את ההתקנה
    Write-Host "`nהאם להפעיל את ההתקנה כעת? (Y/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    
    if ($response -eq 'Y' -or $response -eq 'y' -or $response -eq 'כן') {
        Write-Host "`nמפעיל את התקנת Docker Desktop..." -ForegroundColor Yellow
        Write-Host "שימי לב:" -ForegroundColor Cyan
        Write-Host "  1. עקבי אחר ההוראות על המסך" -ForegroundColor White
        Write-Host "  2. וודאי שהאפשרויות הבאות מסומנות:" -ForegroundColor White
        Write-Host "     ✓ Install required Windows components for WSL 2" -ForegroundColor White
        Write-Host "     ✓ Add shortcut to desktop" -ForegroundColor White
        Write-Host "  3. לאחר ההתקנה - הפעילי מחדש את המחשב!" -ForegroundColor Yellow
        
        Start-Sleep -Seconds 3
        Start-Process -FilePath $destinationPath -Wait
        
        Write-Host "`n✓ ההתקנה הושלמה!" -ForegroundColor Green
        Write-Host "`n⚠️  חשוב: הפעילי מחדש את המחשב כעת!" -ForegroundColor Yellow
        Write-Host "לאחר אתחול, הפעילי את Docker Desktop מתפריט Start" -ForegroundColor White
    } else {
        Write-Host "`nאפשר להפעיל את ההתקנה מאוחר יותר על ידי הפעלה כפולה של הקובץ:" -ForegroundColor Cyan
        Write-Host "  $destinationPath" -ForegroundColor White
    }
    
} catch {
    Write-Host "`n✗ שגיאה בהורדה!" -ForegroundColor Red
    Write-Host "שגיאה: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nפתרון חלופי:" -ForegroundColor Yellow
    Write-Host "  1. פתחי דפדפן" -ForegroundColor White
    Write-Host "  2. גשי לכתובת: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "  3. לחצי על 'Download for Windows'" -ForegroundColor White
}

Write-Host "`nלחצי כל מקש לסגירה..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
