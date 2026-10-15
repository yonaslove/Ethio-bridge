# Research Evaluation Plan

## Comparing Keyword Search with AI Semantic Matching

## 1. Research Question

Does semantic AI-based matching improve the relevance of top-ranked
provider recommendations compared with keyword-based search across
employment, freelancing, and local services?

## 2. Methods Compared

**Baseline:** keyword-based search with documented matching and filters.

**Proposed method:** semantic matching that ranks provider profiles
against request requirements and returns explanations grounded in the
features actually used.

Both methods must use the same profiles, requests, and relevance labels.

## 3. Dataset

-   Create realistic requests for all three categories.
-   Include both relevant and irrelevant provider profiles.
-   Record human relevance judgments for each request-provider pair.
-   Freeze a held-out test set before final tuning.
-   Label synthetic data as synthetic.
-   Document dataset size, category distribution, labeling method, and
    limitations.
-   If possible, have a second reviewer independently label a subset.

## 4. Metrics

-   **Precision@5:** relevant results among the top five
    recommendations.
-   **Recall@5:** known relevant providers found in the top five divided
    by all known relevant providers, if labels are sufficiently
    complete.
-   **nDCG@5:** ranking quality when relevance has multiple grades.
-   **Latency:** response time measured consistently.
-   **Task time/user feedback:** optional if an appropriate, fair user
    study is feasible.

State the exact metric definitions, K, aggregation method, and number of
test requests before reporting results.

## 5. Procedure

1.  Freeze test requests, profiles, and labels.
2.  Run the keyword baseline.
3.  Run AI matching on the same cases.
4.  Save ranked outputs and timing.
5.  Calculate metrics using a repeatable script.
6.  Report per-category and overall results.
7.  Inspect success cases and failure cases.
8.  Document limitations and threats to validity.

## 6. Results Template

  -------------------------------------------------------------------------
  Category             Queries        Keyword AI Precision@5     Difference
                                  Precision@5                
  ------------- -------------- -------------- -------------- --------------
  Employment               TBD            TBD            TBD            TBD

  Freelancing              TBD            TBD            TBD            TBD

  Local                    TBD            TBD            TBD            TBD
  services                                                   

  Overall                  TBD            TBD            TBD            TBD
  -------------------------------------------------------------------------

Never invent results; populate this table from actual experiments.

## 7. System Reproducibility

Record the application version, AI model/version, matching parameters,
dataset version, and experiment script. Keep test data separate from
tuning data.

## 8. Limitations

Discuss representativeness of data, subjectivity/incompleteness of
labels, synthetic-data limitations, category differences, language
coverage, and any observed errors. Do not interpret similarity scores as
probabilities unless calibration is evaluated.

## 9. Responsible Data Use

Prefer synthetic or consented data. Minimize personal information,
restrict access to CVs, document retention/removal, and follow
supervisor/university requirements for user studies.
