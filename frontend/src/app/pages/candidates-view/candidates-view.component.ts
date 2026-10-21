import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Listing, MatchRunResponse, CandidateMatchResult } from '../../models/models';

@Component({
  selector: 'app-candidates-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container candidates-page">
      <div class="page-top-nav">
        <a [routerLink]="['/listings', listingId]">← Back to Listing</a>
      </div>

      <div class="header-section" *ngIf="listing">
        <div class="flex justify-between items-center flex-wrap gap-4">
          <div>
            <div class="badge badge-job" style="margin-bottom: 0.5rem;">{{ listing.listingType }}</div>
            <h1>Candidates & Recommendations</h1>
            <p class="subtitle">Comparing explainable semantic AI recommendations with keyword baseline for <strong>{{ listing.title }}</strong></p>
          </div>

          <!-- Method Switcher Pills -->
          <div class="method-toggle-container">
            <button
              [class.active]="selectedMethod === 'ai'"
              (click)="setMethod('ai')"
              class="method-btn btn-ai">
              ✦ AI Semantic Matching
            </button>
            <button
              [class.active]="selectedMethod === 'keyword'"
              (click)="setMethod('keyword')"
              class="method-btn btn-kw">
              Keyword Baseline
            </button>
          </div>
        </div>

        <!-- Meta Bar -->
        <div class="card meta-bar" *ngIf="matchResponse">
          <div class="meta-stat">
            <span class="meta-label">Active Method</span>
            <span class="meta-value">{{ matchResponse.method }}</span>
          </div>
          <div class="meta-stat">
            <span class="meta-label">Embedding Model</span>
            <span class="meta-value font-mono">{{ matchResponse.model }}</span>
          </div>
          <div class="meta-stat">
            <span class="meta-label">Latency</span>
            <span class="meta-value text-green">{{ matchResponse.latencyMs }} ms</span>
          </div>
          <div class="meta-stat" *ngIf="matchResponse.degraded">
            <span class="meta-label">Degraded Fallback</span>
            <span class="meta-value text-orange">Active</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center card state-card">
        <p>Ranking provider candidates with {{ selectedMethod.toUpperCase() }} engine...</p>
      </div>

      <!-- Candidates List -->
      <div *ngIf="!loading && matchResponse" class="candidates-container">
        <div *ngIf="matchResponse.results.length === 0" class="card empty-card text-center">
          <h3>No eligible candidates found</h3>
          <p>No providers in the candidate pool currently match this listing's criteria.</p>
        </div>

        <div *ngFor="let cand of matchResponse.results" class="card candidate-card">
          <div class="cand-header">
            <div class="cand-rank-badge">#{{ cand.rank }}</div>
            <div class="cand-info">
              <h3 class="cand-name">{{ cand.displayName }}</h3>
              <div class="cand-headline">{{ cand.headline || 'Independent Professional' }}</div>
              <div class="cand-loc" *ngIf="cand.locationName">📍 {{ cand.locationName }}</div>
            </div>

            <!-- Score Circle / Badge -->
            <div class="cand-score-box">
              <div class="score-percent">{{ (cand.score * 100) | number:'1.0-0' }}%</div>
              <div class="score-label">Match Score</div>
            </div>
          </div>

          <!-- Explanation Summary -->
          <div class="explanation-box" *ngIf="cand.explanation">
            <div class="exp-summary">
              <strong>Match Analysis:</strong> {{ cand.explanation.summary }}
            </div>

            <!-- Factor Breakdown Grid -->
            <div class="factors-grid">
              <div *ngFor="let factor of cand.explanation.factors" class="factor-card">
                <div class="factor-top">
                  <span class="factor-name">{{ formatFactorName(factor.name) }}</span>
                  <span class="factor-weight">weight: {{ factor.weight | number:'1.2-2' }}</span>
                </div>
                <div class="factor-bar">
                  <div class="factor-progress" [style.width.%]="factor.contribution * 100"></div>
                </div>
                <div class="factor-detail">
                  {{ factor.detail }}
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="cand-footer">
            <div class="cand-bio-snippet" *ngIf="cand.bio">
              "{{ cand.bio | slice:0:130 }}..."
            </div>
            <a [routerLink]="['/providers', cand.providerProfileId]" class="btn btn-secondary btn-sm">
              View Full Profile
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .candidates-page {
      padding: 2.5rem 1.5rem 5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .page-top-nav {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .subtitle {
      font-size: 1.05rem;
      color: var(--color-slate);
      margin-top: 0.25rem;
    }
    .method-toggle-container {
      display: flex;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.35rem;
      border-radius: 10px;
      gap: 0.35rem;
    }
    .method-btn {
      padding: 0.6rem 1.25rem;
      font-weight: 700;
      font-size: 0.875rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background: transparent;
      color: var(--color-slate);
      transition: all 0.2s ease;
    }
    .method-btn.active.btn-ai {
      background: var(--color-charcoal);
      color: #FFFFFF;
      box-shadow: 0 2px 6px rgba(65, 63, 61, 0.25);
    }
    .method-btn.active.btn-kw {
      background: var(--color-slate);
      color: #FFFFFF;
      box-shadow: 0 2px 6px rgba(105, 113, 132, 0.25);
    }
    .meta-bar {
      display: flex;
      gap: 3rem;
      padding: 1rem 1.5rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
      background: #FFFFFF;
    }
    .meta-stat {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--color-slate);
      letter-spacing: 0.04em;
    }
    .meta-value {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-charcoal);
    }
    .font-mono {
      font-family: monospace;
      font-size: 0.85rem;
    }
    .text-green { color: var(--color-success); }
    .text-orange { color: var(--color-warning); }
    .state-card, .empty-card {
      padding: 4rem 2rem;
    }
    .candidates-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .candidate-card {
      background: #FFFFFF;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .cand-header {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
    }
    .cand-rank-badge {
      width: 44px;
      height: 44px;
      background: var(--color-bg);
      border: 2px solid var(--color-border);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.25rem;
      color: var(--color-charcoal);
      flex-shrink: 0;
    }
    .cand-info {
      flex: 1 1 0%;
    }
    .cand-name {
      font-size: 1.35rem;
      margin-bottom: 0.2rem;
    }
    .cand-headline {
      font-weight: 600;
      color: var(--color-slate);
      font-size: 0.95rem;
    }
    .cand-loc {
      font-size: 0.825rem;
      color: #777;
      margin-top: 0.25rem;
    }
    .cand-score-box {
      text-align: right;
      background: var(--color-cyan-subtle);
      border: 1px solid rgba(28, 184, 205, 0.25);
      padding: 0.6rem 1.15rem;
      border-radius: 12px;
      flex-shrink: 0;
    }
    .score-percent {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0E7F8F;
      line-height: 1;
    }
    .score-label {
      font-size: 0.725rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-slate);
      margin-top: 0.2rem;
    }
    .explanation-box {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .exp-summary {
      font-size: 0.95rem;
      color: var(--color-charcoal);
    }
    .factors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    .factor-card {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      padding: 0.85rem;
      border-radius: 8px;
    }
    .factor-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .factor-name {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--color-charcoal);
    }
    .factor-weight {
      font-size: 0.725rem;
      color: var(--color-slate);
    }
    .factor-detail {
      font-size: 0.775rem;
      color: #666;
      margin-top: 0.35rem;
      line-height: 1.35;
    }
    .cand-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
      gap: 1rem;
      flex-wrap: wrap;
    }
    .cand-bio-snippet {
      font-size: 0.85rem;
      color: #666;
      font-style: italic;
      flex: 1 1 300px;
    }
  `]
})
export class CandidatesViewComponent implements OnInit {
  listingId = '';
  listing?: Listing;
  selectedMethod: 'ai' | 'keyword' = 'ai';
  matchResponse?: MatchRunResponse;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.listingId = this.route.snapshot.paramMap.get('id') || '';
    if (this.listingId) {
      this.apiService.getListing(this.listingId).subscribe(l => this.listing = l);
      this.fetchCandidates();
    }
  }

  setMethod(method: 'ai' | 'keyword'): void {
    if (this.selectedMethod !== method) {
      this.selectedMethod = method;
      this.fetchCandidates();
    }
  }

  fetchCandidates(): void {
    this.loading = true;
    this.apiService.getCandidates(this.listingId, this.selectedMethod, 5).subscribe({
      next: (res) => {
        this.matchResponse = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatFactorName(name: string): string {
    return name
      .replace('.', ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
