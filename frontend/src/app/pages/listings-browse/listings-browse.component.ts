import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { I18nService } from '../../services/i18n.service';
import { Listing, ServiceCategory, Location, ListingType, ProviderProfile } from '../../models/models';

@Component({
  selector: 'app-listings-browse',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container browse-page">
      <div class="browse-header">
        <div>
          <h1>{{ activeTab === 'listings' ? i18n.translate('Browse Marketplace Opportunities', 'የስራ እና የአገልግሎት ገበያ ማውጫ') : i18n.translate('Browse Verified Ethiopian Talent', 'የተረጋገጡ የኢትዮጵያ ባለሙያዎች') }}</h1>
          <p>{{ activeTab === 'listings' ? i18n.translate('Find full-time engineering roles, freelance contracts, and local service needs', 'የሙሉ ጊዜ ስራዎችን፣ የፍሪላንስ ፕሮጀክቶችን እና የሀገር ውስጥ አገልግሎቶችን ያግኙ') : i18n.translate('Discover and hire pre-vetted engineers, tradespeople, and freelance specialists', 'የተረጋገጡ መሐንዲሶችን፣ ባለሙያዎችን እና ፍሪላንሰሮችን ያግኙ እና ያነጋግሩ') }}</p>
        </div>

        <div class="tab-toggle-group">
          <button
            type="button"
            class="btn-toggle-tab"
            [class.active]="activeTab === 'listings'"
            (click)="switchTab('listings')">
            💼 {{ i18n.translate('Jobs & Opportunities', 'ስራዎች እና ፕሮጀክቶች') }}
          </button>
          <button
            type="button"
            class="btn-toggle-tab"
            [class.active]="activeTab === 'talent'"
            (click)="switchTab('talent')">
            🧑‍💻 {{ i18n.translate('Find Talent & Providers', 'ባለሙያዎችን ያነጋግሩ') }}
          </button>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="card filter-card">
        <div class="filter-row">
          <!-- Search input -->
          <div class="filter-item flex-2">
            <label class="form-label">{{ i18n.translate('Keyword Search', 'በቁልፍ ቃል ፍለጋ') }}</label>
            <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="applyFilters()" [placeholder]="activeTab === 'listings' ? i18n.translate('e.g. Java, Angular, Electrician...', 'ለምሳሌ Java, Angular, ኤሌክትሪክ...') : i18n.translate('e.g. Backend, Dawit, Flutter...', 'ለምሳሌ Backend, Dawit, Flutter...')" class="form-input" />
          </div>

          <!-- Type filter (only for listings) -->
          <div class="filter-item" *ngIf="activeTab === 'listings'">
            <label class="form-label">{{ i18n.translate('Category Pillar', 'የስራ ዘርፍ') }}</label>
            <select [(ngModel)]="selectedType" (ngModelChange)="applyFilters()" class="form-select">
              <option value="">{{ i18n.translate('All Pillars', 'ሁሉም ዘርፎች') }}</option>
              <option value="JOB">{{ i18n.translate('Employment (Jobs)', 'መደበኛ ቅጥር') }}</option>
              <option value="FREELANCE_PROJECT">{{ i18n.translate('Freelance Projects', 'የፍሪላንስ ፕሮጀክቶች') }}</option>
              <option value="LOCAL_SERVICE_REQUEST">{{ i18n.translate('Local Services', 'የአካባቢ አገልግሎቶች') }}</option>
            </select>
          </div>

          <!-- Category filter (only for listings) -->
          <div class="filter-item" *ngIf="activeTab === 'listings'">
            <label class="form-label">{{ i18n.translate('Service Category', 'የአገልግሎት ምድብ') }}</label>
            <select [(ngModel)]="selectedCategory" (ngModelChange)="applyFilters()" class="form-select">
              <option value="">{{ i18n.translate('All Categories', 'ሁሉም ምድቦች') }}</option>
              <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <!-- Location filter -->
          <div class="filter-item">
            <label class="form-label">{{ i18n.translate('Location', 'ክልል / ከተማ') }}</label>
            <select [(ngModel)]="selectedLocation" (ngModelChange)="applyFilters()" class="form-select">
              <option value="">{{ i18n.translate('All Locations', 'ሁሉም አካባቢዎች') }}</option>
              <option *ngFor="let loc of locations" [value]="loc.id">{{ loc.name }}</option>
            </select>
          </div>

          <!-- Action buttons -->
          <div class="filter-item filter-actions">
            <button (click)="applyFilters()" class="btn btn-primary" style="margin-top: auto;">{{ i18n.translate('Filter', 'አጣራ') }}</button>
            <button (click)="resetFilters()" class="btn btn-secondary" style="margin-top: auto;">{{ i18n.translate('Reset', 'አጽዳ') }}</button>
          </div>
        </div>
      </div>

      <!-- Listings Results List -->
      <ng-container *ngIf="activeTab === 'listings'">
        <div *ngIf="loading" class="text-center loading-state">
          <p>{{ i18n.translate('Loading listings from database...', 'ስራዎችን ከዳታቤዝ በመጫን ላይ...') }}</p>
        </div>

        <div *ngIf="!loading && listings.length === 0" class="card empty-state text-center">
          <h3>{{ i18n.translate('No listings match your criteria', 'ከተመረጠው ፍለጋ ጋር የሚስማማ ስራ አልተገኘም') }}</h3>
          <p>{{ i18n.translate('Try clearing some filters or searching with different keywords.', 'እባክዎ የተመረጡትን ማጣሪያዎች ይቀይሩ ወይም በሌላ ቁልፍ ቃል ይፈልጉ።') }}</p>
          <button (click)="resetFilters()" class="btn btn-outline" style="margin-top: 1rem;">{{ i18n.translate('Clear Filters', 'ማጣሪያዎችን አጽዳ') }}</button>
        </div>

        <div *ngIf="!loading && listings.length > 0" class="listings-grid">
          <div *ngFor="let l of listings" class="card listing-card" [class.card-featured]="l.isFeatured">
            <div class="listing-card-top">
              <div class="flex items-center gap-2">
                <span *ngIf="l.isFeatured" class="badge-featured">
                  ⭐ {{ i18n.translate('FEATURED', 'ልዩ') }}
                </span>
                <span class="badge" [ngClass]="{
                  'badge-job': l.listingType === 'JOB',
                  'badge-freelance': l.listingType === 'FREELANCE_PROJECT',
                  'badge-local': l.listingType === 'LOCAL_SERVICE_REQUEST'
                }">
                  {{ l.listingType === 'JOB' ? i18n.translate('Employment', 'መደበኛ ቅጥር') : l.listingType === 'FREELANCE_PROJECT' ? i18n.translate('Freelance', 'ፍሪላንስ') : i18n.translate('Local Service', 'የአካባቢ አገልግሎት') }}
                </span>
              </div>
              <span class="badge badge-status-open">{{ l.status }}</span>
            </div>

            <h3 class="listing-title">
              <a [routerLink]="['/listings', l.id]">{{ l.title }}</a>
            </h3>

            <p class="listing-desc">{{ l.description | slice:0:140 }}...</p>

            <!-- Skills tags -->
            <div class="listing-skills-row" *ngIf="l.skills && l.skills.length > 0">
              <span *ngFor="let s of l.skills" class="skill-tag" [ngClass]="{'skill-req': s.requirement === 'REQUIRED'}">
                {{ s.skillName }}
                <small *ngIf="s.requirement === 'REQUIRED'">*</small>
              </span>
            </div>

            <div class="listing-meta-row">
              <span class="meta-item">📍 {{ l.locationName ? l.locationName : (l.isRemote ? 'Remote' : 'Addis Ababa') }}</span>
              <span class="meta-item">🕒 {{ l.availabilityRequired }}</span>
            </div>

            <div class="listing-card-bottom">
              <div class="listing-budget">
                <span *ngIf="l.budgetMax">{{ l.budgetMin ? l.budgetMin + ' - ' : '' }}{{ l.budgetMax }} {{ l.currency }}</span>
                <span *ngIf="!l.budgetMax">{{ i18n.translate('Negotiable', 'ተደራዳሪ') }}</span>
              </div>
              <a [routerLink]="['/listings', l.id]" class="btn btn-outline btn-sm">{{ i18n.translate('View & Apply →', 'ዝርዝር እና ማመልከቻ →') }}</a>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="totalPages > 1" class="pagination-row">
          <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)" class="btn btn-secondary btn-sm">{{ i18n.translate('Previous', 'ቀዳሚ') }}</button>
          <span class="page-info">{{ i18n.translate('Page', 'ገጽ') }} {{ currentPage + 1 }} {{ i18n.translate('of', 'ከ') }} {{ totalPages }}</span>
          <button [disabled]="currentPage >= totalPages - 1" (click)="goToPage(currentPage + 1)" class="btn btn-secondary btn-sm">{{ i18n.translate('Next', 'ቀጣይ') }}</button>
        </div>
      </ng-container>

      <!-- Talent / Providers Results Grid -->
      <ng-container *ngIf="activeTab === 'talent'">
        <div *ngIf="providersLoading" class="text-center loading-state">
          <p>{{ i18n.translate('Finding verified providers & talent...', 'ባለሙያዎችን በመፈለግ ላይ...') }}</p>
        </div>

        <div *ngIf="!providersLoading && providers.length === 0" class="card empty-state text-center">
          <h3>{{ i18n.translate('No providers match your criteria', 'ከተመረጠው ፍለጋ ጋር የሚስማማ ባለሙያ አልተገኘም') }}</h3>
          <p>{{ i18n.translate('Try clearing some filters or searching with different keywords.', 'እባክዎ የተመረጡትን ማጣሪያዎች ይቀይሩ ወይም በሌላ ቁልፍ ቃል ይፈልጉ።') }}</p>
          <button (click)="resetFilters()" class="btn btn-outline" style="margin-top: 1rem;">{{ i18n.translate('Clear Filters', 'ማጣሪያዎችን አጽዳ') }}</button>
        </div>

        <div *ngIf="!providersLoading && providers.length > 0" class="listings-grid">
          <div *ngFor="let p of providers" class="card listing-card provider-card">
            <div class="listing-card-top">
              <div class="provider-avatar-chip">
                <div class="avatar-sm">{{ (p.fullName || 'P').charAt(0).toUpperCase() }}</div>
                <div>
                  <h4 class="provider-name">{{ p.fullName || 'Verified Provider' }}</h4>
                  <span class="verified-pill">✓ {{ i18n.translate('Fayda ID Verified', 'በፋይዳ የተረጋገጠ') }}</span>
                </div>
              </div>
              <span class="badge badge-freelance" *ngIf="p.hourlyRate">{{ p.hourlyRate }} ETB/hr</span>
            </div>

            <p class="provider-headline"><strong>{{ p.headline }}</strong></p>
            <p class="listing-desc">{{ p.bio ? (p.bio | slice:0:130) + '...' : '' }}</p>

            <div class="listing-meta-row">
              <span class="meta-item">📍 {{ p.locationName || 'Addis Ababa' }}</span>
              <span class="meta-item" *ngIf="p.yearsExperience">💼 {{ p.yearsExperience }} yrs exp</span>
              <span class="meta-item" *ngIf="p.availability">🕒 {{ p.availability }}</span>
            </div>

            <div class="listing-card-bottom">
              <a [routerLink]="['/providers', p.id]" class="btn btn-secondary btn-sm">
                {{ i18n.translate('View Profile', 'መገለጫ ይመልከቱ') }}
              </a>
              <button
                type="button"
                (click)="messageProvider(p)"
                class="btn btn-primary btn-sm btn-msg-provider">
                💬 {{ i18n.translate('Message Provider', 'ባለሙያውን ያነጋግሩ') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Provider Pagination -->
        <div *ngIf="providersTotalPages > 1" class="pagination-row">
          <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)" class="btn btn-secondary btn-sm">{{ i18n.translate('Previous', 'ቀዳሚ') }}</button>
          <span class="page-info">{{ i18n.translate('Page', 'ገጽ') }} {{ currentPage + 1 }} {{ i18n.translate('of', 'ከ') }} {{ providersTotalPages }}</span>
          <button [disabled]="currentPage >= providersTotalPages - 1" (click)="goToPage(currentPage + 1)" class="btn btn-secondary btn-sm">{{ i18n.translate('Next', 'ቀጣይ') }}</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .browse-page {
      padding: 2.5rem 1.5rem 5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .browse-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .browse-header h1 {
      margin-bottom: 0.25rem;
    }
    .tab-toggle-group {
      display: flex;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 0.35rem;
      gap: 0.35rem;
    }
    .btn-toggle-tab {
      padding: 0.55rem 1.15rem;
      font-weight: 700;
      font-size: 0.875rem;
      border: none;
      border-radius: 7px;
      cursor: pointer;
      background: transparent;
      color: var(--color-slate);
      transition: all 0.2s ease;
    }
    .btn-toggle-tab.active {
      background: var(--color-charcoal);
      color: #FFFFFF;
      box-shadow: 0 2px 6px rgba(65, 63, 61, 0.2);
    }
    .filter-card {
      background: #FFFFFF;
      padding: 1.25rem 1.5rem;
    }
    .filter-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .filter-item {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 160px;
    }
    .filter-item.flex-2 {
      flex: 2;
      min-width: 240px;
    }
    .filter-actions {
      flex-direction: row;
      gap: 0.5rem;
      align-items: flex-end;
    }
    .listings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .listing-card {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background: #FFFFFF;
      border: 1px solid var(--color-border);
    }
    .listing-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(65, 63, 61, 0.08);
    }
    .card-featured {
      border: 2px solid var(--color-gold);
    }
    .listing-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-featured {
      background: #FFF8E1;
      color: #B78103;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      border: 1px solid rgba(183, 129, 3, 0.2);
    }
    .provider-avatar-chip {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .avatar-sm {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--color-charcoal);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1rem;
    }
    .provider-name {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .verified-pill {
      font-size: 0.68rem;
      color: #0E7F8F;
      font-weight: 700;
    }
    .provider-headline {
      font-size: 0.9rem;
      color: var(--color-charcoal);
      margin: 0.4rem 0 0.2rem;
    }
    .listing-title {
      font-size: 1.175rem;
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
      margin: 0.25rem 0;
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
    .skill-req {
      border-color: var(--color-taupe);
      color: var(--color-charcoal);
    }
    .listing-meta-row {
      display: flex;
      gap: 1.25rem;
      font-size: 0.8rem;
      color: var(--color-slate);
      font-weight: 500;
    }
    .listing-card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 0.85rem;
      border-top: 1px solid var(--color-border);
    }
    .listing-budget {
      font-weight: 700;
      color: var(--color-charcoal);
      font-size: 1rem;
    }
    .pagination-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .page-info {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-slate);
    }
  `]
})
export class ListingsBrowseComponent implements OnInit {
  activeTab: 'listings' | 'talent' = 'listings';
  listings: Listing[] = [];
  providers: ProviderProfile[] = [];
  categories: ServiceCategory[] = [];
  locations: Location[] = [];

  searchQuery = '';
  selectedType = '';
  selectedCategory = '';
  selectedLocation = '';

  currentPage = 0;
  totalPages = 0;
  providersTotalPages = 0;
  loading = false;
  providersLoading = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    public i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'talent') this.activeTab = 'talent';
      if (params['type']) this.selectedType = params['type'];
      if (params['categoryId']) this.selectedCategory = params['categoryId'];
      if (params['q']) this.searchQuery = params['q'];
      
      if (this.activeTab === 'talent') {
        this.fetchProviders();
      } else {
        this.fetchListings();
      }
    });
  }

  switchTab(tab: 'listings' | 'talent'): void {
    this.activeTab = tab;
    this.currentPage = 0;
    if (tab === 'talent') {
      this.fetchProviders();
    } else {
      this.fetchListings();
    }
  }

  loadReferenceData(): void {
    this.apiService.getCategories().subscribe(res => this.categories = res || []);
    this.apiService.getLocations().subscribe(res => this.locations = res || []);
  }

  fetchListings(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      size: 9,
      status: 'OPEN',
      sort: 'createdAt,desc'
    };

    if (this.searchQuery) params.q = this.searchQuery;
    if (this.selectedType) params.type = this.selectedType;
    if (this.selectedCategory) params.categoryId = this.selectedCategory;
    if (this.selectedLocation) params.locationId = this.selectedLocation;

    this.apiService.browseListings(params).subscribe({
      next: (res) => {
        this.listings = res.data || [];
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  fetchProviders(): void {
    this.providersLoading = true;
    const params: any = {
      page: this.currentPage,
      size: 9
    };
    if (this.searchQuery) params.q = this.searchQuery;
    if (this.selectedLocation) params.locationId = this.selectedLocation;

    this.apiService.browseProviders(params).subscribe({
      next: (res) => {
        this.providers = res.data || [];
        this.currentPage = res.page;
        this.providersTotalPages = res.totalPages;
        this.providersLoading = false;
      },
      error: () => {
        this.providersLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    if (this.activeTab === 'talent') {
      this.fetchProviders();
    } else {
      this.fetchListings();
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedCategory = '';
    this.selectedLocation = '';
    this.currentPage = 0;
    if (this.activeTab === 'talent') {
      this.fetchProviders();
    } else {
      this.fetchListings();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    if (this.activeTab === 'talent') {
      this.fetchProviders();
    } else {
      this.fetchListings();
    }
  }

  messageProvider(p: ProviderProfile): void {
    if (!p.userId) {
      this.router.navigate(['/messages']);
      return;
    }
    this.apiService.createOrGetThread(
      p.userId,
      undefined,
      `Project Inquiry with ${p.fullName || 'Provider'}`
    ).subscribe({
      next: (thread) => this.router.navigate(['/messages'], { queryParams: { threadId: thread.id } }),
      error: () => this.router.navigate(['/messages'])
    });
  }
}
