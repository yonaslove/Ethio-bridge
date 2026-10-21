import os

os.environ.setdefault("INTERNAL_TOKEN", "test-internal-token")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:4200")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
TOKEN = os.environ["INTERNAL_TOKEN"]
HEADERS = {"X-Internal-Token": TOKEN}

LISTING = {
    "id": "l1",
    "title": "Senior Java engineer",
    "description": "Build microservices with Java, Spring Boot and PostgreSQL",
    "locationId": 1,
    "isRemote": True,
    "availabilityRequired": "FULL_TIME",
    "seniority": "SENIOR",
    "budgetMin": 50000,
    "budgetMax": 80000,
    "skills": [
        {"name": "Java", "requirement": "REQUIRED", "weight": 1.0},
        {"name": "Spring Boot", "requirement": "REQUIRED", "weight": 1.0},
        {"name": "Docker", "requirement": "PREFERRED", "weight": 0.5},
    ],
}

JAVA_CANDIDATE = {
    "providerProfileId": "p-java",
    "displayName": "Dawit T.",
    "text": "Senior software engineer with 6 years of Java Spring Boot and PostgreSQL experience",
    "yearsExperience": 6,
    "locationId": 1,
    "availability": "FULL_TIME",
    "hourlyRate": 1500,
    "categoryFocus": "TECH",
    "skills": [
        {"name": "Java", "proficiency": 5, "yearsExperience": 6},
        {"name": "Spring Boot", "proficiency": 5, "yearsExperience": 5},
        {"name": "PostgreSQL", "proficiency": 4, "yearsExperience": 4},
    ],
}

PLUMBER_CANDIDATE = {
    "providerProfileId": "p-plumber",
    "displayName": "Selam A.",
    "text": "Plumber offering pipefitting and bathroom installation in Addis Ababa",
    "yearsExperience": 4,
    "locationId": 2,
    "availability": "PART_TIME",
    "hourlyRate": 300,
    "categoryFocus": "TRADES",
    "skills": [
        {"name": "Pipefitting", "proficiency": 4, "yearsExperience": 4},
        {"name": "Plumbing", "proficiency": 5, "yearsExperience": 4},
    ],
}


def match_payload():
    return {"listing": LISTING, "candidates": [PLUMBER_CANDIDATE, JAVA_CANDIDATE], "k": 2, "options": {"explain": True}}


def test_health_reports_model_loaded():
    res = client.get("/ai/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "UP"
    assert body["modelLoaded"] is True
    assert body["modelName"]
    assert body["modelVersion"]


def test_match_rejects_missing_token():
    res = client.post("/ai/v1/match", json=match_payload())
    assert res.status_code == 401


def test_match_rejects_wrong_token():
    res = client.post("/ai/v1/match", json=match_payload(), headers={"X-Internal-Token": "wrong"})
    assert res.status_code == 401


def test_analyze_listing_rejects_missing_token():
    res = client.post("/ai/v1/analyze/listing", json={"title": "t", "description": "d", "skills": []})
    assert res.status_code == 401


def test_match_ranks_relevant_candidate_first_with_explanation():
    res = client.post("/ai/v1/match", json=match_payload(), headers=HEADERS)
    assert res.status_code == 200
    body = res.json()

    results = body["results"]
    assert [r["providerProfileId"] for r in results] == ["p-java", "p-plumber"]
    assert [r["rank"] for r in results] == [1, 2]
    assert results[0]["score"] > results[1]["score"]

    explanation = results[0]["explanation"]
    assert explanation["summary"]
    factor_names = {f["name"] for f in explanation["factors"]}
    assert {"skill.match", "availability", "location", "experience", "budget", "semantic.relevance"} <= factor_names
    total_weight = sum(f["weight"] for f in explanation["factors"])
    assert abs(total_weight - 1.0) < 0.01


def test_match_is_deterministic():
    first = client.post("/ai/v1/match", json=match_payload(), headers=HEADERS).json()
    second = client.post("/ai/v1/match", json=match_payload(), headers=HEADERS).json()

    assert [r["providerProfileId"] for r in first["results"]] == [r["providerProfileId"] for r in second["results"]]
    assert [r["score"] for r in first["results"]] == [r["score"] for r in second["results"]]


def test_match_respects_k():
    res = client.post("/ai/v1/match", json=match_payload() | {"k": 1}, headers=HEADERS)
    assert res.status_code == 200
    assert len(res.json()["results"]) == 1


def test_analyze_listing_extracts_required_and_preferred_skills():
    res = client.post("/ai/v1/analyze/listing", json=LISTING, headers=HEADERS)
    assert res.status_code == 200
    body = res.json()
    assert set(body["requiredSkills"]) == {"Java", "Spring Boot"}
    assert body["preferredSkills"] == ["Docker"]


def test_analyze_listing_falls_back_to_description_heuristic():
    res = client.post(
        "/ai/v1/analyze/listing",
        json={"title": "Plumber needed", "description": "Need plumbing work with pipefitting", "skills": []},
        headers=HEADERS,
    )
    assert res.status_code == 200
    assert "Plumbing" in res.json()["requiredSkills"]


def test_analyze_profile_extracts_skills_and_years():
    res = client.post(
        "/ai/v1/analyze/profile",
        json={"profileText": "Java Spring Boot developer with 5 years experience in Docker"},
        headers=HEADERS,
    )
    assert res.status_code == 200
    body = res.json()
    names = {s["name"] for s in body["skills"]}
    assert {"Java", "Spring Boot", "Docker"} <= names
    assert body["yearsExperience"] == 5
