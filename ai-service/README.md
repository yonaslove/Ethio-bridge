# AI service — Python + FastAPI

Implements the contract in [../docs/ai-contract.md](../docs/ai-contract.md). Stateless; receives
candidate profiles from the backend and never accesses the database.

- Endpoints: `/ai/v1/health`, `/ai/v1/analyze/listing`, `/ai/v1/analyze/profile`, `/ai/v1/match`
- Model: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- Tests: `pytest`

Scaffold in Phase 6 ([../docs/roadmap.md](../docs/roadmap.md)).
