Set-Location "C:\Users\Hp\Desktop\folder\projects\ethioBridge"
$ErrorActionPreference = "Continue"

function Do-Commit {
    param(
        [string[]]$Paths,
        [string]$Message
    )
    foreach ($p in $Paths) {
        if (Test-Path $p) {
            git add $p
        }
    }
    $status = git status --porcelain
    if ($status) {
        git commit -m $Message
        Write-Host "Committed: $Message"
    } else {
        Write-Host "Skipped (no changes): $Message"
    }
}

# 1. Config & Docker
Do-Commit @(".gitignore", ".env.example") "chore(config): configure gitignore and environment variables template"
Do-Commit @("docker-compose.yml") "chore(docker): configure multi-container docker compose setup"
Do-Commit @("infra/keycloak") "feat(infra): add Keycloak realm configuration with test personas and roles"
Do-Commit @(".github", "scripts") "chore(ci): configure GitHub workflows and automation scripts"

# 2. Eureka Service Discovery
Do-Commit @("eureka-server") "feat(eureka): scaffold Netflix Eureka service discovery server"

# 3. AI Matching Service
Do-Commit @("ai-service/.dockerignore", "ai-service/Dockerfile", "ai-service/pytest.ini", "ai-service/requirements.txt", "ai-service/requirements-dev.txt") "feat(ai): configure Python AI matching service Dockerfile and dependencies"
Do-Commit @("ai-service/app/model.py", "ai-service/app/config.py") "feat(ai): implement TF-IDF sublinear char-3gram vectorizer model"
Do-Commit @("ai-service/app/matcher.py", "ai-service/app/schemas.py") "feat(ai): implement provider-to-listing semantic ranking engine"
Do-Commit @("ai-service/app/fairness.py") "feat(ai): implement FAT-ML fairness audit and demographic parity evaluation"
Do-Commit @("ai-service/app/main.py") "feat(ai): implement FastAPI endpoints for candidate scoring and health"
Do-Commit @("ai-service/tests") "test(ai): add unit and regression test suite for AI matching engine"

# 4. Backend Scaffold & DB Migrations
Do-Commit @("backend/.dockerignore", "backend/.mvn", "backend/Dockerfile", "backend/mvnw", "backend/mvnw.cmd", "backend/pom.xml") "chore(backend): initialize Spring Boot 3.3.4 project with Java 21 and Maven"
Do-Commit @("backend/src/main/resources/application.yml", "backend/src/main/java/com/ethiobridge/EthioBridgeApplication.java", "backend/src/main/java/com/ethiobridge/config") "feat(backend-config): configure Spring Boot docker profile and application properties"
Do-Commit @("backend/src/main/resources/db/migration/V1__init_schema.sql") "feat(db): add V1 flyway migration for core marketplace schema"
Do-Commit @("backend/src/main/resources/db/migration/V2__messaging_notifications.sql") "feat(db): add V2 migration for messaging threads and notification schema"
Do-Commit @("backend/src/main/resources/db/migration/V3__contracts_escrow.sql") "feat(db): add V3 migration for escrow contracts and milestones"
Do-Commit @("backend/src/main/resources/db/migration/V4__identity_verification.sql") "feat(db): add V4 migration for identity verification records"
Do-Commit @("backend/src/main/resources/db/migration/V5__reports_and_disputes.sql") "feat(db): add V5 migration for user reports and dispute arbitration"
Do-Commit @("backend/src/main/resources/db/migration/V6__compliance_audit_reviews.sql") "feat(db): add V6 migration for audit logs and GDPR compliance consent"
Do-Commit @("backend/src/main/resources/db/migration/V7__monetization_features.sql") "feat(db): add V7 migration for platform monetization and revenue ledger"
Do-Commit @("backend/src/main/resources/db/migration/V8__chapa_payment_gateways.sql") "feat(db): add V8 migration for Chapa payment gateway transactions"
Do-Commit @("backend/src/main/resources/db/migration/V9__saved_searches_and_reviews.sql") "feat(db): add V9 migration for saved searches and review ratings"
Do-Commit @("backend/src/main/resources/db/migration/V10__verification_ai_and_documents.sql") "feat(db): add V10 migration for AI verification and document attachments"
Do-Commit @("backend/src/main/resources/db/migration/V11__nullable_contract_id_and_connects_payment.sql") "feat(db): add V11 migration for nullable contract id on connects payment"

# 5. Backend Entities & Models
Do-Commit @("backend/src/main/java/com/ethiobridge/entity/AppUser.java", "backend/src/main/java/com/ethiobridge/model/Role.java", "backend/src/main/java/com/ethiobridge/model/UserStatus.java") "feat(entity): implement AppUser and role models"
Do-Commit @("backend/src/main/java/com/ethiobridge/entity/ServiceCategory.java", "backend/src/main/java/com/ethiobridge/entity/Skill.java", "backend/src/main/java/com/ethiobridge/entity/Location.java") "feat(entity): implement ServiceCategory, Skill, and Location entities"
Do-Commit @("backend/src/main/java/com/ethiobridge/entity/Listing.java", "backend/src/main/java/com/ethiobridge/entity/ListingSkill.java", "backend/src/main/java/com/ethiobridge/entity/Application.java", "backend/src/main/java/com/ethiobridge/entity/ApplicationAudit.java", "backend/src/main/java/com/ethiobridge/model/ApplicationStatus.java", "backend/src/main/java/com/ethiobridge/model/ListingStatus.java", "backend/src/main/java/com/ethiobridge/model/ListingType.java") "feat(entity): implement Listing and Proposal Application domain models"
Do-Commit @("backend/src/main/java/com/ethiobridge/entity/ProviderProfile.java", "backend/src/main/java/com/ethiobridge/entity/ProviderSkill.java", "backend/src/main/java/com/ethiobridge/entity/SeekerProfile.java") "feat(entity): implement ProviderProfile and SeekerProfile entities"
Do-Commit @("backend/src/main/java/com/ethiobridge/entity/Message.java", "backend/src/main/java/com/ethiobridge/entity/MessageThread.java", "backend/src/main/java/com/ethiobridge/entity/Notification.java") "feat(entity): implement Message, MessageThread, and Notification entities"
Do-Commit @("backend/src/main/java/com/ethiobridge/entity/Contract.java", "backend/src/main/java/com/ethiobridge/entity/ContractMilestone.java", "backend/src/main/java/com/ethiobridge/entity/Dispute.java") "feat(entity): implement Contract, ContractMilestone, and Dispute entities"
Do-Commit @("backend/src/main/java/com/ethiobridge/entity/PaymentTransaction.java", "backend/src/main/java/com/ethiobridge/entity/PlatformRevenue.java") "feat(entity): implement PaymentTransaction and PlatformRevenue entities"
Do-Commit @("backend/src/main/java/com/ethiobridge/entity/UserVerification.java", "backend/src/main/java/com/ethiobridge/entity/TrustReport.java", "backend/src/main/java/com/ethiobridge/entity/AuditLog.java", "backend/src/main/java/com/ethiobridge/entity/Review.java", "backend/src/main/java/com/ethiobridge/entity/UserConsent.java", "backend/src/main/java/com/ethiobridge/entity/SavedSearch.java", "backend/src/main/java/com/ethiobridge/entity/Match*.java") "feat(entity): implement UserVerification, TrustReport, AuditLog, and Review entities"

# 6. Backend Repositories, DTOs & Security
Do-Commit @("backend/src/main/java/com/ethiobridge/repository") "feat(repository): implement Spring Data JPA repositories for all entities"
Do-Commit @("backend/src/main/java/com/ethiobridge/dto") "feat(dto): implement request and response data transfer objects"
Do-Commit @("backend/src/main/java/com/ethiobridge/security") "feat(security): configure Keycloak JWT authentication, roles, and security filter chain"

# 7. Backend Services
Do-Commit @("backend/src/main/java/com/ethiobridge/service/UserService.java", "backend/src/main/java/com/ethiobridge/service/AuthService.java") "feat(service): implement UserService and AuthenticationService"
Do-Commit @("backend/src/main/java/com/ethiobridge/service/ListingService.java", "backend/src/main/java/com/ethiobridge/service/AiServiceClient.java") "feat(service): implement ListingService with AI candidate matching integration"
Do-Commit @("backend/src/main/java/com/ethiobridge/service/ApplicationService.java") "feat(service): implement ApplicationService for proposals, offers, and hiring"
Do-Commit @("backend/src/main/java/com/ethiobridge/service/MessageService.java", "backend/src/main/java/com/ethiobridge/service/NotificationService.java") "feat(service): implement MessageService and NotificationService"
Do-Commit @("backend/src/main/java/com/ethiobridge/service/ContractService.java") "feat(service): implement ContractService with escrow milestones and disputes"
Do-Commit @("backend/src/main/java/com/ethiobridge/service/PaymentService.java") "feat(service): implement PaymentService with Chapa gateway rail and simulated sandbox"
Do-Commit @("backend/src/main/java/com/ethiobridge/service/MonetizationService.java") "feat(service): implement MonetizationService with connects tokens, ledger and pro tier"
Do-Commit @("backend/src/main/java/com/ethiobridge/service/VerificationService.java", "backend/src/main/java/com/ethiobridge/service/AdminService.java", "backend/src/main/java/com/ethiobridge/service/ComplianceService.java", "backend/src/main/java/com/ethiobridge/service/AuditLogService.java", "backend/src/main/java/com/ethiobridge/service/ReviewService.java", "backend/src/main/java/com/ethiobridge/service/SavedSearchService.java", "backend/src/main/java/com/ethiobridge/service/TaxonomyService.java") "feat(service): implement VerificationService with multi-criteria AI identity auditor"

# 8. Backend Controllers & Tests
Do-Commit @("backend/src/main/java/com/ethiobridge/controller/AuthController.java", "backend/src/main/java/com/ethiobridge/controller/ListingController.java", "backend/src/main/java/com/ethiobridge/controller/ApplicationController.java", "backend/src/main/java/com/ethiobridge/controller/ProviderProfileController.java", "backend/src/main/java/com/ethiobridge/controller/SeekerProfileController.java") "feat(controller): implement AuthController, ListingController, and ApplicationController"
Do-Commit @("backend/src/main/java/com/ethiobridge/controller/MessageController.java", "backend/src/main/java/com/ethiobridge/controller/NotificationController.java", "backend/src/main/java/com/ethiobridge/controller/ContractController.java") "feat(controller): implement MessageController, NotificationController, and ContractController"
Do-Commit @("backend/src/main/java/com/ethiobridge/controller/PaymentController.java", "backend/src/main/java/com/ethiobridge/controller/MonetizationController.java", "backend/src/main/java/com/ethiobridge/controller/VerificationController.java") "feat(controller): implement PaymentController, MonetizationController, and VerificationController"
Do-Commit @("backend/src/main/java/com/ethiobridge/controller/AdminController.java", "backend/src/main/java/com/ethiobridge/controller/ComplianceController.java", "backend/src/main/java/com/ethiobridge/controller/TaxonomyController.java", "backend/src/main/java/com/ethiobridge/controller/ReviewController.java", "backend/src/main/java/com/ethiobridge/controller/SavedSearchController.java", "backend/src/main/java/com/ethiobridge/controller/ReportController.java") "feat(controller): implement AdminController, ComplianceController, and TaxonomyController"
Do-Commit @("backend/src/test") "test(backend): add unit and integration test suite for backend services"

# 9. Frontend Scaffold, Core Services & Shell
Do-Commit @("frontend/.dockerignore", "frontend/Dockerfile", "frontend/angular.json", "frontend/nginx.conf", "frontend/package.json", "frontend/package-lock.json", "frontend/public", "frontend/tsconfig.app.json", "frontend/tsconfig.json", "frontend/tsconfig.spec.json", "frontend/src/index.html", "frontend/src/main.ts", "frontend/src/styles.css", "frontend/src/app/app.config.ts", "frontend/src/app/app.routes.ts", "frontend/src/app/app.component.ts", "frontend/src/app/app.component.html", "frontend/src/app/app.component.css") "chore(frontend): scaffold Angular 18 standalone application and dependencies"
Do-Commit @("frontend/src/app/models", "frontend/src/app/services", "frontend/src/app/guards", "frontend/src/app/interceptors") "feat(frontend-core): implement AuthService, ApiService, I18nService, and models"
Do-Commit @("frontend/src/app/components") "feat(frontend-ui): implement Navbar and Footer components with bilingual support"

# 10. Frontend Feature Pages
Do-Commit @("frontend/src/app/pages/landing", "frontend/src/app/pages/listings-browse", "frontend/src/app/pages/recommended-listings", "frontend/src/app/pages/listing-detail", "frontend/src/app/pages/listing-create", "frontend/src/app/pages/my-listings") "feat(frontend-pages): implement Landing page, Browse listings, and Search filters"
Do-Commit @("frontend/src/app/pages/provider-profile", "frontend/src/app/pages/provider-detail", "frontend/src/app/pages/seeker-profile", "frontend/src/app/pages/candidates-view", "frontend/src/app/pages/evaluation", "frontend/src/app/pages/login", "frontend/src/app/pages/register", "frontend/src/app/pages/privacy", "frontend/src/app/pages/terms") "feat(frontend-pages): implement Provider, Seeker, and Candidate evaluation pages"
Do-Commit @("frontend/src/app/pages/messages", "frontend/src/app/pages/my-applications", "frontend/src/app/pages/applications-received") "feat(frontend-pages): implement Messaging inbox, My Applications, and Applications Received"
Do-Commit @("frontend/src/app/pages/contracts", "frontend/src/app/pages/verification", "frontend/src/app/pages/admin") "feat(frontend-pages): implement Contracts escrow with Chapa payment, AI Verification, and Admin Console"

# 11. Final Polish: Documentation & Remaining Files
Do-Commit @("README.md", "docs") "docs: update documentation with Chapa payment integration and verification engine"

# Final check: commit any remaining files if any
$rem = git status --porcelain
if ($rem) {
    git add .
    git commit -m "feat(marketplace): finalize full-stack EthioBridge freelance and local trade platform"
    Write-Host "Committed remaining files"
}

$commitCount = (git rev-list --count HEAD)
Write-Host "Total commits created: $commitCount"
