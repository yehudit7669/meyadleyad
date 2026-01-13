# סקריפט עזר להפעלת Docker והפרויקט

Write-Host "=== התקנה והפעלת פרויקט Meyadleyad עם Docker ===" -ForegroundColor Cyan

# 1. בדיקה אם Docker Desktop רץ
Write-Host "`n[1/6] בודק אם Docker Desktop פועל..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker Desktop פועל" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Desktop לא פועל" -ForegroundColor Red
    Write-Host "אנא הפעל את Docker Desktop ונסה שוב" -ForegroundColor Yellow
    Write-Host "לחץ כל מקש לצאת..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 2. הפעלת PostgreSQL עם Docker Compose
Write-Host "`n[2/6] מפעיל PostgreSQL עם Docker Compose..." -ForegroundColor Yellow
docker compose down -v | Out-Null
docker compose up -d

# המתנה ל-PostgreSQL להיות מוכן
Write-Host "`n[3/6] ממתין ל-PostgreSQL להיות מוכן..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        docker exec meyadleyad-postgres pg_isready -U username -d meyadleyad | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ PostgreSQL מוכן!" -ForegroundColor Green
            break
        }
    } catch {
        # ממשיך לנסות
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "✗ PostgreSQL לא עלה תוך 30 שניות" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ניסיון $attempt/$maxAttempts..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

# 3. יצירת Prisma Client
Write-Host "`n[4/6] יוצר Prisma Client..." -ForegroundColor Yellow
Set-Location server
npx prisma generate

# 4. הרצת Migrations
Write-Host "`n[5/6] מריץ Prisma Migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

# 5. הרצת Seed
Write-Host "`n[6/6] מריץ Seed Script..." -ForegroundColor Yellow
npm run prisma:seed

Write-Host "`n=== ההתקנה הושלמה בהצלחה! ===" -ForegroundColor Green
Write-Host "`nמידע חשוב:" -ForegroundColor Cyan
Write-Host "  • PostgreSQL רץ על: localhost:5432" -ForegroundColor White
Write-Host "  • שם מסד נתונים: meyadleyad" -ForegroundColor White
Write-Host "  • משתמש: username" -ForegroundColor White
Write-Host "  • סיסמה: password" -ForegroundColor White
Write-Host "`nמשתמשי דמו:" -ForegroundColor Cyan
Write-Host "  • Admin: admin@meyadleyad.com / admin123456" -ForegroundColor White
Write-Host "  • Broker: broker@example.com / broker123456" -ForegroundColor White
Write-Host "  • User: user@example.com / user123456" -ForegroundColor White

Write-Host "`nהפקודות הבאות:" -ForegroundColor Cyan
Write-Host "  • להפעיל את השרת: cd server && npm run dev" -ForegroundColor White
Write-Host "  • להפעיל את הלקוח: cd client && npm run dev" -ForegroundColor White
Write-Host "  • לעצור את PostgreSQL: docker compose down" -ForegroundColor White
Write-Host "  • למחוק את כל הנתונים: docker compose down -v" -ForegroundColor White

Set-Location ..
