# Stop all EthioBridge services
Write-Host "Stopping EthioBridge platform services..." -ForegroundColor Cyan
docker compose down
Write-Host "EthioBridge services stopped." -ForegroundColor Green
