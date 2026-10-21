# ==============================================================================
# EthioBridge (ኢትዮ-ብሪጅ) - Comprehensive End-to-End System Smoke Test Runner
# Validates all core microservices, authentication, marketplace, AI matching,
# Chapa escrow checkout, connects monetization, messaging, and KYC verification.
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ETHIOBRIDGE END-TO-END AUTOMATED TEST & HEALTH VALIDATION SUITE" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$TotalPassed = 0
$TotalFailed = 0

function Assert-Test {
    param(
        [string]$TestName,
        [scriptblock]$Action
    )
    Write-Host " [RUNNING] $TestName..." -NoNewline
    try {
        & $Action
        Write-Host " [PASS]" -ForegroundColor Green
        $global:TotalPassed++
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $global:TotalFailed++
    }
}

# 1. Microservice Health
Assert-Test "1.1 Backend Healthcheck (/actuator/health)" {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -TimeoutSec 5
    if ($res.status -ne "UP") { throw "Backend status is not UP: $($res.status)" }
}

Assert-Test "1.2 AI Semantic Service (/ai/v1/health)" {
    $res = Invoke-RestMethod -Uri "http://localhost:8000/ai/v1/health" -TimeoutSec 5
    if ($res.status -ne "UP" -or -not $res.modelLoaded) { throw "AI service offline or model not loaded" }
}

Assert-Test "1.3 Frontend Web Portal (http://localhost:4200)" {
    $res = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -TimeoutSec 5
    if ($res.StatusCode -ne 200) { throw "Frontend returned status $($res.StatusCode)" }
}

# 2. Authentication & JWT Tokens
$Global:SeekerToken = ""
$Global:AdminToken = ""

Assert-Test "2.1 Seeker Authentication & Token Generation" {
    $body = @{ emailOrUsername = "seeker1@ethiobridge.et"; password = "password123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.token -or -not ($res.roles -contains "SEEKER")) { throw "Failed to generate valid seeker token" }
    $global:SeekerToken = $res.token
}

Assert-Test "2.2 Admin Authentication & Governance Token" {
    $body = @{ emailOrUsername = "admin@ethiobridge.et"; password = "password123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    if (-not $res.token -or -not ($res.roles -contains "ADMIN")) { throw "Failed to generate admin token" }
    $global:AdminToken = $res.token
}

# 3. Marketplace Browse & Public Listings
$Global:TestListingId = ""
Assert-Test "3.1 Browse Public Listings & Pagination" {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/listings?size=5"
    if ($res.data.Count -lt 1) { throw "No listings returned in marketplace" }
    $global:TestListingId = $res.data[0].id
}

# 4. AI Semantic Matching & Explainability
Assert-Test "4.1 AI Explainable Candidate Matching for Listing" {
    $headers = @{ Authorization = "Bearer $global:SeekerToken" }
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/listings/$global:TestListingId/candidates?method=SEMANTIC&k=3" -Headers $headers
    if (-not $res.results -or $res.results.Count -lt 1) { throw "AI matching returned empty candidate array" }
    if (-not $res.results[0].explanation.factors) { throw "Missing explainability factor breakdown" }
}

# 5. Chapa Payment Gateway Initialization
Assert-Test "5.1 Initialize Chapa Hosted Checkout Session" {
    $headers = @{ Authorization = "Bearer $global:SeekerToken" }
    $initBody = @{
        amount = 50.00;
        purpose = "CONNECTS_TOPUP:10";
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/payments/chapa/initialize" -Method Post -Body $initBody -ContentType "application/json" -Headers $headers
    if (-not $res.checkoutUrl -or -not $res.txRef) { throw "Chapa checkout initialization failed" }
}

# 6. Contracts & Escrow Milestone Protection
Assert-Test "6.1 Retrieve Seeker Contracts & Escrow Milestones" {
    $headers = @{ Authorization = "Bearer $global:SeekerToken" }
    $contracts = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/contracts" -Headers $headers
    if ($contracts.Count -lt 1) { throw "No active contracts found for seeker" }
    $firstContract = $contracts[0]
    if ($firstContract.milestones.Count -lt 1) { throw "Contract has no escrow milestones" }
}

# 7. Real-Time Chat & Direct Messaging
Assert-Test "7.1 Query Active Chat Threads & Unread Counts" {
    $headers = @{ Authorization = "Bearer $global:SeekerToken" }
    $threads = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/messages/threads" -Headers $headers
    if ($threads.Count -lt 1) { throw "No message threads returned" }
}

# 8. KYC Identity & Admin Governance Portal
Assert-Test "8.1 Admin National ID Verification Review Queue" {
    $headers = @{ Authorization = "Bearer $global:AdminToken" }
    $verifs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/verifications" -Headers $headers
    if ($verifs.Count -lt 1) { throw "No verifications in admin queue" }
}

# 9. Monetization & Platform Revenue Summary
Assert-Test "9.1 Financial Revenue Summary & Commission Tracking" {
    $headers = @{ Authorization = "Bearer $global:AdminToken" }
    $stats = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/monetization/stats" -Headers $headers
    if ($stats.totalRevenue -lt 1) { throw "Platform revenue calculation error" }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS: $TotalPassed PASSED, $TotalFailed FAILED" -ForegroundColor $(if ($TotalFailed -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($TotalFailed -gt 0) { exit 1 } else { exit 0 }
