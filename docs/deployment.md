# Deployment and Operations

## 1. Environments

| Env | Purpose | Notes |
| --- | --- | --- |
| Local | Development | Docker Compose, dev credentials from `.env` |
| Demo | Graduation demo | Same compose stack, seeded, no external dependencies; AI service internal-only |
| Production | Out of scope for MVP | Documented only; not required for the project |

The project targets Local and Demo. Kubernetes and full production infrastructure are non-goals
([decisions.md](decisions.md), [roadmap.md](roadmap.md)).

## 2. Build artifacts

| Service | Artifact | Command |
| --- | --- | --- |
| Backend | Executable JAR | `./mvnw clean package` |
| Eureka | Executable JAR | `./mvnw clean package` |
| AI service | Container image | `docker build -t ethiobridge/ai-service ./ai-service` |
| Frontend | Static bundle + image | `npm run build`, then `docker build` |

## 3. Configuration and secrets

- All configuration via environment variables (see `.env.example`).
- Secrets are injected at runtime; never baked into images.
- Required production-like variables: `POSTGRES_*`, `KEYCLOAK_ADMIN_*`, `KEYCLOAK_REALM`,
  `KEYCLOAK_*_CLIENT_ID`, `AI_INTERNAL_TOKEN`, `CORS_ALLOWED_ORIGINS`.

## 4. Database migrations on deploy

- Flyway runs automatically on backend startup for the target database.
- Migrations are forward-only; never edit an applied script.
- On a fresh environment, the backend initializes the schema then applies seed data
  (`V2__seed_reference_data.sql`).

## 5. Networking

- In production-like compose, the AI service is **internal-only** (no host port).
- Only frontend, backend, and Keycloak are exposed on the host.
- The frontend reaches the backend through the configured `API_BASE_URL`.

## 6. Health and readiness

| Service | Endpoint |
| --- | --- |
| Backend | `/api/v1/health` (includes AI reachability) |
| AI service | `/ai/v1/health` |
| Keycloak | `/health/ready` |
| PostgreSQL | `pg_isready` |

Orchestration uses these for startup ordering and restarts.

## 7. Backup and restore (local/demo)

- Data lives in the `pgdata` named volume.
- Backup: `docker compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql`
- Restore: pipe `backup.sql` back into `psql`.
- Keycloak data persists in its own volume.
- `docker compose down -v` deletes both — use only to reset.

## 8. Rollback

- Revert to the previous git tag and redeploy; migrations are additive so older code keeps working
  where possible. If a migration must be undone, add a new forward migration.

## 9. Observability

- Structured logs with request IDs.
- Health endpoints above.
- Demo rehearsal uses seeded data so results reproduce.

## 10. Demo runbook

1. `docker compose up --build` from a clean checkout.
2. Confirm all health checks green.
3. Log in as seeded seeker and provider.
4. Run the employment, freelancing, and local-service scenarios ([demo.md](demo.md)).
5. Show baseline vs AI results and one explanation.
6. Show one failure case and the measured metrics.
