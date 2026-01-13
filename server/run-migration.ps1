# Auto-approve migration
$env:PRISMA_MIGRATE_SKIP_SEED = "true"

# Use db push for development (bypasses migration files)
Write-Host "Pushing schema changes to database..." -ForegroundColor Cyan
npx prisma db push --accept-data-loss --skip-generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema updated successfully!" -ForegroundColor Green
    
    # Generate Prisma Client
    Write-Host "Generating Prisma Client..." -ForegroundColor Cyan
    npx prisma generate
    
    Write-Host "✅ Done!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update schema" -ForegroundColor Red
    exit 1
}
