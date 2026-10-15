# Research Evaluation Plan

Comparing keyword search with AI semantic matching. This version fixes the gaps in the original
plan: sample size, graded relevance, significance, and label reliability are now specified.

## 1. Research question

Does semantic AI-based matching improve the relevance of top-ranked provider recommendations
compared with keyword-based search across employment, freelancing, and local services?

## 2. Methods compared

- **Baseline (`KEYWORD`):** documented token-overlap matching with filters.
- **Proposed (`AI`):** semantic matching that ranks providers against requirements and returns
  explanations grounded in factors actually used.

Both methods run on **identical** requests, candidate pools, and labels.

## 3. Dataset (frozen before tuning)

| Item | Value |
| --- | --- |
| Categories | Employment, Freelancing, Local services |
| Test requests per category | **40** (total **120**) |
| Candidate providers per request | **30** (mix of relevant and irrelevant), fixed pool |
| Total request–provider pairs | 120 × 30 = **3,600** |
| Relevance scale | graded `0–3` (see rubric) |
| Frozen set | requests + pools + labels frozen to git and hashed before final tuning |
| Data origin | synthetic, clearly labeled; varied phrasing to avoid leakage |

### Graded relevance rubric

| Grade | Meaning |
| --- | --- |
| 3 | Highly relevant — matches required skills and constraints; would be a strong recommendation |
| 2 | Relevant — matches most required skills; minor constraint gaps |
| 1 | Marginally relevant — related skills/domain but missing key requirements |
| 0 | Not relevant |

This rubric is what makes `nDCG@5` valid. The original dataset definition only had
relevant/irrelevant, which is inconsistent with reporting nDCG.

### Leakage control (critical)

The team must not write test requests and profiles with near-identical wording, or semantic matching
wins by an artifact. Rule: for each request, the relevant profiles use **different phrasing and
synonyms** than the request. This threat is also stated explicitly in the report.

## 4. Metrics (fixed in advance)

- **Precision@5** — relevant (`grade ≥ 1`) among top 5 / 5.
- **Recall@5** — known relevant in top 5 / all known relevant (reported only where labels are complete).
- **nDCG@5** — graded ranking quality using the `0–3` rubric.
- **Latency** — p50 and p95 per method, measured consistently.
- `K = 5`.

Aggregation: per-request metric, then mean per category and overall.

## 5. Label reliability

- **Double labelling:** a second reviewer independently labels a **30 % subset** (36 requests).
- Report **Cohen's κ**. Target κ ≥ 0.6; if lower, adjudicate disagreements and report the process.
- Report the single-label proportion explicitly rather than assuming a second reviewer.

## 6. Significance testing

With 120 requests, small Precision@5 gaps can be noise. For each metric:

- Compute the **paired** per-request difference (AI − keyword).
- Report a **bootstrap 95 % CI** (10,000 resamples) and a **paired t-test** (α = 0.05) on the
  per-request differences.
- Treat AI as better only if the CI excludes 0 and the test is significant; otherwise report "no
  significant difference."

## 7. Procedure

1. Freeze requests, pools, and labels (record git commit hash + dataset hash).
2. Run the keyword baseline; save ranked outputs + timing.
3. Run AI matching on the identical cases; save ranked outputs + timing + model version.
4. Compute metrics with a single repeatable script committed to the repo.
5. Report per-category and overall, with CIs and the significance result.
6. Inspect success and failure cases; include at least one failure example.
7. Document limitations and threats to validity.

## 8. Results template

| Category | Queries (N) | Keyword P@5 | AI P@5 | Δ (95 % CI) | AI nDCG@5 | Latency p95 (AI) | Signif.? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Employment | 40 | | | | | | |
| Freelancing | 40 | | | | | | |
| Local services | 40 | | | | | | |
| Overall | 120 | | | | | | |

Never invent results. Populate from actual runs only.

## 9. Reproducibility

Record: application version (git commit), model name/version, matching parameters, dataset hash,
and the evaluation script. Keep test data separate from any tuning data.

## 10. Limitations

Data representativeness, label subjectivity/incompleteness, synthetic-data bias, category
differences, language coverage (English-first; Amharic limited), and observed errors. Do not present
similarity scores as probabilities unless calibration is evaluated.

## 11. Responsible data use

Synthetic or consented data only. Minimize personal information, restrict CV/contact access,
document retention/removal, follow supervisor/university requirements for any user study.
