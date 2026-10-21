import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { ToastService } from '../../services/toast.service';
import { Listing, ProviderProfile } from '../../models/models';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container detail-page" *ngIf="listing">
      <div class="back-link">
        <a routerLink="/browse">{{ i18n.translate('← Back to Listings', '← ወደ ስራዎች ዝርዝር ይመለሱ') }}</a>
      </div>

      <div class="detail-layout">
        <!-- Main Content -->
        <div class="main-column">
          <div class="card detail-card">
            <div class="card-top-badges">
              <span *ngIf="listing.isFeatured" class="badge-featured">
                ⭐ {{ i18n.translate('FEATURED', 'ልዩ ማስታወቂያ') }}
              </span>
              <span class="badge" [ngClass]="{
                'badge-job': listing.listingType === 'JOB',
                'badge-freelance': listing.listingType === 'FREELANCE_PROJECT',
                'badge-local': listing.listingType === 'LOCAL_SERVICE_REQUEST'
              }">
                {{ listing.listingType === 'JOB' ? i18n.translate('Employment', 'መደበኛ ቅጥር') : listing.listingType === 'FREELANCE_PROJECT' ? i18n.translate('Freelance Project', 'የፍሪላንስ ፕሮጀክት') : i18n.translate('Local Service', 'የአካባቢ አገልግሎት') }}
              </span>
              <span class="badge badge-status-open">{{ listing.status }}</span>
            </div>

            <h1 class="listing-title">{{ listing.title }}</h1>
            <div class="listing-meta">
              <span>{{ i18n.translate('Posted by', 'አቅራቢው፡') }} <strong>{{ listing.ownerName || i18n.translate('Verified Seeker', 'የተረጋገጠ አሰሪ') }}</strong></span>
              <span>•</span>
              <span>{{ listing.createdAt | date:'mediumDate' }}</span>
              <span>•</span>
              <span>📍 {{ listing.locationName ? listing.locationName : (listing.isRemote ? i18n.translate('Remote', 'የርቀት') : 'Addis Ababa') }}</span>
            </div>

            <div class="detail-section">
              <h3>{{ i18n.translate('Description & Scope', 'የስራ ዝርዝር እና መግለጫ') }}</h3>
              <p class="description-text">{{ listing.description }}</p>
            </div>

            <!-- Required & Preferred Skills -->
            <div class="detail-section" *ngIf="listing.skills && listing.skills.length > 0">
              <h3>{{ i18n.translate('Required & Preferred Skills', 'አስፈላጊ እና ተመራጭ ክህሎቶች') }}</h3>
              <div class="skills-grid">
                <div *ngFor="let s of listing.skills" class="skill-item-card" [ngClass]="{'skill-req-card': s.requirement === 'REQUIRED'}">
                  <div class="skill-item-title">{{ s.skillName }}</div>
                  <div class="skill-item-type">{{ s.requirement }} (weight: {{ s.weight }})</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Actions & Details -->
        <div class="sidebar-column">
          <!-- Overview Card -->
          <div class="card overview-card">
            <h3>{{ i18n.translate('Overview', 'አጠቃላይ መረጃ') }}</h3>
            <div class="overview-item">
              <span class="label">{{ i18n.translate('Budget / Rate', 'በጀት / ክፍያ') }}</span>
              <span class="val highlight">
                {{ listing.budgetMin ? listing.budgetMin + ' - ' : '' }}{{ listing.budgetMax || i18n.translate('Negotiable', 'ተደራዳሪ') }} {{ listing.currency }}
              </span>
            </div>
            <div class="overview-item">
              <span class="label">{{ i18n.translate('Availability', 'የስራ ዝግጁነት') }}</span>
              <span class="val">{{ listing.availabilityRequired }}</span>
            </div>
            <div class="overview-item">
              <span class="label">{{ i18n.translate('Seniority', 'የስራ ደረጃ') }}</span>
              <span class="val">{{ listing.seniority }}</span>
            </div>
            <div class="overview-item">
              <span class="label">{{ i18n.translate('Remote Status', 'የርቀት ስራ') }}</span>
              <span class="val">{{ listing.isRemote ? i18n.translate('Yes (Remote Allowed)', 'አዎ (የርቀት ስራ ይቻላል)') : i18n.translate('On-Site Only', 'በቦታው በመገኘት ብቻ') }}</span>
            </div>

            <!-- Action Area -->
            <div class="overview-actions">
              <ng-container *ngIf="isOwner()">
                <a [routerLink]="['/listings', listing.id, 'candidates']" class="btn btn-primary w-full">
                  {{ i18n.translate('✦ View AI Candidate Matches', '✦ የ AI እጩ ባለሙያዎች ዝርዝር') }}
                </a>
                <a [routerLink]="['/listings', listing.id, 'applications']" class="btn btn-dark w-full">
                  {{ i18n.translate('Review Applications Received', 'የደረሱ ማመልከቻዎችን ይገምግሙ') }}
                </a>
                <button *ngIf="listing.status === 'DRAFT'" (click)="publishListing()" class="btn btn-secondary w-full">
                  {{ i18n.translate('Publish to Marketplace', 'ወደ ገበያው ይልቀቁ') }}
                </button>
                <button *ngIf="listing.status === 'OPEN'" (click)="closeListing()" class="btn btn-secondary w-full">
                  {{ i18n.translate('Close Listing', 'ስራውን ዝጉ') }}
                </button>
              </ng-container>

              <ng-container *ngIf="!isOwner()">
                <div *ngIf="isPureSeeker()" class="seeker-view-notice">
                  <div class="notice-badge">🏢 {{ i18n.translate('Employer View Only', 'የአሰሪ እይታ ብቻ') }}</div>
                  <p class="notice-desc">
                    {{ i18n.translate('You are browsing as an Employer. Proposals and applications are submitted by registered Talent/Providers.', 'እንደ አሰሪ እየተመለከቱ ነው። ማመልከቻዎች የሚቀርቡት በባለሙያዎች (Providers) ብቻ ነው።') }}
                  </p>
                </div>

                <button *ngIf="!isPureSeeker() && listing.status === 'OPEN'" (click)="openApplyModal()" class="btn btn-primary w-full btn-apply">
                  {{ i18n.translate('Apply Now', 'አሁን ያመልክቱ') }}
                </button>
                <button *ngIf="authService.currentUser$ | async" (click)="contactOwner()" class="btn btn-outline w-full" style="margin-top: 0.5rem;">
                  {{ i18n.translate('💬 Message Poster', '💬 አሰሪውን ያነጋግሩ') }}
                </button>
                <div *ngIf="appliedSuccess" class="alert-success" style="margin-top: 0.5rem;">
                  {{ i18n.translate('Application successfully submitted! Check "My Applications".', 'ማመልከቻዎ በተሳካ ሁኔታ ገብቷል! "የእኔ ማመልከቻዎች" ውስጥ ይመልከቱ።') }}
                </div>
                <div style="text-align: center; margin-top: 0.75rem;">
                  <button (click)="reportListing()" class="btn-report-link">
                    {{ i18n.translate('🚩 Report this listing', '🚩 ይህንን ስራ ሪፖርት ያድርጉ') }}
                  </button>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <!-- Apply Modal -->
      <div *ngIf="showApplyModal" class="modal-backdrop">
        <div class="modal-content">
          <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
            <h2>{{ i18n.translate('Apply to', 'ማመልከቻ ለ') }} "{{ listing.title }}"</h2>
            <button (click)="closeApplyModal()" class="btn-close">✕</button>
          </div>

          <div *ngIf="applyError" class="alert-danger" style="margin-bottom: 1rem;">
            {{ applyError }}
          </div>

          <!-- Connects Info Banner (Upwork Model) -->
          <div class="connects-box">
            <div class="connects-info">
              <span>🪙 <strong>{{ providerProfile?.isPro ? 1 : 2 }} Connects</strong> {{ i18n.translate('required to submit proposal', 'ማመልከቻ ለማስገባት ያስፈልጋል') }}</span>
              <span class="connects-balance" *ngIf="providerProfile">
                {{ i18n.translate('Your balance:', 'ያለዎት ቀሪ:') }} <strong>{{ providerProfile.connectsBalance ?? 20 }} Connects</strong>
              </span>
            </div>
            <div *ngIf="providerProfile && (providerProfile.connectsBalance || 0) < (providerProfile.isPro ? 1 : 2)" class="connects-topup-prompt">
              <span class="text-danger">⚠️ {{ i18n.translate('Insufficient connects.', 'የማመልከቻ ነጥብዎ አልቋል።') }}</span>
              <button type="button" (click)="quickTopupConnects()" class="btn btn-sm btn-primary">
                ⚡ {{ i18n.translate('Top Up 10 Connects (50 ETB via Telebirr)', '10 ነጥብ በ 50 ብር በቴሌብር ይግዙ') }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ i18n.translate('Proposed Hourly / Project Rate (ETB)', 'የሚጠይቁት የክፍያ መጠን (በብር)') }}</label>
            <input type="number" [(ngModel)]="proposedRate" class="form-input" placeholder="e.g. 800" />
          </div>

          <div class="form-group">
            <label class="form-label">{{ i18n.translate('Cover Note & Relevant Experience', 'አጭር የማመልከቻ ደብዳቤ እና የስራ ልምድ') }}</label>
            <textarea [(ngModel)]="coverNote" rows="4" class="form-textarea" [placeholder]="i18n.translate('Highlight your relevant expertise and background...', 'የስራ ልምድዎን እና ክህሎትዎን እዚህ ይግለጹ...')"></textarea>
          </div>

          <div class="flex justify-between" style="margin-top: 1.5rem;">
            <button (click)="closeApplyModal()" class="btn btn-secondary">{{ i18n.translate('Cancel', 'ይቅር') }}</button>
            <button (click)="submitApplication()" [disabled]="submitting" class="btn btn-primary">
              {{ submitting ? i18n.translate('Submitting...', 'በማስገባት ላይ...') : i18n.translate('Submit Application', 'ማመልከቻውን አስገባ') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-page {
      padding: 2.5rem 1.5rem 5rem;
    }
    .back-link {
      margin-bottom: 1.5rem;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
    }
    .card-top-badges {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .listing-title {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .listing-meta {
      display: flex;
      gap: 0.75rem;
      color: var(--color-slate);
      font-size: 0.875rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    .detail-section {
      margin-bottom: 2rem;
    }
    .detail-section h3 {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
    }
    .description-text {
      font-size: 1rem;
      line-height: 1.7;
      color: #444;
      white-space: pre-line;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .skill-item-card {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
    }
    .skill-req-card {
      border-color: var(--color-taupe);
      background: #FFFFFF;
      box-shadow: 0 1px 3px rgba(65, 63, 61, 0.05);
    }
    .skill-item-title {
      font-weight: 700;
      color: var(--color-charcoal);
      font-size: 0.95rem;
    }
    .skill-item-type {
      font-size: 0.75rem;
      color: var(--color-slate);
      margin-top: 0.2rem;
    }
    .overview-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .overview-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--color-surface-subtle);
      padding-bottom: 0.6rem;
      font-size: 0.9rem;
    }
    .overview-item .label {
      color: var(--color-slate);
      font-weight: 500;
    }
    .overview-item .val {
      font-weight: 700;
      color: var(--color-charcoal);
    }
    .overview-item .val.highlight {
      color: var(--color-cyan);
    }
    .overview-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .w-full { width: 100%; }
    .btn-apply {
      padding: 0.85rem;
      font-size: 1rem;
    }
    .alert-success {
      background-color: rgba(46, 125, 50, 0.12);
      color: var(--color-success);
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .alert-danger {
      background-color: rgba(211, 47, 47, 0.12);
      color: var(--color-danger);
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--color-slate);
    }
    .btn-report-link {
      background: none;
      border: none;
      color: var(--color-slate);
      font-size: 0.775rem;
      cursor: pointer;
      text-decoration: underline;
    }
    .seeker-view-notice {
      background: var(--color-surface-subtle);
      border: 1px dashed var(--color-border);
      border-radius: 8px;
      padding: 0.85rem;
      margin-bottom: 0.75rem;
      text-align: left;
    }
    .notice-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0E7F8F;
      margin-bottom: 0.35rem;
    }
    .notice-desc {
      font-size: 0.775rem;
      color: var(--color-slate);
      line-height: 1.4;
      margin: 0;
    }
    .badge-featured {
      background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
      color: #FFFFFF;
      font-size: 0.725rem;
      font-weight: 800;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      letter-spacing: 0.04em;
      box-shadow: 0 2px 6px rgba(245, 124, 0, 0.25);
    }
    .connects-box {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .connects-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.825rem;
      color: var(--color-charcoal);
    }
    .connects-topup-prompt {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(211, 47, 47, 0.06);
      border: 1px dashed var(--color-danger);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .btn-report-link:hover {
      color: var(--color-danger);
    }
    @media (max-width: 850px) {
      .detail-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ListingDetailComponent implements OnInit {
  listing?: Listing;
  showApplyModal = false;
  proposedRate?: number;
  coverNote = '';
  submitting = false;
  appliedSuccess = false;
  applyError = '';
  providerProfile?: ProviderProfile;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public authService: AuthService,
    public i18n: I18nService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const action = this.route.snapshot.queryParamMap.get('action');
    if (id) {
      this.apiService.getListing(id).subscribe({
        next: (res) => {
          this.listing = res;
          if (this.isOwner() && action === 'apply') {
            this.router.navigate(['/listings', id, 'applications']);
            return;
          }
          if (action === 'apply' && this.authService.isAuthenticated() && !this.isPureSeeker()) {
            setTimeout(() => this.openApplyModal(), 100);
          }
        },
        error: () => this.router.navigate(['/browse'])
      });
    }
    this.refreshProviderProfile();
  }

  refreshProviderProfile(): void {
    if (this.authService.isProvider()) {
      this.apiService.getProviderProfile().subscribe({
        next: (p) => this.providerProfile = p,
        error: () => {}
      });
    }
  }

  quickTopupConnects(): void {
    if (confirm('Purchase 10 Connects for 50 ETB via Chapa Payment Gateway?')) {
      this.apiService.topUpConnects(10, 'CHAPA').subscribe({
        next: (res: any) => {
          const targetUrl = res?.checkoutUrl || res?.checkout_url;
          if (targetUrl) {
            window.location.href = targetUrl;
          } else {
            this.router.navigate(['/profile/provider']);
          }
        },
        error: (err) => this.toastService.error(err.error?.message || 'Could not initiate Chapa checkout.')
      });
    }
  }

  isPureSeeker(): boolean {
    const current = this.authService.currentUser;
    return !!current && this.authService.isSeeker() && !this.authService.isProvider();
  }

  isOwner(): boolean {
    if (!this.listing) return false;
    const current = this.authService.currentUser;
    if (!current) return false;
    return this.listing.ownerName === current.fullName || this.listing.ownerUserId === current.userId;
  }

  publishListing(): void {
    if (!this.listing) return;
    this.apiService.publishListing(this.listing.id).subscribe(res => this.listing = res);
  }

  closeListing(): void {
    if (!this.listing) return;
    this.apiService.closeListing(this.listing.id).subscribe(res => this.listing = res);
  }

  openApplyModal(): void {
    if (this.isPureSeeker()) {
      return;
    }
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.refreshProviderProfile();
    this.showApplyModal = true;
    this.applyError = '';
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
  }

  submitApplication(): void {
    if (!this.listing) return;
    this.submitting = true;
    this.applyError = '';

    this.apiService.applyToListing(this.listing.id, {
      coverNote: this.coverNote,
      proposedRate: this.proposedRate
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showApplyModal = false;
        this.appliedSuccess = true;
        if (this.providerProfile && this.providerProfile.connectsBalance !== undefined) {
          const used = this.providerProfile.isPro ? 1 : 2;
          this.providerProfile.connectsBalance = Math.max(0, this.providerProfile.connectsBalance - used);
        }
      },
      error: (err) => {
        this.submitting = false;
        this.applyError = err.error?.message || 'Failed to submit application. Ensure you have created a provider profile.';
      }
    });
  }

  contactOwner(): void {
    if (!this.listing) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.apiService.createOrGetThread(
      this.listing.ownerUserId,
      this.listing.id,
      `Regarding: ${this.listing.title}`
    ).subscribe({
      next: (thread) => this.router.navigate(['/messages'], { queryParams: { threadId: thread.id } }),
      error: () => this.router.navigate(['/messages'])
    });
  }

  reportListing(): void {
    if (!this.listing) return;
    const reason = prompt('Please describe why you are reporting this listing (e.g. fraudulent post, incorrect category, scam):');
    if (!reason) return;
    this.apiService.submitReport({
      listingId: this.listing.id,
      reason: 'User flagged listing',
      details: reason
    }).subscribe({
      next: () => this.toastService.info('Thank you. Your report has been submitted to platform moderation.', 'Report Submitted'),
      error: () => this.toastService.error('Could not submit report. Please verify you are logged in.')
    });
  }
}
