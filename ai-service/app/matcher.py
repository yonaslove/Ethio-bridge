import os
import re
import math
import hashlib
from collections import Counter
from typing import List, Tuple, Dict, Any

from app.schemas import (
    ListingDto,
    CandidateDto,
    MatchCandidateResult,
    Explanation,
    Factor
)

MODEL_NAME = os.getenv("MODEL_NAME", "sublinear-tfidf-char3gram-v1")
MODEL_VERSION = "1.0.0"

_text_cache: Dict[str, float] = {}

def compute_text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def normalize_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip().lower())

def extract_features(text: str) -> List[str]:
    """Tokenizes text into word unigrams and character 3-grams for robust subword/multilingual matching."""
    norm = normalize_text(text)
    words = re.findall(r"\b\w+\b", norm)
    features = list(words)
    for w in words:
        if len(w) >= 3:
            for i in range(len(w) - 2):
                features.append(w[i:i+3])
    return features

def calculate_semantic_similarity(listing_text: str, candidate_text: str) -> float:
    """Computes cosine similarity between listing text and candidate profile text."""
    if not listing_text.strip() or not candidate_text.strip():
        return 0.0

    cache_key = f"{compute_text_hash(listing_text)}_{compute_text_hash(candidate_text)}"
    if cache_key in _text_cache:
        return _text_cache[cache_key]

    f1 = extract_features(listing_text)
    f2 = extract_features(candidate_text)

    if not f1 or not f2:
        return 0.0

    c1 = Counter(f1)
    c2 = Counter(f2)

    # Sublinear term frequency (1 + log(count))
    v1 = {k: 1.0 + math.log(v) for k, v in c1.items()}
    v2 = {k: 1.0 + math.log(v) for k, v in c2.items()}

    common_keys = set(v1.keys()) & set(v2.keys())
    if not common_keys:
        sim = 0.0
    else:
        dot_product = sum(v1[k] * v2[k] for k in common_keys)
        norm1 = math.sqrt(sum(v * v for v in v1.values()))
        norm2 = math.sqrt(sum(v * v for v in v2.values()))
        sim = dot_product / (norm1 * norm2) if norm1 > 0 and norm2 > 0 else 0.0
        sim = max(0.0, min(1.0, sim))

    _text_cache[cache_key] = round(sim, 4)
    return _text_cache[cache_key]

def score_candidate(listing: ListingDto, candidate: CandidateDto) -> Tuple[float, Explanation]:
    factors: List[Factor] = []

    # 1. Skill Match
    candidate_skills = {s.name.strip().lower(): s for s in (candidate.skills or [])}
    req_skills = [s for s in (listing.skills or []) if (s.requirement or "REQUIRED").upper() == "REQUIRED"]
    pref_skills = [s for s in (listing.skills or []) if (s.requirement or "").upper() == "PREFERRED"]

    def matches_skill(s_name: str, cand_skills_set: dict) -> bool:
        r = s_name.strip().lower()
        r_tokens = set(re.findall(r"\b\w+\b", r))
        for c_name in cand_skills_set:
            if r == c_name:
                return True
            c_tokens = set(re.findall(r"\b\w+\b", c_name))
            if r_tokens == c_tokens:
                return True
            if len(r_tokens) == 1 and r in c_tokens:
                return True
            if len(c_tokens) == 1 and c_name in r_tokens:
                return True
        return False

    matched_req = []
    for s in req_skills:
        if matches_skill(s.name, candidate_skills):
            matched_req.append(s.name)

    matched_pref = []
    for s in pref_skills:
        if matches_skill(s.name, candidate_skills):
            matched_pref.append(s.name)

    total_req_count = len(req_skills)
    total_pref_count = len(pref_skills)

    if total_req_count > 0:
        req_ratio = len(matched_req) / total_req_count
    else:
        req_ratio = 1.0

    if total_pref_count > 0:
        pref_ratio = len(matched_pref) / total_pref_count
    else:
        pref_ratio = 1.0 if total_req_count == 0 else 0.0

    if total_req_count > 0 and total_pref_count > 0:
        skill_score = 0.8 * req_ratio + 0.2 * pref_ratio
    elif total_req_count > 0:
        skill_score = req_ratio
    elif total_pref_count > 0:
        skill_score = pref_ratio
    else:
        skill_score = 0.8

    all_matched = matched_req + matched_pref
    skill_val_display = ", ".join(all_matched) if all_matched else "None"
    skill_detail = f"{len(matched_req)} of {total_req_count} required skills matched" if total_req_count > 0 else "Relevant general skills matched"

    factors.append(Factor(
        name="skill.match",
        value=skill_val_display,
        weight=0.35,
        contribution=round(skill_score, 4),
        detail=skill_detail
    ))

    # 2. Availability Match
    req_avail = (listing.availabilityRequired or "FULL_TIME").upper()
    cand_avail = (candidate.availability or "FULL_TIME").upper()
    avail_score = 0.5
    avail_detail = "different availability"

    if cand_avail == "UNAVAILABLE":
        avail_score = 0.0
        avail_detail = "candidate currently unavailable"
    elif req_avail == cand_avail or cand_avail == "ANY":
        avail_score = 1.0
        avail_detail = f"matches required availability ({req_avail})"
    elif req_avail in ["PART_TIME", "HOURLY"] and cand_avail in ["PART_TIME", "HOURLY", "ONE_OFF"]:
        avail_score = 0.8
        avail_detail = "partially compatible flexible availability"
    else:
        avail_score = 0.4
        avail_detail = f"candidate offers {cand_avail} vs requested {req_avail}"

    factors.append(Factor(
        name="availability",
        value=cand_avail,
        weight=0.15,
        contribution=round(avail_score, 4),
        detail=avail_detail
    ))

    # 3. Location Match
    if listing.isRemote:
        loc_score = 1.0
        loc_val = "Remote"
        loc_detail = "remote listing accepts all locations"
        loc_weight = 0.05
    else:
        loc_weight = 0.15
        if listing.locationId is not None and candidate.locationId is not None:
            if listing.locationId == candidate.locationId:
                loc_score = 1.0
                loc_val = f"Location #{candidate.locationId}"
                loc_detail = "exact location match in local service zone"
            else:
                loc_score = 0.3
                loc_val = f"Location #{candidate.locationId}"
                loc_detail = "different location zone"
        else:
            loc_score = 0.7
            loc_val = "Unspecified"
            loc_detail = "location flexible or unspecified"

    factors.append(Factor(
        name="location",
        value=loc_val,
        weight=loc_weight,
        contribution=round(loc_score, 4),
        detail=loc_detail
    ))

    # 4. Experience Match
    cand_exp = candidate.yearsExperience or 0
    seniority = (listing.seniority or "ANY").upper()
    exp_score = 1.0
    exp_detail = "satisfies experience level"

    if seniority == "JUNIOR":
        if cand_exp >= 1:
            exp_score = 1.0
            exp_detail = f"{cand_exp} yrs experience matches junior requirements"
        else:
            exp_score = 0.7
            exp_detail = "entry level candidate"
    elif seniority == "MID":
        if cand_exp >= 3:
            exp_score = 1.0
            exp_detail = f"{cand_exp} yrs experience meets mid-level requirements"
        elif cand_exp >= 1:
            exp_score = 0.7
            exp_detail = f"{cand_exp} yrs experience slightly below mid-level"
        else:
            exp_score = 0.4
            exp_detail = "insufficient experience for mid-level"
    elif seniority == "SENIOR":
        if cand_exp >= 5:
            exp_score = 1.0
            exp_detail = f"{cand_exp} yrs experience matches senior requirements"
        elif cand_exp >= 3:
            exp_score = 0.7
            exp_detail = f"{cand_exp} yrs experience approaching senior level"
        else:
            exp_score = 0.3
            exp_detail = "junior profile for senior requirements"
    else:
        exp_score = min(1.0, 0.5 + (cand_exp * 0.1))
        exp_detail = f"{cand_exp} years overall experience"

    factors.append(Factor(
        name="experience",
        value=f"{cand_exp} years",
        weight=0.10,
        contribution=round(exp_score, 4),
        detail=exp_detail
    ))

    # 5. Budget Match
    budget_weight = 0.05
    if candidate.hourlyRate and listing.budgetMax:
        if candidate.hourlyRate <= listing.budgetMax:
            budget_score = 1.0
            budget_detail = f"rate {candidate.hourlyRate:.0f} within budget (max {listing.budgetMax:.0f})"
        elif candidate.hourlyRate <= listing.budgetMax * 1.2:
            budget_score = 0.6
            budget_detail = f"rate {candidate.hourlyRate:.0f} slightly above budget"
        else:
            budget_score = 0.2
            budget_detail = f"rate {candidate.hourlyRate:.0f} exceeds budget"
        budget_val = f"{candidate.hourlyRate:.0f} ETB/hr"
    else:
        budget_score = 0.8
        budget_val = "Compatible"
        budget_detail = "budget within acceptable bounds"

    factors.append(Factor(
        name="budget",
        value=budget_val,
        weight=budget_weight,
        contribution=round(budget_score, 4),
        detail=budget_detail
    ))

    # 6. Semantic Relevance
    listing_full_text = f"{listing.title} {listing.description}"
    candidate_skills_str = " ".join([s.name for s in (candidate.skills or [])])
    candidate_full_text = f"{candidate.text or ''} {candidate_skills_str} {candidate.categoryFocus or ''}"

    sem_sim = calculate_semantic_similarity(listing_full_text, candidate_full_text)
    sem_score = round(max(0.15, sem_sim), 4)

    factors.append(Factor(
        name="semantic.relevance",
        value=sem_score,
        weight=0.20,
        contribution=sem_score,
        detail="deep semantic alignment between listing requirements and provider background"
    ))

    # Re-normalize weights so sum(weights) == 1.0
    total_weight = sum(f.weight for f in factors)
    total_score = 0.0
    for f in factors:
        f.weight = round(f.weight / total_weight, 4)
        total_score += f.weight * f.contribution

    final_score = round(max(0.0, min(1.0, total_score)), 4)

    strengths = []
    if skill_score >= 0.7:
        strengths.append("required skills")
    if avail_score >= 0.8:
        strengths.append("availability")
    if sem_score >= 0.5:
        strengths.append("semantic relevance")
    if exp_score >= 0.9:
        strengths.append("experience level")

    if strengths:
        summary = f"Strong on {', '.join(strengths)}."
    else:
        summary = "Partial match across profile and listing requirements."

    explanation = Explanation(
        summary=summary,
        factors=factors
    )

    return final_score, explanation

def rank_candidates(listing: ListingDto, candidates: List[CandidateDto], k: int = 5) -> List[MatchCandidateResult]:
    scored_candidates = []
    for cand in candidates:
        score, explanation = score_candidate(listing, cand)
        scored_candidates.append((score, cand, explanation))

    scored_candidates.sort(key=lambda x: x[0], reverse=True)

    results = []
    for rank_idx, (score, cand, explanation) in enumerate(scored_candidates[:k], start=1):
        results.append(MatchCandidateResult(
            providerProfileId=cand.providerProfileId,
            rank=rank_idx,
            score=score,
            displayName=cand.displayName or f"Provider #{cand.providerProfileId[:8]}",
            explanation=explanation
        ))

    return results
