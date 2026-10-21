import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Listing } from '../../models/models';

@Component({
  selector: 'app-recommended-listings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container recommended-page">
      <div class="page-header">
        <div class="badge badge-freelance" style="margin-bottom: 0.5rem;">✦ AI Tailored</div>
        <h1>Recommended For You</h1>
        <p>Open listings matching your skills, availability, and preferred category focus</p>
      </div>

      <div *ngIf="loading" class="card text-center state-card">
        <p>Computing match vectors against open listings...</p>
      </div>

      <div *ngIf="!loading && listings.length === 0" class="card empty-card text-center">
        <h3>No recommendations available right now</h3>
        <p>Make sure your provider profile and skills are up-to-date.</p>
        <a routerLink="/profile/provider" class="btn btn-primary" style="margin-top: 1rem;">Update My Profile & Skills</a>
      </div>

      <div *ngIf="!loading && listings.length > 0" class="listings-grid">
        <div *ngFor="let l of listings; let i = index" class="card listing-card">
          <div class="listing-top">
            <span class="rank-tag">#{{ i + 1 }} Recommended</span>
            <span class="badge" [ngClass]="{
              'badge-job': l.listingType === 'JOB',
              'badge-freelance': l.listingType === 'FREELANCE_PROJECT',
              'badge-local': l.listingType === 'LOCAL_SERVICE_REQUEST'
            }">
              {{ l.listingType === 'JOB' ? 'Job' : l.listingType === 'FREELANCE_PROJECT' ? 'Freelance' : 'Local Service' }}
            </span>
          </div>

          <h3 class="listing-title">
            <a [routerLink]="['/listings', l.id]">{{ l.title }}</a>
          </h3>

          <p class="listing-desc">{{ l.description | slice:0:130 }}...</p>

          <div class="listing-skills-row" *ngIf="l.skills && l.skills.length > 0">
            <span *ngFor="let s of l.skills" class="skill-tag">
              {{ s.skillName }}
            </span>
          </div>

          <div class="listing-card-footer">
            <div class="rate-val">
              {{ l.budgetMax ? l.budgetMax + ' ' + l.currency : 'Negotiable' }}
            </div>
            <a [routerLink]="['/listings', l.id]" class="btn btn-primary btn-sm">Review & Apply →</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recommended-page {
      padding: 2.5rem 1.5rem 5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .page-header h1 {
      margin-bottom: 0.25rem;
    }
    .page-header p {
      color: var(--color-slate);
    }
    .state-card, .empty-card {
      padding: 4rem 2rem;
    }
    .listings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }
    .listing-card {
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .listing-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .rank-tag {
      font-weight: 800;
      color: var(--color-cyan);
      font-size: 0.825rem;
    }
    .listing-title {
      font-size: 1.2rem;
    }
    .listing-title a {
      color: var(--color-charcoal);
    }
    .listing-title a:hover {
      color: var(--color-cyan);
    }
    .listing-desc {
      font-size: 0.885rem;
      color: #555;
      line-height: 1.5;
    }
    .listing-skills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .skill-tag {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      color: var(--color-slate);
    }
    .listing-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 0.85rem;
      border-top: 1px solid var(--color-border);
    }
    .rate-val {
      font-weight: 700;
      color: var(--color-charcoal);
    }
  `]
})
export class RecommendedListingsComponent implements OnInit {
  listings: Listing[] = [];
  loading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getRecommendedListings('ai', 10).subscribe({
      next: (res) => {
        this.listings = res || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
