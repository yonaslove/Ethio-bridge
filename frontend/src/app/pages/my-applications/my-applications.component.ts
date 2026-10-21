import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Application } from '../../models/models';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container my-apps-page">
      <div class="page-header">
        <h1>My Applications</h1>
        <p>Track the review, interview, and offer status of your submitted proposals</p>
      </div>

      <div *ngIf="loading" class="card text-center state-card">
        <p>Loading your applications...</p>
      </div>

      <div *ngIf="!loading && applications.length === 0" class="card empty-card text-center">
        <h3>You have not applied to any listings yet</h3>
        <p>Browse open opportunities or explore AI recommendations tailored to your profile.</p>
        <div class="flex justify-center gap-3" style="margin-top: 1.5rem;">
          <a routerLink="/browse" class="btn btn-secondary">Browse Listings</a>
          <a routerLink="/recommended" class="btn btn-primary">✦ View Recommendations</a>
        </div>
      </div>

      <div *ngIf="!loading && applications.length > 0" class="applications-grid">
        <div *ngFor="let app of applications" class="card app-card">
          <div class="app-card-top">
            <span class="badge" [ngClass]="getStatusBadgeClass(app.status)">
              {{ app.status }}
            </span>
            <span class="app-date">{{ app.createdAt | date:'mediumDate' }}</span>
          </div>

          <h3 class="app-listing-title">
            <a [routerLink]="['/listings', app.listingId]">{{ app.listingTitle }}</a>
          </h3>

          <div class="app-rate-row" *ngIf="app.proposedRate">
            <span class="rate-label">Proposed Rate:</span>
            <span class="rate-val">{{ app.proposedRate }} ETB</span>
          </div>

          <div class="app-note" *ngIf="app.coverNote">
            "{{ app.coverNote }}"
          </div>

          <div class="app-card-bottom">
            <a [routerLink]="['/listings', app.listingId]" class="btn btn-outline btn-sm">View Listing</a>
            <button
              *ngIf="app.status === 'OFFERED'"
              (click)="acceptOffer(app)"
              class="btn btn-primary btn-sm">
              ✓ Accept Offer
            </button>
            <a
              *ngIf="app.status === 'ACCEPTED'"
              routerLink="/contracts"
              class="btn btn-secondary btn-sm">
              💳 Escrow Contract
            </a>
            <button
              *ngIf="app.status !== 'ACCEPTED' && app.status !== 'WITHDRAWN'"
              (click)="withdraw(app.id)"
              class="btn btn-outline btn-sm btn-withdraw">
              Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-apps-page {
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
    .applications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }
    .app-card {
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .app-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .app-date {
      font-size: 0.8rem;
      color: var(--color-slate);
    }
    .app-listing-title {
      font-size: 1.2rem;
    }
    .app-listing-title a {
      color: var(--color-charcoal);
    }
    .app-listing-title a:hover {
      color: var(--color-cyan);
    }
    .app-rate-row {
      font-size: 0.9rem;
    }
    .rate-label {
      color: var(--color-slate);
      margin-right: 0.4rem;
    }
    .rate-val {
      font-weight: 700;
      color: var(--color-charcoal);
    }
    .app-note {
      font-size: 0.85rem;
      color: #666;
      font-style: italic;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.75rem;
      border-radius: 6px;
    }
    .app-card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
    }
    .btn-withdraw {
      color: var(--color-danger);
      border-color: rgba(211, 47, 47, 0.3);
    }
    .btn-withdraw:hover {
      background-color: var(--color-danger);
      color: #FFFFFF;
    }
  `]
})
export class MyApplicationsComponent implements OnInit {
  applications: Application[] = [];
  loading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchApplications();
  }

  fetchApplications(): void {
    this.loading = true;
    this.apiService.getMyApplications().subscribe({
      next: (res) => {
        this.applications = res || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  acceptOffer(app: Application): void {
    this.apiService.updateApplicationStatus(app.id, 'ACCEPTED').subscribe({
      next: (updated) => {
        app.status = updated.status;
      }
    });
  }

  withdraw(id: string): void {
    if (confirm('Are you sure you want to withdraw this application?')) {
      this.apiService.withdrawApplication(id).subscribe({
        next: () => this.fetchApplications()
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACCEPTED': return 'badge-status-open';
      case 'OFFERED': return 'badge-freelance';
      case 'SHORTLISTED': return 'badge-job';
      case 'REJECTED': case 'WITHDRAWN': return 'badge-status-closed';
      default: return 'badge-local';
    }
  }
}
