# Local Setup

How to run the full stack on one machine.

## 1. Prerequisites

| Tool | Version |
| --- | --- |
| Git | 2.40+ |
| Node.js | 20 LTS+ |
| npm | 10+ |
| JDK | 21 |
| Maven | wrapper (`mvnw`) included in `backend/` and `eureka-server/` |
| Python | 3.11+ |
| Docker Desktop | with Compose v2 |

Verify:

```bash
git --version && node --version && npm --version && java --version && python --version && docker compose version
```

## 2. Get the code

```bash
git clone <repo-url> ethiobridge
cd ethiobridge
```

## 3. Environment

```bash
cp .env.example .env
```

Edit `.env` with local-only values. Never commit `.env` (it is git-ignored).

## 4. Run everything with Docker Compose

```bash
docker compose up --build
```

First startup order: `postgres` → `keycloak` → `eureka-server` → `ai-service` → `backend` → `frontend`.
The Keycloak realm is auto-imported from `infra/keycloak/ethiobridge-realm.json`.

Check health:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f ai-service
```

URLs: frontend http://localhost:4200, API http://localhost:8080/api/v1, AI http://localhost:8000/ai/v1,
Keycloak http://localhost:8180, Eureka http://localhost:8761.

## 5. Run a service manually (faster inner loop)

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Windows: `mvnw.cmd spring-boot:run`

Flyway migrations run on startup. Confirm "Successfully applied" in the logs.

### AI service

```bash
cd ai-service
python -m venv .venv
```

Activate: macOS/Linux `source .venv/bin/activate`, Windows PowerShell `.venv\Scripts\Activate.ps1`.

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

### Eureka server

```bash
cd eureka-server
./mvnw spring-boot:run
```

## 6. Database

- Migrations: `backend/src/main/resources/db/migration` (`V1__baseline_schema.sql`, ...).
- Schemas and columns: [data-model.md](data-model.md).
- Reset local data (destructive): `docker compose down -v` then `docker compose up`.

## 7. Common issues

| Symptom | Cause | Fix |
| --- | --- | --- |
| Backend `401` on every call | audience not in token | add the audience mapper ([identity.md](identity.md) §4) |
| Keycloak redirect loop | issuer URL mismatch | use `KEYCLOAK_PUBLIC_URL` consistently for browser and issuer |
| `connection refused` to AI | container not healthy yet | wait for `service_started`; check `ai-service` logs |
| Flyway checksum error | edited an applied migration | add a new migration instead |
| Port already in use | another local service | change `*_PORT` values in `.env` |
