import hashlib
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.evaluation.run_evaluation import run_evaluation, load_frozen_benchmark

client = TestClient(app)

def test_frozen_dataset_sha256_hash_integrity():
    eval_dir = Path(__file__).resolve().parent.parent / "app" / "evaluation"
    dataset_path = eval_dir / "benchmark_dataset.json"
    sha_path = eval_dir / "benchmark_dataset.sha256"

    assert dataset_path.exists(), "benchmark_dataset.json must exist"
    assert sha_path.exists(), "benchmark_dataset.sha256 must exist"

    hasher = hashlib.sha256()
    with open(dataset_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    actual_hash = hasher.hexdigest()

    expected_hash = sha_path.read_text(encoding="utf-8").strip().split()[0]
    assert actual_hash == expected_hash, f"SHA-256 seal mismatch! Expected: {expected_hash}, Actual: {actual_hash}"

def test_inter_annotator_cohens_kappa():
    eval_dir = Path(__file__).resolve().parent.parent / "app" / "evaluation"
    adj_path = eval_dir / "labels_adjudication.json"

    assert adj_path.exists(), "labels_adjudication.json must exist"
    with open(adj_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["totalQueries"] == 120
    assert meta["totalPairs"] == 3600
    assert meta["cohensKappa"] >= 0.70, f"Cohen's Kappa should be >= 0.70, was {meta['cohensKappa']}"
    assert meta["observedAgreement"] >= 0.80, f"Observed agreement should be >= 0.80, was {meta['observedAgreement']}"

def test_evaluation_reproducibility_and_significance():
    report = run_evaluation()

    assert report["datasetStatus"] == "FROZEN_CRYPTOGRAPHICALLY_VERIFIED"
    assert report["datasetSize"] == 120
    assert report["totalEvaluatedPairs"] == 3600

    overall = report["results"]["Overall"]

    # Precision@5 comparison
    assert overall["aiP5"] >= overall["keywordP5"], f"AI Precision@5 ({overall['aiP5']}) must meet or exceed keyword baseline ({overall['keywordP5']})"

    # Recall@5 superiority
    assert "aiRecall5" in overall
    assert overall["aiRecall5"] >= overall["keywordRecall5"]

    # nDCG@5 ranking superiority
    assert overall["aiNdcg5"] >= overall["keywordNdcg5"]

    # 10,000 Bootstrap confidence interval & paired t-test
    assert overall["bootstrapIterations"] == 10000
    assert overall["ci95"][0] > 0, "Lower bound of 95% CI must be strictly positive"
    assert overall["pValue"] < 0.05, f"AI lift must be statistically significant at p < 0.05 (got p={overall['pValue']})"
    assert overall["significant"] is True

    # P95 Latency SLA (< 50ms)
    assert overall["latencyP95Ms"] < 50.0

def test_empirical_fat_ml_fairness_audit():
    report = run_evaluation()
    fairness = report["empiricalFairnessAudit"]

    assert fairness["overallCompliance"] == "FULL_FAT_ML_COMPLIANCE"
    assert fairness["genderProxyDisparateImpact"] >= 0.75, "EEOC disparate impact violated on gender proxy"
    assert fairness["genderStatus"] == "PASS"

    regions = fairness["regionalClusters"]
    assert len(regions) >= 6
    for reg in regions:
        assert reg["disparateImpactRatio"] >= 0.70, f"Region {reg['region']} failed four-fifths standard ({reg['disparateImpactRatio']})"
        assert reg["fourFifthsStatus"] == "PASS"

def test_health_endpoint_verifies_model_execution():
    resp = client.get("/ai/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "UP"
    assert data["modelLoaded"] is True
    assert data["features"]["sublinearTfidfChar3Gram"] is True
    assert data["features"]["frozenBenchmarkAvailable"] is True
    assert data["features"]["smokeTestCosineSimilarity"] > 0.0

def test_dynamic_fairness_endpoint():
    resp = client.get("/ai/v1/fairness")
    assert resp.status_code == 200
    data = resp.json()
    assert data["auditType"] == "EMPIRICAL_FROZEN_BENCHMARK_AUDIT"
    assert data["fourFifthsStandardMet"] is True
    assert len(data["regionsEvaluated"]) >= 6
