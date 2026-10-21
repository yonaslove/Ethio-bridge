import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Application, Listing } from '../../models/models';

@Component({
  selector: 'app-applications-received',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container applications-page">
      <div class="page-top-nav">
        <a [routerLink]="['/listings', listingId]">← Back to Listing</a>
      </div>

      <div class="header-section" *ngIf="listing">
        <h1>Applications Received</h1>
        <p class="subtitle">Review, shortlist, and manage applicant statuses for <strong>{{ listing.title }}</strong></p>
      </div>

      <div *ngIf="loading" class="card text-center state-card">
        <p>Loading received applications...</p>
      </div>

      <div *ngIf="!loading && applications.length === 0" class="card empty-card text-center">
        <h3>No applications submitted yet</h3>
        <p>When candidates apply, their proposals and rates will appear here for review.</p>
        <a [routerLink]="['/listings', listingId, 'candidates']" class="btn btn-primary" style="margin-top: 1rem;">
          ✦ Discover Recommended Candidates with AI
        </a>
      </div>

      <div *ngIf="!loading && applications.length > 0" class="applications-list">
        <div *ngFor="let app of applications" class="card application-item">
          <div class="app-header">
            <div>
              <h3 class="applicant-name">{{ app.applicantName }}</h3>
              <div class="applicant-headline">{{ app.headline || 'Registered Provider' }}</div>
              <div class="applicant-email">{{ app.applicantEmail }}</div>
            </div>

            <div class="app-status-box">
              <span class="badge" [ngClass]="getStatusBadgeClass(app.status)">
                {{ app.status }}
              </span>
              <div class="proposed-rate" *ngIf="app.proposedRate">
                {{ app.proposedRate }} ETB
              </div>
            </div>
          </div>

          <div class="cover-note-box" *ngIf="app.coverNote">
            <strong>Cover Note:</strong>
            <p>{{ app.coverNote }}</p>
          </div>

          <div class="app-actions-row">
            <span class="submitted-date">Submitted on {{ app.createdAt | date:'mediumDate' }}</span>

            <div class="action-buttons">
              <!-- Shortlist button -->
              <button
                *ngIf="app.status === 'SUBMITTED'"
                (click)="updateStatus(app, 'SHORTLISTED')"
                class="btn btn-secondary btn-sm">
                Shortlist
              </button>

              <!-- Offer button -->
              <button
                *ngIf="app.status === 'SHORTLISTED' || app.status === 'SUBMITTED'"
                (click)="updateStatus(app, 'OFFERED')"
                class="btn btn-primary btn-sm">
                Make Offer
              </button>

              <!-- Accept button -->
              <button
                *ngIf="app.status === 'OFFERED'"
                (click)="updateStatus(app, 'ACCEPTED')"
                class="btn btn-dark btn-sm">
                Accept & Hire
              </button>

              <!-- Message Applicant -->
              <button
                (click)="messageApplicant(app)"
                class="btn btn-outline btn-sm">
                💬 Message
              </button>

              <a
                routerLink="/contracts"
                class="btn btn-primary btn-sm"
                *ngIf="app.status === 'ACCEPTED'">
                💳 Pay Provider with Chapa (Escrow)
              </a>
              <a
                routerLink="/contracts"
                class="btn btn-secondary btn-sm"
                *ngIf="app.status === 'OFFERED'">
                💳 Escrow Contract
              </a>

              <!-- Reject button -->
              <button
                *ngIf="app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && app.status !== 'WITHDRAWN'"
                (click)="updateStatus(app, 'REJECTED')"
                class="btn btn-outline btn-sm text-danger">
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .applications-page {
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
      color: var(--color-slate);
      margin-top: 0.25rem;
    }
    .state-card, .empty-card {
      padding: 4rem 2rem;
    }
    .applications-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .application-item {
      background: #FFFFFF;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .applicant-name {
      font-size: 1.25rem;
      margin-bottom: 0.2rem;
    }
    .applicant-headline {
      font-weight: 600;
      color: var(--color-slate);
      font-size: 0.9rem;
    }
    .applicant-email {
      font-size: 0.8rem;
      color: #888;
      margin-top: 0.2rem;
    }
    .app-status-box {
      text-align: right;
    }
    .proposed-rate {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-charcoal);
      margin-top: 0.4rem;
    }
    .cover-note-box {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem;
      font-size: 0.9rem;
    }
    .cover-note-box p {
      margin-top: 0.35rem;
      color: #444;
      line-height: 1.5;
    }
    .app-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
      flex-wrap: wrap;
      gap: 1rem;
    }
    .submitted-date {
      font-size: 0.8rem;
      color: var(--color-slate);
    }
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .text-danger {
      color: var(--color-danger);
      border-color: var(--color-danger);
    }
    .text-danger:hover {
      background-color: var(--color-danger);
      color: #FFFFFF;
    }
  `]
})
export class ApplicationsReceivedComponent implements OnInit {
  listingId = '';
  listing?: Listing;
  applications: Application[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.listingId = this.route.snapshot.paramMap.get('id') || '';
    if (this.listingId) {
      this.apiService.getListing(this.listingId).subscribe(l => this.listing = l);
      this.fetchApplications();
    }
  }

  fetchApplications(): void {
    this.loading = true;
    this.apiService.getApplicationsForListing(this.listingId).subscribe({
      next: (res) => {
        this.applications = res || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  messageApplicant(app: Application): void {
    this.apiService.createOrGetThread(
      app.applicantUserId,
      this.listingId,
      `Application for ${this.listing?.title || 'Listing'}`
    ).subscribe({
      next: (thread) => this.router.navigate(['/messages'], { queryParams: { threadId: thread.id } }),
      error: () => this.router.navigate(['/messages'])
    });
  }

  updateStatus(app: Application, targetStatus: string): void {
    this.apiService.updateApplicationStatus(app.id, targetStatus).subscribe({
      next: (updated) => {
        app.status = updated.status;
      }
    });
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
