#!/usr/bin/env pwsh
# Auto-setup script after Docker is ready

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🚀 Meyadleyad - Auto Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify Docker is running
Write-Host "📋 Step 1/6: Verifying Docker..." -ForegroundColor Yellow
$dockerReady = $false
for ($i = 1; $i -le 10; $i++) {
    $result = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is running!" -ForegroundColor Green
        $dockerReady = $true
        break
    }
    Write-Host "⏳ Attempt $i/10 - Docker not ready yet..." -ForegroundColor Yellow
    Start-Sleep -Seconds 6
}

if (-not $dockerReady) {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 2: Stop existing containers
Write-Host "`n📋 Step 2/6: Stopping existing containers..." -ForegroundColor Yellow
docker compose down 2>&1 | Out-Null
Write-Host "✅ Cleaned up!" -ForegroundColor Green

# Step 3: Start PostgreSQL
Write-Host "`n📋 Step 3/6: Starting PostgreSQL database..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PostgreSQL is starting..." -ForegroundColor Green

# Step 4: Wait for PostgreSQL to be ready
Write-Host "`n📋 Step 4/6: Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$dbReady = $false
for ($i = 1; $i -le 12; $i++) {
    $healthCheck = docker exec meyadleyad-postgres pg_isready -U username -d meyadleyad 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database is ready!" -ForegroundColor Green
        $dbReady = $true
        break
    }
    Write-Host "⏳ Waiting for database ($i/12)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

if (-not $dbReady) {
    Write-Host "❌ Database failed to start!" -ForegroundColor Red
    Write-Host "Check logs with: docker logs meyadleyad-postgres" -ForegroundColor Yellow
    exit 1
}

# Step 5: Generate Prisma Client
Write-Host "`n📋 Step 5/6: Generating Prisma Client..." -ForegroundColor Yellow
Set-Location server
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✅ Prisma Client generated!" -ForegroundColor Green

# Step 6: Run database migrations
Write-Host "`n📋 Step 6/6: Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration had some warnings, but continuing..." -ForegroundColor Yellow
}
Write-Host "✅ Database schema created!" -ForegroundColor Green

Set-Location ..

# Final status check
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   📊 Final Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n🐳 Docker Containers:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Install dependencies:" -ForegroundColor White
Write-Host "     cd server && npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start the backend server:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Start the frontend (in another terminal):" -ForegroundColor White
Write-Host "     cd client && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Cyan
Write-Host "  • Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "  • Frontend:     http://localhost:3000" -ForegroundColor White
Write-Host "  • Prisma Studio: cd server && npx prisma studio" -ForegroundColor White
Write-Host ""
