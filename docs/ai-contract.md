# AI Service Contract

Internal contract between the Spring Boot backend and the FastAPI AI service.

- **Base path:** `/ai/v1`
- **Auth:** internal only. The service is not published to the host in production compose and is
  reachable only on the internal Docker network. A shared secret header `X-Internal-Token` is
  required on all endpoints except `GET /health` and `GET /evaluation`. Verification **fails
  closed**: if `INTERNAL_TOKEN` is unset or blank the protected endpoints return `500` rather than
  allowing anonymous access.
- **CORS:** browser access is limited to `ALLOWED_ORIGINS` (comma-separated, defaults to
  `http://localhost:4200,http://127.0.0.1:4200`) for the read-only evaluation view. Credentials are
  not allowed.
- **Statelessness:** the AI service does **not** access PostgreSQL. The backend supplies all
  candidate profiles in the request. See [decisions.md](decisions.md) D1.

## 1. Model

| Item | Value |
| --- | --- |
| Embedding model | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Similarity | Cosine similarity on normalized embeddings |
| Caching | In-process LRU keyed by text hash |
| Reported version | `model_name` + `model_version` echoed in every match response for reproducibility |

## 2. Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness + whether the model is loaded |
| POST | `/analyze/listing` | Extract structured requirements from a listing |
| POST | `/analyze/profile` | Extract skills/experience from free provider text |
| POST | `/match` | Score and rank candidate profiles against a listing |

## 3. POST /analyze/listing

Request:

```json
{
  "title": "Junior backend developer",
  "description": "Build REST services with Java and SQL. On-site in Addis Ababa.",
  "skills": [
    { "name": "Java", "requirement": "REQUIRED" },
    { "name": "SQL", "requirement": "REQUIRED" }
  ],
  "location": "Addis Ababa",
  "availabilityRequired": "FULL_TIME",
  "seniority": "JUNIOR",
  "budgetMin": 15000,
  "budgetMax": 25000
}
```

Response:

```json
{
  "requiredSkills": ["Java", "SQL"],
  "preferredSkills": [],
  "seniority": "JUNIOR",
  "location": "Addis Ababa",
  "availability": "FULL_TIME",
  "budget": { "min": 15000, "max": 25000, "currency": "ETB" }
}
```

## 4. POST /analyze/profile

Request:

```json
{ "profileText": "Backend engineer, 5 years, Java, Spring, PostgreSQL, REST APIs." }
```

Response:

```json
{
  "skills": [
    { "name": "Java", "confidence": 0.95 },
    { "name": "Spring", "confidence": 0.90 },
    { "name": "PostgreSQL", "confidence": 0.85 }
  ],
  "yearsExperience": 5
}
```

## 5. POST /match

The backend pre-filters a candidate pool (default cap 100) and sends it whole.

Request:

```json
{
  "listing": {
    "id": "c7a1...",
    "title": "Junior backend developer",
    "description": "Build REST services with Java and SQL.",
    "skills": [
      { "name": "Java", "requirement": "REQUIRED", "weight": 1.0 },
      { "name": "SQL", "requirement": "PREFERRED", "weight": 0.4 }
    ],
    "locationId": 1,
    "isRemote": false,
    "availabilityRequired": "FULL_TIME",
    "seniority": "JUNIOR"
  },
  "candidates": [
    {
      "providerProfileId": "p-100",
      "text": "Backend engineer, 5 years, Java, Spring, PostgreSQL.",
      "skills": [
        { "name": "Java", "proficiency": 5, "yearsExperience": 5 },
        { "name": "SQL", "proficiency": 4, "yearsExperience": 4 }
      ],
      "yearsExperience": 5,
      "locationId": 1,
      "availability": "FULL_TIME",
      "hourlyRate": 800.0,
      "categoryFocus": "EMPLOYMENT"
    }
  ],
  "k": 5,
  "options": { "explain": true }
}
```

Response:

```json
{
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "modelVersion": "1.0.0",
  "latencyMs": 210,
  "results": [
    {
      "providerProfileId": "p-100",
      "rank": 1,
      "score": 0.87,
      "explanation": {
        "summary": "Strong on required skills and availability.",
        "factors": [
          { "name": "skill.match", "value": "Java, SQL", "weight": 0.6, "contribution": 0.52, "detail": "2 of 2 required skills matched" },
          { "name": "availability", "value": "FULL_TIME", "weight": 0.2, "contribution": 0.2, "detail": "matches required availability" },
          { "name": "semantic.relevance", "value": 0.79, "weight": 0.2, "contribution": 0.16, "detail": "profile text close to listing text" }
        ]
      }
    }
  ]
}
```

### Scoring

`score = Σ (weight_i × contribution_i)`, normalized to `[0,1]`. Factor set:

- `skill.match` — overlap of required/preferred skills.
- `experience` — years vs. required seniority band.
- `location` — distance or `isRemote` (weight 0 when remote).
- `availability` — exact/partial match.
- `budget` — rate within budget (freelancing/local only).
- `semantic.relevance` — cosine similarity of listing text vs. profile text.

`score` is a **ranking score, not a probability**. It must not be presented as one.

### Explanation contract

Every factor must be computed by the algorithm; explanations must never be generated text
unrelated to actual factors. Each factor carries `name`, `value`, `weight`, `contribution`,
`detail`.

## 6. Failure and timeout behavior

- The backend calls the AI service with a timeout (default 1500 ms).
- On timeout, non-2xx, or malformed response, the backend falls back to keyword ranking and marks
  the API response `degraded: true` (see [api-contract.md](api-contract.md) §6).
- The AI service returns `503` with `{"error":"MODEL_NOT_READY"}` until the model is loaded.

## 7. Reproducibility

Every match response echoes `model` and `modelVersion`. The backend persists these in
`match_run` alongside `latency_ms` so experiments can be reproduced exactly (see
[evaluation.md](evaluation.md)).
