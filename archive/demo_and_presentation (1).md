# Demo and Presentation Plan

## How to Present the Project to Evaluators and Staff

## 1. Core Message

> The system unifies employment, freelancing, and local services and
> evaluates whether explainable semantic matching can help users find
> more relevant providers than keyword search.

Do not claim perfection or superiority before measuring it.

## 2. Recommended 8--10 Minute Demo

1.  Problem and target users --- 1 minute.
2.  Three marketplace categories --- 1 minute.
3.  Employment scenario: request, baseline results, AI ranking,
    explanation --- 2 minutes.
4.  Freelancing scenario --- 1 minute.
5.  Local service scenario --- 1 minute.
6.  Evaluation method and actual results --- 2 minutes.
7.  Architecture, quality, limitations, conclusion --- 1 minute.

Adjust to the time limit assigned by the department.

## 3. Demo Scenarios

### Employment

A company seeks a junior backend developer with Java and SQL experience.
Use varied wording across profiles to make semantic matching meaningful.

### Freelancing

A client describes a responsive website project in ordinary language.
Show ranked freelancers with relevant skills and experience.

### Local service

A user needs a nearby electrician. Show that service type and location
constraints matter alongside text similarity.

Use synthetic or consented data and label it clearly.

## 4. Engineering Evidence to Show

-   Keycloak login and protected endpoint behavior.
-   A role-restricted action.
-   Flyway migration history or clean database startup.
-   Eureka dashboard/registration for services configured to use
    discovery.
-   Docker Compose startup.
-   Keyword baseline and AI results.
-   A recommendation explanation that reflects the actual matching
    factors.
-   Actual evaluation metrics and one failure case.

Do not spend the presentation mostly on login screens or code
walkthroughs.

## 5. Slide Structure

1.  Title and team.
2.  Problem and users.
3.  Existing approaches and the specific research gap.
4.  Objectives and research question.
5.  Proposed architecture and technology choices.
6.  Core user journeys.
7.  Matching method and explanation example.
8.  Evaluation dataset and methodology.
9.  Actual results by category.
10. Limitations, privacy, future work.
11. Conclusion and demo.

If experiments are not complete, title the slide "Evaluation Plan," not
"Results."

## 6. Likely Questions

**What is the novelty?**\
The research contribution is the design and evaluation of unified,
explainable matching across three categories---not the general idea of a
marketplace.

**Why AI?**\
Keyword search is the baseline; the experiment tests whether semantic
matching improves ranked relevance.

**How do you know results are relevant?**\
Use labeled relevance judgments and predefined ranking metrics.

**Why Keycloak?**\
It centralizes identity and token issuance so the marketplace does not
need to implement password handling itself. Spring Boot still enforces
API authorization.

**Why Flyway?**\
It versions schema changes and makes database setup reproducible.

**Why Eureka?**\
It provides service discovery for services configured to register with
it. Acknowledge that it adds overhead for a small system and explain the
project's reason for including it.

**What if AI performs worse?**\
Report the result honestly, analyze failure cases, and describe
improvements as future work.

## 7. Rehearsal Checklist

-   [ ] Seeded data is loaded and labeled.
-   [ ] All three demo scenarios work.
-   [ ] Keycloak login and authorization are reliable.
-   [ ] Flyway can initialize a clean database.
-   [ ] Eureka shows expected registered services.
-   [ ] AI and baseline results both work.
-   [ ] Explanations match real matching factors.
-   [ ] Metrics come from actual runs.
-   [ ] Local demo does not depend on external live services.
-   [ ] Backup screenshots/video are ready.
-   [ ] Team members can explain architecture and limitations.
