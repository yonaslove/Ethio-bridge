# Contributing

## 1. Workflow

1. Branch from `main`: `git switch -c feature/<short-name>`.
2. Keep changes scoped to one concern.
3. Run the relevant tests locally before pushing.
4. Open a PR describing what changed and which docs updated.

## 2. Commit messages

Use short, imperative subjects:

```text
backend: enforce audience validation on JWT
ai-service: add explanation factors to /match
docs: define graded relevance rubric
```

## 3. Code conventions

### Backend (Java / Spring Boot)
- Package root `com.ethiobridge`.
- Constructor injection; no field injection.
- Validate inputs at the boundary; return the standard error format.
- Ownership and role checks in the service layer.
- Never log tokens or sensitive payloads.

### Frontend (Angular)
- Feature-folder structure; typed API models.
- No client secrets; tokens attached via an interceptor.
- Render explanations from API data only.

### AI service (Python / FastAPI)
- Type hints + Pydantic models matching [docs/ai-contract.md](docs/ai-contract.md).
- Deterministic given a fixed model version and seed.
- No database access (stateless, per [docs/decisions.md](docs/decisions.md) D1).

## 4. Definition of done for a change

- Tests updated and passing.
- Contracts unchanged, or docs updated to match.
- No new secret committed.
- [docs/testing.md](docs/testing.md) checklist satisfied for the touched area.

## 5. Docs are part of the code

If behavior changes, update the corresponding doc in `docs/`. The doc set is the source of truth.
