import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Listing } from '../../models/models';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container my-listings-page">
      <div class="flex justify-between items-center" style="margin-bottom: 2rem;">
        <div>
          <h1>My Posted Listings</h1>
          <p class="subtitle">Manage and review candidates for your published job openings and gigs</p>
        </div>
        <a routerLink="/listings/new" class="btn btn-primary">+ Post New Listing</a>
      </div>

      <div *ngIf="loading" class="card text-center state-card">
        <p>Loading your listings...</p>
      </div>

      <div *ngIf="!loading && listings.length === 0" class="card empty-card text-center">
        <h3>You have not created any listings yet</h3>
        <p>Create a job opening, freelance project, or local service request to find qualified Ethiopian providers.</p>
        <a routerLink="/listings/new" class="btn btn-primary" style="margin-top: 1rem;">Post Your First Listing</a>
      </div>

      <div *ngIf="!loading && listings.length > 0" class="listings-table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Pillar</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Created</th>
              <th>Candidates & Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of listings">
              <td>
                <a [routerLink]="['/listings', l.id]" class="listing-link">
                  <strong>{{ l.title }}</strong>
                </a>
              </td>
              <td>
                <span class="badge" [ngClass]="{
                  'badge-job': l.listingType === 'JOB',
                  'badge-freelance': l.listingType === 'FREELANCE_PROJECT',
                  'badge-local': l.listingType === 'LOCAL_SERVICE_REQUEST'
                }">
                  {{ l.listingType === 'JOB' ? 'Job' : l.listingType === 'FREELANCE_PROJECT' ? 'Freelance' : 'Local' }}
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="l.status === 'OPEN' ? 'badge-status-open' : 'badge-status-draft'">
                  {{ l.status }}
                </span>
              </td>
              <td>
                {{ l.budgetMax ? l.budgetMax + ' ' + l.currency : 'Negotiable' }}
              </td>
              <td class="text-slate">{{ l.createdAt | date:'shortDate' }}</td>
              <td>
                <div class="actions-cell">
                  <a [routerLink]="['/listings', l.id, 'candidates']" class="btn btn-primary btn-sm" title="AI Match">
                    ✦ AI Candidates
                  </a>
                  <a [routerLink]="['/listings', l.id, 'applications']" class="btn btn-secondary btn-sm">
                    Applications
                  </a>
                  <button
                    *ngIf="l.status === 'OPEN' && !l.isFeatured"
                    (click)="promoteToFeatured(l)"
                    class="btn btn-sm btn-featured-promote"
                    title="Pin to top of marketplace for 14 days">
                    ⭐ Promote (500 ETB)
                  </button>
                  <button *ngIf="l.status === 'DRAFT'" (click)="publish(l)" class="btn btn-outline btn-sm">
                    Publish
                  </button>
                  <button *ngIf="l.status === 'OPEN'" (click)="close(l)" class="btn btn-outline btn-sm">
                    Close
                  </button>
                  <button *ngIf="l.status !== 'OPEN'" (click)="deleteListing(l.id)" class="btn-remove-sm" title="Delete">
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .my-listings-page {
      padding: 2.5rem 1.5rem 5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .subtitle {
      color: var(--color-slate);
      margin-top: 0.25rem;
    }
    .state-card, .empty-card {
      padding: 4rem 2rem;
    }
    .listings-table-container {
      background: #FFFFFF;
      padding: 1.5rem;
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .data-table th, .data-table td {
      padding: 1rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    .data-table th {
      color: var(--color-slate);
      font-size: 0.775rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .listing-link {
      color: var(--color-charcoal);
    }
    .listing-link:hover {
      color: var(--color-cyan);
    }
    .text-slate { color: var(--color-slate); }
    .actions-cell {
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }
    .btn-remove-sm {
      background: none;
      border: none;
      color: var(--color-slate);
      cursor: pointer;
      font-weight: 800;
      padding: 0.3rem;
    }
    .btn-featured-promote {
      background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
      color: #FFFFFF;
      font-weight: 700;
      border: none;
      padding: 0.35rem 0.65rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.775rem;
      transition: all 0.2s ease;
    }
    .btn-featured-promote:hover {
      box-shadow: 0 2px 8px rgba(245, 124, 0, 0.4);
      transform: translateY(-1px);
    }
    .btn-remove-sm:hover {
      color: var(--color-danger);
    }
  `]
})
export class MyListingsComponent implements OnInit {
  listings: Listing[] = [];
  loading = false;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchMyListings();
  }

  fetchMyListings(): void {
    this.loading = true;
    this.apiService.getMyListings().subscribe({
      next: (res) => {
        this.listings = res || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  publish(l: Listing): void {
    this.apiService.publishListing(l.id).subscribe({
      next: (res) => {
        l.status = res.status;
        this.toastService.success(`Listing "${l.title}" published and now live!`, 'Listing Published');
      }
    });
  }

  close(l: Listing): void {
    this.apiService.closeListing(l.id).subscribe({
      next: (res) => {
        l.status = res.status;
        this.toastService.info(`Listing "${l.title}" closed.`, 'Listing Closed');
      }
    });
  }

  deleteListing(id: string): void {
    if (confirm('Are you sure you want to delete this listing?')) {
      this.apiService.deleteListing(id).subscribe({
        next: () => {
          this.toastService.info('Listing deleted successfully.', 'Deleted');
          this.fetchMyListings();
        }
      });
    }
  }

  promoteToFeatured(l: Listing): void {
    if (confirm(`Promote "${l.title}" to ⭐ FEATURED for 14 days (500 ETB via Telebirr)?`)) {
      this.apiService.promoteListingToFeatured(l.id, 'TELEBIRR').subscribe({
        next: () => {
          l.isFeatured = true;
          this.toastService.success('Your listing is now ⭐ FEATURED at the top of the marketplace!', 'Listing Promoted');
        },
        error: (err) => this.toastService.error(err.error?.message || 'Promotion failed.')
      });
    }
  }
}
