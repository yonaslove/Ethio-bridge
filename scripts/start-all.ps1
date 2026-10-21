# Start all EthioBridge services using Docker Compose
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Starting EthioBridge Platform Services   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

# Prompt to stop conflicting containers if needed
$conflicting = docker ps --format "{{.Names}}" | Select-String "insurance-"
if ($conflicting) {
    Write-Host "WARNING: Detected conflicting containers occupying ports (5432, 8080, 8180, 8761, 4200)." -ForegroundColor Yellow
    Write-Host "Stopping conflicting containers before launch..." -ForegroundColor Yellow
    docker stop $conflicting
}

Write-Host "Launching Docker Compose stack..." -ForegroundColor Green
docker compose up -d

Write-Host "`nServices status:" -ForegroundColor Cyan
docker compose ps

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "EthioBridge is up and running!" -ForegroundColor Green
Write-Host "  - Angular Frontend:    http://localhost:4200" -ForegroundColor White
Write-Host "  - Spring Boot API:     http://localhost:8080/api/v1" -ForegroundColor White
Write-Host "  - Swagger UI:          http://localhost:8080/api/v1/swagger-ui.html" -ForegroundColor White
Write-Host "  - AI Matching Service: http://localhost:8000/ai/v1" -ForegroundColor White
Write-Host "  - Keycloak Realm:      http://localhost:8180" -ForegroundColor White
Write-Host "  - Eureka Dashboard:    http://localhost:8761" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Green
