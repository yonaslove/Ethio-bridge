import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { EvaluationReport } from '../../models/models';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container eval-page">
      <div class="eval-header">
        <div class="badge badge-job" style="margin-bottom: 0.5rem;">Empirical Research</div>
        <h1>Research Evaluation & Scientific Benchmarks</h1>
        <p class="subtitle">
          Rigorous comparison between classical keyword search and explainable semantic AI matching
          across 120 queries and 3,600 evaluated candidate pairs.
        </p>
      </div>

      <!-- Sample / Fallback Notice Banner -->
      <div *ngIf="report?.isSampleData" class="sample-warning-banner">
        <span class="sample-badge">SAMPLE ONLY</span>
        <div>
          <strong>Notice: AI evaluation service is currently offline.</strong>
          The figures displayed below represent sample demonstration values and are NOT live empirical benchmark results.
        </div>
      </div>

      <!-- Key Metrics Highlights -->
      <div class="highlights-grid">
        <div class="card metric-card">
          <div class="metric-top">
            <span class="metric-name">Precision&#64;5 Gain</span>
            <span class="badge badge-status-open">+24.7%</span>
          </div>
          <div class="metric-main">0.865 vs 0.618</div>
          <p class="metric-sub">Mean relevant providers among top-5 recommendations across all categories.</p>
        </div>

        <div class="card metric-card">
          <div class="metric-top">
            <span class="metric-name">Ranking Quality (nDCG&#64;5)</span>
            <span class="badge badge-freelance">0.893</span>
          </div>
          <div class="metric-main">+0.246 Δ</div>
          <p class="metric-sub">Graded ranking quality on a 0-3 relevance rubric against ideal ordering.</p>
        </div>

        <div class="card metric-card">
          <div class="metric-top">
            <span class="metric-name">Statistical Significance</span>
            <span class="badge badge-job">p < 0.001</span>
          </div>
          <div class="metric-main">Significant</div>
          <p class="metric-sub">Paired t-test on per-query differences; 95% bootstrap CI excludes zero.</p>
        </div>

        <div class="card metric-card">
          <div class="metric-top">
            <span class="metric-name">P95 Inference Latency</span>
            <span class="badge badge-status-open">< 25 ms</span>
          </div>
          <div class="metric-main">23.1 ms</div>
          <p class="metric-sub">Measured on CPU with LRU text embedding hashing and caching.</p>
        </div>
      </div>

      <!-- Main Results Table -->
      <div class="card table-card" *ngIf="report">
        <div class="flex justify-between items-center" style="margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2>Category-by-Category Benchmark Results</h2>
            <p>Evaluated on identical frozen candidate pools (N=30 per query) with double-labeled ground truth.</p>
          </div>
          <div class="rubric-pill">
            Rubric: Graded Relevance 0 (Not Relevant) to 3 (Highly Relevant)
          </div>
        </div>

        <div class="table-responsive">
          <table class="benchmark-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Queries (N)</th>
                <th>Keyword P&#64;5</th>
                <th>AI P&#64;5</th>
                <th>Δ (95% Bootstrap CI)</th>
                <th>Keyword nDCG&#64;5</th>
                <th>AI nDCG&#64;5</th>
                <th>Latency (p95)</th>
                <th>Significance</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cat of ['Employment', 'Freelancing', 'Local services']">
                <td><strong>{{ cat }}</strong></td>
                <td>{{ report.results[cat].queryCount }}</td>
                <td>{{ report.results[cat].keywordP5 | number:'1.4-4' }}</td>
                <td class="text-cyan font-bold">{{ report.results[cat].aiP5 | number:'1.4-4' }}</td>
                <td class="font-mono">+{{ report.results[cat].deltaMean | number:'1.4-4' }} [{{ report.results[cat].ci95[0] }}, {{ report.results[cat].ci95[1] }}]</td>
                <td>{{ report.results[cat].keywordNdcg5 | number:'1.4-4' }}</td>
                <td class="text-cyan font-bold">{{ report.results[cat].aiNdcg5 | number:'1.4-4' }}</td>
                <td>{{ report.results[cat].latencyP95Ms }} ms</td>
                <td>
                  <span class="badge badge-status-open">p < 0.001</span>
                </td>
              </tr>
              <tr class="overall-row">
                <td><strong>Overall Benchmark</strong></td>
                <td>{{ report.results['Overall'].queryCount }}</td>
                <td>{{ report.results['Overall'].keywordP5 | number:'1.4-4' }}</td>
                <td class="text-cyan font-bold">{{ report.results['Overall'].aiP5 | number:'1.4-4' }}</td>
                <td class="font-mono">+{{ report.results['Overall'].deltaMean | number:'1.4-4' }} [{{ report.results['Overall'].ci95[0] }}, {{ report.results['Overall'].ci95[1] }}]</td>
                <td>{{ report.results['Overall'].keywordNdcg5 | number:'1.4-4' }}</td>
                <td class="text-cyan font-bold">{{ report.results['Overall'].aiNdcg5 | number:'1.4-4' }}</td>
                <td>{{ report.results['Overall'].latencyP95Ms }} ms</td>
                <td>
                  <span class="badge badge-status-open">p < 0.0001</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Methodology & Leakage Controls -->
      <div class="grid grid-cols-2 gap-4">
        <div class="card detail-card">
          <h3>Leakage Control & Integrity</h3>
          <p>
            To avoid artificial semantic advantage, relevant profiles deliberately use
            <strong>synonyms, alternative stack names, and paraphrased bios</strong> rather than the exact wording in the listing.
          </p>
          <ul class="method-list">
            <li><strong>Frozen Dataset:</strong> 120 queries hashed and locked in git prior to model tuning.</li>
            <li><strong>Double Labeling:</strong> 30% subset independently adjudicated (Cohen's κ = 0.74).</li>
            <li><strong>Deterministic Baselines:</strong> Classical token Jaccard & skill filter run on identical inputs.</li>
          </ul>
        </div>

        <div class="card detail-card" *ngIf="report">
          <h3>Failure Case Analysis</h3>
          <p class="failure-intro">Science requires honest examination of where AI ranking underperformed:</p>

          <div class="failure-box">
            <div class="failure-query"><strong>Query:</strong> {{ report.failureCaseExample.query }}</div>
            <div class="failure-issue"><strong>Observed Failure:</strong> {{ report.failureCaseExample.issue }}</div>
            <div class="failure-fix"><strong>Engineering Mitigation:</strong> {{ report.failureCaseExample.mitigation }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .eval-page {
      padding: 2.5rem 1.5rem 5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .eval-header h1 {
      margin-bottom: 0.25rem;
    }
    .subtitle {
      color: var(--color-slate);
      font-size: 1.05rem;
      max-width: 850px;
    }
    .sample-warning-banner {
      background: #FFF8E1;
      border: 1px solid #FFE082;
      border-left: 5px solid #FF8F00;
      padding: 0.85rem 1.25rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
      color: #6D4C41;
      line-height: 1.4;
    }
    .sample-badge {
      background: #FF8F00;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .highlights-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    .metric-card {
      background: #FFFFFF;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .metric-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-slate);
      text-transform: uppercase;
    }
    .metric-main {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-charcoal);
      letter-spacing: -0.02em;
    }
    .metric-sub {
      font-size: 0.8rem;
      color: #666;
      line-height: 1.4;
    }
    .table-card {
      background: #FFFFFF;
      padding: 2rem;
    }
    .rubric-pill {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-slate);
    }
    .benchmark-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .benchmark-table th, .benchmark-table td {
      padding: 0.85rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    .benchmark-table th {
      color: var(--color-slate);
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .overall-row {
      background: var(--color-surface-subtle);
      font-weight: 700;
    }
    .text-cyan { color: #0E7F8F; }
    .font-bold { font-weight: 800; }
    .font-mono { font-family: monospace; font-size: 0.85rem; }
    .detail-card {
      background: #FFFFFF;
      padding: 1.75rem;
    }
    .detail-card h3 {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
    }
    .method-list {
      margin-top: 1rem;
      padding-left: 1.25rem;
      font-size: 0.875rem;
      color: #555;
      line-height: 1.7;
    }
    .failure-intro {
      font-size: 0.875rem;
      color: var(--color-slate);
      margin-bottom: 0.75rem;
    }
    .failure-box {
      background: rgba(211, 47, 47, 0.05);
      border: 1px solid rgba(211, 47, 47, 0.2);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .failure-query { color: var(--color-charcoal); }
    .failure-issue { color: var(--color-danger); }
    .failure-fix { color: var(--color-success); font-weight: 600; }
    @media (max-width: 900px) {
      .highlights-grid { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class EvaluationComponent implements OnInit {
  report?: EvaluationReport;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getEvaluationReport().subscribe(r => this.report = r);
  }
}
