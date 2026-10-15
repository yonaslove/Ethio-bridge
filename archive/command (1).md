# Development Commands

## Angular + Spring Boot + PostgreSQL + Flyway + Keycloak + Eureka + Docker

Commands below are templates. Adjust paths, Java version, project
package, ports, and service names to match the actual repository.

## Suggested Repository Layout

``` text
project-root/
├── frontend/          # Angular
├── backend/           # Spring Boot marketplace API + Flyway migrations
├── ai-service/        # Python + FastAPI
├── eureka-server/     # Spring Cloud Netflix Eureka server, if separate
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerequisites

``` bash
git --version
node --version
npm --version
java --version
docker --version
docker compose version
python --version
```

## Run the Stack with Docker Compose

From the repository root:

``` bash
docker compose up --build
```

Run in background:

``` bash
docker compose up --build -d
```

View status and logs:

``` bash
docker compose ps
docker compose logs -f
docker compose logs -f backend
docker compose logs -f keycloak
docker compose logs -f eureka
docker compose logs -f ai-service
```

Stop services:

``` bash
docker compose down
```

Stop services and delete persisted local volumes (this removes local
database and identity-provider data):

``` bash
docker compose down -v
```

Only use `down -v` when you intentionally want to reset local data.

Actual service names depend on `docker-compose.yml`. If a service is
named differently, replace the command's service name.

## Angular Frontend

Run from `frontend/`:

``` bash
cd frontend
npm install
ng serve
```

Production build:

``` bash
npm run build
```

Configure the Angular OIDC client to use the Keycloak realm URL and
client ID from environment-specific configuration. Do not put client
secrets in a browser application.

## Spring Boot Backend

If Maven Wrapper is included, run from `backend/`:

``` bash
cd backend
./mvnw spring-boot:run
```

Windows Command Prompt:

``` bat
mvnw.cmd spring-boot:run
```

Tests:

``` bash
./mvnw test
```

Package:

``` bash
./mvnw clean package
```

Flyway migrations are commonly run by Spring Boot during application
startup when Flyway is configured. Check startup logs for migration
success. If Maven Flyway plugin goals are configured in the project, use
the project's documented migration command; do not assume a plugin is
installed.

## Eureka Server

If `eureka-server/` is a separate Spring Boot project:

``` bash
cd eureka-server
./mvnw spring-boot:run
```

If Eureka is included in Docker Compose, start it with the full stack
instead. The Eureka dashboard URL and port depend on your configuration.

## Keycloak

Prefer running Keycloak through Docker Compose so the realm and local
configuration are consistent:

``` bash
docker compose up -d keycloak
docker compose logs -f keycloak
```

Import or configure the application realm and Angular client using the
project's documented realm configuration. For local development, use a
development-only administrator password from an ignored `.env` file.
Never use development credentials in production.

## Python AI Service

Run from `ai-service/`:

``` bash
cd ai-service
python -m venv .venv
```

macOS/Linux:

``` bash
source .venv/bin/activate
```

Windows PowerShell:

``` powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Start FastAPI, assuming `main.py` exposes `app`:

``` bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Tests:

``` bash
pytest
```

## Git Workflow

``` bash
git status
git add .
git commit -m "Describe the change"
git pull
git push
```

Feature branch example:

``` bash
git switch -c feature/keycloak-authentication
```

## Safety Notes

-   Keep `.env` out of Git.
-   Commit `.env.example` with placeholder values only.
-   Never commit passwords, tokens, private keys, or production secrets.
-   Keycloak handles authentication; Spring Boot must still enforce API
    authorization.
-   Flyway migrations should be version-controlled.
-   Avoid `docker compose down -v` unless you intend to delete local
    persistent data.
