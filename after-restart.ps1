# =====================================================
# סקריפט להרצה לאחר אתחול המחשב
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  אימות והפעלת Docker + PostgreSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# שלב 1: בדיקת WSL
Write-Host "[1/6] בודק שWSL 2 מותקן..." -ForegroundColor Yellow
try {
    $wslVersion = wsl --status 2>&1
    Write-Host "      ✓ WSL 2 פועל" -ForegroundColor Green
} catch {
    Write-Host "      ❌ WSL 2 לא מוכן" -ForegroundColor Red
    Write-Host "      הריצי שוב: .\setup-wsl-admin.ps1 (כמנהל)" -ForegroundColor Yellow
    Read-Host "לחצי Enter לסגירה"
    exit 1
}

# שלב 2: בדיקת Docker Desktop
Write-Host "[2/6] בודק שDocker Desktop פועל..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
$dockerReady = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        docker ps 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
            Write-Host "      ✓ Docker Desktop פועל" -ForegroundColor Green
            break
        }
    } catch {
        # ממשיך לנסות
    }
    
    if ($attempt -eq 1) {
        Write-Host "      Docker Desktop לא רץ..." -ForegroundColor Yellow
        Write-Host "      מנסה להפעיל אוטומטית..." -ForegroundColor Cyan
        
        # ניסיון להפעיל Docker Desktop
        $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerPath) {
            Start-Process $dockerPath
            Write-Host "      ⏳ ממתין ל-Docker Desktop להיטען..." -ForegroundColor Cyan
        }
    }
    
    Write-Host "      ניסיון $attempt/$maxAttempts - ממתין..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
}

if (-not $dockerReady) {
    Write-Host "      ❌ Docker Desktop לא מגיב" -ForegroundColor Red
    Write-Host ""
    Write-Host "פתרון:" -ForegroundColor Yellow
    Write-Host "1. פתחי Docker Desktop ידנית מתפריט Start" -ForegroundColor White
    Write-Host "2. המתיני עד שהאייקון בשורת המשימות יהפוך לירוק" -ForegroundColor White
    Write-Host "3. הריצי שוב סקריפט זה" -ForegroundColor White
    Write-Host ""
    Read-Host "לחצי Enter לסגירה"
    exit 1
}

# שלב 3: הפעלת PostgreSQL
Write-Host "[3/6] מפעיל PostgreSQL ב-Docker..." -ForegroundColor Yellow
docker compose down -v 2>&1 | Out-Null
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "      ❌ שגיאה בהפעלת PostgreSQL" -ForegroundColor Red
    Read-Host "לחצי Enter לסגירה"
    exit 1
}

# שלב 4: המתנה ל-PostgreSQL
Write-Host "[4/6] ממתין ל-PostgreSQL להיות מוכן..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$pgReady = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        docker exec meyadleyad-postgres pg_isready -U username -d meyadleyad 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $pgReady = $true
            Write-Host "      ✓ PostgreSQL מוכן!" -ForegroundColor Green
            break
        }
    } catch {
        # ממשיך
    }
    
    if ($attempt % 5 -eq 0) {
        Write-Host "      ממתין... ($attempt שניות)" -ForegroundColor Gray
    }
    Start-Sleep -Seconds 1
}

if (-not $pgReady) {
    Write-Host "      ❌ PostgreSQL לא עלה" -ForegroundColor Red
    Write-Host "      בדקי לוגים: docker logs meyadleyad-postgres" -ForegroundColor Yellow
    Read-Host "לחצי Enter לסגירה"
    exit 1
}

# שלב 5: Prisma Setup
Write-Host "[5/6] מגדיר Prisma..." -ForegroundColor Yellow
Set-Location server

Write-Host "      יוצר Prisma Client..." -ForegroundColor Cyan
npx prisma generate 2>&1 | Out-Null

Write-Host "      מריץ Migrations..." -ForegroundColor Cyan
npx prisma migrate deploy 2>&1 | Out-Null

# שלב 6: Seed
Write-Host "[6/6] ממלא נתוני דמו..." -ForegroundColor Yellow
npm run prisma:seed

Set-Location ..

# סיום
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  🎉 הכל מוכן ופועל!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 מידע חשוב:" -ForegroundColor Cyan
Write-Host ""
Write-Host "PostgreSQL:" -ForegroundColor Yellow
Write-Host "  • כתובת: localhost:5432" -ForegroundColor White
Write-Host "  • מסד נתונים: meyadleyad" -ForegroundColor White
Write-Host "  • משתמש: username" -ForegroundColor White
Write-Host "  • סיסמה: password" -ForegroundColor White
Write-Host ""
Write-Host "משתמשי דמו:" -ForegroundColor Yellow
Write-Host "  • Admin:  admin@meyadleyad.com / admin123456" -ForegroundColor White
Write-Host "  • Broker: broker@example.com / broker123456" -ForegroundColor White
Write-Host "  • User:   user@example.com / user123456" -ForegroundColor White
Write-Host ""
Write-Host "🚀 צעדים הבאים:" -ForegroundColor Cyan
Write-Host ""
Write-Host "פתחי 2 טרמינלים נפרדים והריצי:" -ForegroundColor Yellow
Write-Host ""
Write-Host "טרמינל 1 - Server:" -ForegroundColor Cyan
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "טרמינל 2 - Client:" -ForegroundColor Cyan
Write-Host "  cd client" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "ואז פתחי דפדפן: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "פקודות Docker שימושיות:" -ForegroundColor Yellow
Write-Host "  docker ps                          - צפייה בcontainers" -ForegroundColor Gray
Write-Host "  docker logs meyadleyad-postgres    - לוגים" -ForegroundColor Gray
Write-Host "  docker compose down                - עצירה" -ForegroundColor Gray
Write-Host "  docker compose down -v             - עצירה + מחיקת נתונים" -ForegroundColor Gray
Write-Host ""

Read-Host "לחצי Enter לסגירה"
