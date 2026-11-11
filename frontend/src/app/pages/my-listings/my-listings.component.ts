import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { Listing } from '../../models/models';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

      <!-- Professional In-App Promotion Modal -->
      <div *ngIf="promoteModalListing" class="modal-backdrop" (click)="closePromoteModal()">
        <div class="modal-window" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-badge">⭐ FEATURED LISTING</div>
            <h3>Promote to Featured</h3>
            <button class="modal-close-btn" (click)="closePromoteModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <p class="listing-target-title">
              <strong>Listing:</strong> {{ promoteModalListing.title }}
            </p>

            <div class="perks-grid">
              <div class="perk-item">
                <span class="perk-icon">📌</span>
                <div>
                  <strong>Top Marketplace Placement</strong>
                  <p>Pinned to the very top of search results and category feeds for 14 days.</p>
                </div>
              </div>
              <div class="perk-item">
                <span class="perk-icon">⚡</span>
                <div>
                  <strong>3x More Candidate Visibility</strong>
                  <p>Highlighted with a golden badge and prioritized in AI applicant matchmaking.</p>
                </div>
              </div>
              <div class="perk-item">
                <span class="perk-icon">📱</span>
                <div>
                  <strong>Instant Mobile Payment</strong>
                  <p>Pay 500 ETB seamlessly via Telebirr or Chapa mobile wallet.</p>
                </div>
              </div>
            </div>

            <div class="payment-method-selector">
              <label class="section-label">Select Payment Provider:</label>
              <div class="method-options">
                <label class="method-pill" [class.selected]="selectedPaymentMethod === 'TELEBIRR'">
                  <input type="radio" [(ngModel)]="selectedPaymentMethod" value="TELEBIRR" />
                  <span>Telebirr</span>
                </label>
                <label class="method-pill" [class.selected]="selectedPaymentMethod === 'CHAPA'">
                  <input type="radio" [(ngModel)]="selectedPaymentMethod" value="CHAPA" />
                  <span>Chapa / Card</span>
                </label>
              </div>
            </div>

            <div class="pricing-summary">
              <span>Promotion Duration: <strong>14 Days</strong></span>
              <span class="price-tag">500 ETB</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closePromoteModal()" [disabled]="promoting">
              Cancel
            </button>
            <button class="btn btn-primary btn-confirm-promote" (click)="confirmPromotion()" [disabled]="promoting">
              {{ promoting ? 'Processing...' : 'Confirm & Promote (500 ETB)' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="deleteListingId" class="modal-backdrop" (click)="deleteListingId = null">
        <div class="modal-window delete-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Delete Listing</h3>
            <button class="modal-close-btn" (click)="deleteListingId = null">✕</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to permanently delete this listing? This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="deleteListingId = null">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDeleteListing()">Delete Listing</button>
          </div>
        </div>
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

    /* Professional In-App Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-window {
      background: #FFFFFF;
      border-radius: 12px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      animation: modalFadeIn 0.2s ease-out;
    }
    .delete-modal {
      max-width: 440px;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid var(--color-border);
      position: relative;
    }
    .modal-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      color: #D97706;
      background: #FEF3C7;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-charcoal);
      margin: 0;
    }
    .modal-close-btn {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: none;
      border: none;
      font-size: 1.25rem;
      color: var(--color-slate);
      cursor: pointer;
      line-height: 1;
    }
    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .listing-target-title {
      font-size: 0.95rem;
      color: #334155;
      background: var(--color-surface-subtle);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border-left: 3px solid var(--color-primary);
    }
    .perks-grid {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .perk-item {
      display: flex;
      gap: 0.85rem;
      align-items: flex-start;
    }
    .perk-icon {
      font-size: 1.25rem;
      line-height: 1.2;
    }
    .perk-item strong {
      display: block;
      font-size: 0.875rem;
      color: var(--color-charcoal);
    }
    .perk-item p {
      font-size: 0.8rem;
      color: var(--color-slate);
      margin: 0.15rem 0 0;
    }
    .section-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-charcoal);
      display: block;
      margin-bottom: 0.5rem;
    }
    .method-options {
      display: flex;
      gap: 0.75rem;
    }
    .method-pill {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .method-pill.selected {
      border-color: var(--color-primary);
      background: rgba(28, 184, 205, 0.08);
      color: var(--color-primary);
    }
    .pricing-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: #FFFBEB;
      border: 1px dashed #FCD34D;
      border-radius: 8px;
      font-size: 0.9rem;
    }
    .price-tag {
      font-size: 1.15rem;
      font-weight: 800;
      color: #B45309;
    }
    .modal-footer {
      padding: 1rem 1.5rem 1.5rem;
      background: #F8FAFC;
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .btn-confirm-promote {
      background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
      border: none;
      color: #FFFFFF;
      font-weight: 700;
      padding: 0.6rem 1.25rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-danger {
      background: #EF4444;
      color: #FFFFFF;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
    }
  `]
})
export class MyListingsComponent implements OnInit {
  listings: Listing[] = [];
  loading = false;

  // Professional In-App Modal State
  promoteModalListing: Listing | null = null;
  selectedPaymentMethod: 'TELEBIRR' | 'CHAPA' = 'TELEBIRR';
  promoting = false;

  deleteListingId: string | null = null;

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
    this.deleteListingId = id;
  }

  confirmDeleteListing(): void {
    if (!this.deleteListingId) return;
    const targetId = this.deleteListingId;
    this.deleteListingId = null;

    this.apiService.deleteListing(targetId).subscribe({
      next: () => {
        this.toastService.info('Listing deleted successfully.', 'Deleted');
        this.fetchMyListings();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to delete listing.');
      }
    });
  }

  promoteToFeatured(l: Listing): void {
    this.promoteModalListing = l;
    this.selectedPaymentMethod = 'TELEBIRR';
    this.promoting = false;
  }

  closePromoteModal(): void {
    this.promoteModalListing = null;
    this.promoting = false;
  }

  confirmPromotion(): void {
    if (!this.promoteModalListing) return;
    const listing = this.promoteModalListing;
    this.promoting = true;

    this.apiService.promoteListingToFeatured(listing.id, this.selectedPaymentMethod).subscribe({
      next: () => {
        this.promoting = false;
        listing.isFeatured = true;
        this.closePromoteModal();
        this.toastService.success(
          `"${listing.title}" is now ⭐ FEATURED at the top of the marketplace!`,
          'Promotion Activated'
        );
      },
      error: (err) => {
        this.promoting = false;
        this.toastService.error(err.error?.message || 'Promotion failed. Please check your balance or try again.');
      }
    });
  }
}
