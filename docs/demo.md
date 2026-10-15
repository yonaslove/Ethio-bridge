# Demo and Presentation

## 1. Core message

> The system unifies employment, freelancing, and local services, and evaluates whether explainable
> semantic matching helps users find more relevant providers than keyword search.

Do not claim superiority before measuring it.

## 2. Recommended 8–10 minute demo

| Segment | Time |
| --- | --- |
| Problem and target users | 1 min |
| Three marketplace categories | 1 min |
| Employment scenario: request, baseline, AI ranking, explanation | 2 min |
| Freelancing scenario | 1 min |
| Local-service scenario | 1 min |
| Evaluation method and actual results | 2 min |
| Architecture, quality, limitations, conclusion | 1 min |

Adjust to the department's time limit.

## 3. Demo scenarios

- **Employment:** a company seeks a junior backend developer with Java and SQL. Use varied wording
  across profiles so semantic matching is meaningful.
- **Freelancing:** a client describes a responsive website project in ordinary language. Show ranked
  freelancers with relevant skills.
- **Local service:** a user needs a nearby electrician. Show that service type and location
  constraints matter alongside text similarity.

Use synthetic or consented data and label it clearly.

## 4. Engineering evidence to show

- Keycloak login and protected-endpoint behavior, plus a role-restricted action.
- Flyway migration history or clean database startup.
- Eureka registration for services configured to use discovery.
- Docker Compose startup.
- Keyword baseline and AI results side by side.
- A recommendation explanation reflecting the actual matching factors.
- Actual evaluation metrics and one failure case.

Do not spend the demo mostly on login screens or code walkthroughs.

## 5. Slide structure

1. Title and team.
2. Problem and users.
3. Existing approaches and the specific research gap.
4. Objectives and research question.
5. Proposed architecture and technology choices.
6. Core user journeys.
7. Matching method and explanation example.
8. Evaluation dataset and methodology.
9. Actual results by category.
10. Limitations, privacy, future work.
11. Conclusion and demo.

If experiments are incomplete, title the slide "Evaluation Plan," not "Results."

## 6. Likely questions

- **Novelty?** Design and evaluation of unified, explainable matching across three categories — not
  the general marketplace idea.
- **Why AI?** Keyword search is the baseline; the experiment tests whether semantic matching
  improves ranked relevance.
- **How are results verified?** Human relevance labels and predefined ranking metrics
  ([evaluation.md](evaluation.md)).
- **Why Keycloak?** Centralized identity; the app stores no passwords. The backend still enforces
  authorization.
- **Why Flyway?** Versioned, reproducible schema changes.
- **Why Eureka?** Discovery for registered services; acknowledge it adds overhead for a small system
  ([decisions.md](decisions.md) D2).
- **What if AI performs worse?** Report honestly, analyze failures, list improvements as future work.

## 7. Rehearsal checklist

- [ ] Seeded data loaded and labeled.
- [ ] All three scenarios work.
- [ ] Keycloak login and authorization reliable.
- [ ] Flyway initializes a clean database.
- [ ] Eureka shows expected registered services.
- [ ] AI and baseline results both work.
- [ ] Explanations match real matching factors.
- [ ] Metrics come from actual runs.
- [ ] Demo needs no external live services.
- [ ] Backup screenshots/video ready.
- [ ] Team can explain architecture and limitations.
