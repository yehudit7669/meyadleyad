# Setup Streets System - Automated Script
# Run this script to set up the streets system for Beit Shemesh

Write-Host "🚀 Starting Streets System Setup for Beit Shemesh" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "📋 Step 1/5: Checking Docker..." -ForegroundColor Cyan
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop first" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Desktop is running
Write-Host ""
Write-Host "📋 Step 2/5: Starting Docker containers..." -ForegroundColor Cyan
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Docker Desktop not running. Starting..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "Waiting 40 seconds for Docker to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 40
}

# Start containers
Set-Location "C:\Users\User\Desktop\meyadleyad"
Write-Host "Starting containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run migration
Write-Host ""
Write-Host "📋 Step 3/5: Running database migration..." -ForegroundColor Cyan
Set-Location "C:\Users\User\Desktop\meyadleyad\server"

Write-Host "Creating migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_streets_and_neighborhoods

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed. Trying to reset..." -ForegroundColor Red
    npx prisma migrate reset --force
    npx prisma migrate dev --name add_streets_and_neighborhoods
}

# Run seed
Write-Host ""
Write-Host "📋 Step 4/5: Loading streets from CSV..." -ForegroundColor Cyan
Write-Host "This may take a minute..." -ForegroundColor Yellow
npx ts-node prisma/seedStreets.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Streets loaded successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to load streets" -ForegroundColor Red
    Write-Host "Please check that the CSV file exists at:" -ForegroundColor Yellow
    Write-Host "  C:\Users\User\Desktop\meyadleyad\server\רחובות בית שמש.csv" -ForegroundColor Yellow
    exit 1
}

# Verify data
Write-Host ""
Write-Host "📋 Step 5/5: Verifying database..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening Prisma Studio to verify..." -ForegroundColor Yellow
Write-Host "Please check that you have:" -ForegroundColor Yellow
Write-Host "  - City: בית שמש" -ForegroundColor White
Write-Host "  - Neighborhoods: Multiple rows" -ForegroundColor White
Write-Host "  - Streets: ~380 rows" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in Prisma Studio when done verifying" -ForegroundColor Yellow
Write-Host ""

npx prisma studio

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start the server:" -ForegroundColor White
Write-Host "     cd C:\Users\User\Desktop\meyadleyad\server" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start the client (in a new terminal):" -ForegroundColor White
Write-Host "     cd C:\Users\User\Desktop\meyadleyad\client" -ForegroundColor Gray
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Open http://localhost:5173 and test!" -ForegroundColor White
Write-Host ""
