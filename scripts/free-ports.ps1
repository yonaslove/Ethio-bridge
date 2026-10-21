# Helper script to stop conflicting containers occupying EthioBridge default ports
# Ports: 5432 (Postgres), 8180 (Keycloak), 8761 (Eureka), 8080 (Backend API), 4200 (Frontend)

Write-Host "Checking for running containers that may occupy EthioBridge ports..." -ForegroundColor Cyan

$conflicting = docker ps --format "{{.Names}}" | Select-String "insurance-"

if ($conflicting) {
    Write-Host "Found conflicting insurance services running. Stopping them..." -ForegroundColor Yellow
    docker stop $conflicting
    Write-Host "Conflicting containers stopped successfully." -ForegroundColor Green
} else {
    Write-Host "No conflicting insurance containers found." -ForegroundColor Green
}
