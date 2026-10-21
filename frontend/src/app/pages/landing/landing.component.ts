import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { Listing, User } from '../../models/models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="landing-page">
      <!-- Hero Section with Dahlia styling -->
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="badge-dot"></span> {{ i18n.t('hero.badge') }}
            </div>
            <h1 class="hero-title">
              {{ i18n.t('hero.titlePrefix') }}<span class="highlight-cyan">{{ i18n.t('hero.titleHighlight') }}</span>
            </h1>
            <p class="hero-subtitle">
              {{ i18n.t('hero.subtitle') }}
            </p>

            <!-- Visitor Actions (When logged out) -->
            <div *ngIf="!currentUser" class="hero-actions">
              <a routerLink="/register" class="btn btn-primary btn-lg">{{ i18n.t('hero.createAccBtn') }}</a>
              <a routerLink="/login" class="btn btn-dark btn-lg">{{ i18n.t('hero.signInBtn') }}</a>
              <a routerLink="/browse" class="btn btn-outline btn-lg">{{ i18n.t('hero.exploreBtn') }}</a>
            </div>

            <!-- Authenticated Actions (When logged in) -->
            <div *ngIf="currentUser" class="hero-auth-banner">
              <div class="auth-welcome-text">
                {{ i18n.translate('Signed in as', 'በዚህ ስም ገብተዋል፡') }} <strong>{{ currentUser.fullName || currentUser.email }}</strong> ({{ currentUser.roles.join(', ') }})
              </div>
              <div class="hero-actions" style="margin-bottom: 0;">
                <a *ngIf="isSeeker()" routerLink="/listings/my" class="btn btn-primary">{{ i18n.t('nav.myListings') }}</a>
                <a *ngIf="isSeeker()" routerLink="/listings/new" class="btn btn-dark">+ {{ i18n.t('nav.postListing') }}</a>
                <a *ngIf="isProvider()" routerLink="/recommended" class="btn btn-primary">{{ i18n.t('nav.recommended') }}</a>
                <a *ngIf="isProvider()" routerLink="/profile/provider" class="btn btn-dark">{{ i18n.t('nav.profile') }}</a>
                <a *ngIf="isAdmin()" routerLink="/admin" class="btn btn-primary">{{ i18n.t('nav.admin') }}</a>
                <a routerLink="/browse" class="btn btn-outline">{{ i18n.t('nav.browse') }}</a>
              </div>
            </div>

            <div class="hero-stats">
              <div class="stat-item">
                <div class="stat-value">{{ i18n.t('hero.stat1Val') }}</div>
                <div class="stat-label">{{ i18n.t('hero.stat1Label') }}</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">{{ i18n.t('hero.stat2Val') }}</div>
                <div class="stat-label">{{ i18n.t('hero.stat2Label') }}</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-value">{{ i18n.t('hero.stat3Val') }}</div>
                <div class="stat-label">{{ i18n.t('hero.stat3Label') }}</div>
              </div>
            </div>
          </div>

          <!-- Hero Visual: Explainable AI Match Preview -->
          <div class="hero-visual">
            <div class="match-card-preview">
              <div class="preview-header">
                <div class="preview-tag">{{ i18n.t('preview.tag') }}</div>
                <div class="match-pill">{{ i18n.t('preview.matchScore') }}</div>
              </div>
              <h3 class="preview-name">{{ i18n.t('preview.candidateTitle') }}</h3>
              <p class="preview-desc">{{ i18n.t('preview.candidateBio') }}</p>

              <div class="factor-preview-list">
                <div class="factor-row">
                  <div class="factor-header">
                    <span>{{ i18n.t('preview.factorSkill') }}</span>
                    <span class="factor-val">0.92</span>
                  </div>
                  <div class="factor-bar"><div class="factor-progress" style="width: 92%"></div></div>
                </div>
                <div class="factor-row">
                  <div class="factor-header">
                    <span>{{ i18n.t('preview.factorAvail') }}</span>
                    <span class="factor-val">1.00</span>
                  </div>
                  <div class="factor-bar"><div class="factor-progress" style="width: 100%"></div></div>
                </div>
                <div class="factor-row">
                  <div class="factor-header">
                    <span>{{ i18n.t('preview.factorSem') }}</span>
                    <span class="factor-val">0.89</span>
                  </div>
                  <div class="factor-bar"><div class="factor-progress" style="width: 89%"></div></div>
                </div>
              </div>

              <div class="preview-footer">
                <span class="model-badge">{{ i18n.t('preview.model') }}</span>
                <span class="latency-badge">18ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Own Your Responsibility Section -->
      <section class="ownership-section">
        <div class="container">
          <div class="section-header text-center">
            <h2 class="section-title">{{ i18n.t('own.title') }}</h2>
            <p class="section-subtitle">{{ i18n.t('own.subtitle') }}</p>
          </div>

          <div class="ownership-grid">
            <!-- For Seekers -->
            <div class="ownership-card seeker-theme">
              <div class="ownership-badge">{{ i18n.t('own.seekerBadge') }}</div>
              <div class="ownership-icon">🏢</div>
              <h3 class="ownership-title">{{ i18n.t('own.seekerTitle') }}</h3>
              <p class="ownership-desc">
                {{ i18n.t('own.seekerDesc') }}
              </p>
              <ul class="ownership-features">
                <li>{{ i18n.t('own.seekerF1') }}</li>
                <li>{{ i18n.t('own.seekerF2') }}</li>
                <li>{{ i18n.t('own.seekerF3') }}</li>
              </ul>
              <div class="ownership-action">
                <a *ngIf="!currentUser" routerLink="/register" class="btn btn-primary btn-block">{{ i18n.t('own.seekerBtn') }}</a>
                <a *ngIf="currentUser && isSeeker()" routerLink="/listings/new" class="btn btn-primary btn-block">+ {{ i18n.t('nav.postListing') }}</a>
                <a *ngIf="currentUser && !isSeeker()" routerLink="/browse" class="btn btn-outline btn-block">{{ i18n.t('nav.browse') }}</a>
              </div>
            </div>

            <!-- For Providers -->
            <div class="ownership-card provider-theme">
              <div class="ownership-badge">{{ i18n.t('own.providerBadge') }}</div>
              <div class="ownership-icon">🛠️</div>
              <h3 class="ownership-title">{{ i18n.t('own.providerTitle') }}</h3>
              <p class="ownership-desc">
                {{ i18n.t('own.providerDesc') }}
              </p>
              <ul class="ownership-features">
                <li>{{ i18n.t('own.providerF1') }}</li>
                <li>{{ i18n.t('own.providerF2') }}</li>
                <li>{{ i18n.t('own.providerF3') }}</li>
              </ul>
              <div class="ownership-action">
                <a *ngIf="!currentUser" routerLink="/register" class="btn btn-dark btn-block">{{ i18n.t('own.providerBtn') }}</a>
                <a *ngIf="currentUser && isProvider()" routerLink="/recommended" class="btn btn-dark btn-block">{{ i18n.t('nav.recommended') }}</a>
                <a *ngIf="currentUser && !isProvider()" routerLink="/browse" class="btn btn-outline btn-block">{{ i18n.t('nav.browse') }}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Three Pillars Grid -->
      <section class="pillars-section">
        <div class="container">
          <div class="section-header text-center">
            <h2 class="section-title">{{ i18n.t('pillars.title') }}</h2>
            <p class="section-subtitle">{{ i18n.t('pillars.subtitle') }}</p>
          </div>

          <div class="pillars-grid">
            <div class="pillar-card">
              <div class="pillar-icon pillar-icon-job">💼</div>
              <div class="badge badge-job">{{ i18n.translate('Pillar 1', 'ዘርፍ 1') }}</div>
              <h3 class="pillar-name">{{ i18n.t('pillar1.name') }}</h3>
              <p class="pillar-desc">
                {{ i18n.t('pillar1.desc') }}
              </p>
              <a routerLink="/browse" [queryParams]="{type: 'JOB'}" class="pillar-link">{{ i18n.t('pillar1.link') }}</a>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon pillar-icon-freelance">💻</div>
              <div class="badge badge-freelance">{{ i18n.translate('Pillar 2', 'ዘርፍ 2') }}</div>
              <h3 class="pillar-name">{{ i18n.t('pillar2.name') }}</h3>
              <p class="pillar-desc">
                {{ i18n.t('pillar2.desc') }}
              </p>
              <a routerLink="/browse" [queryParams]="{type: 'FREELANCE_PROJECT'}" class="pillar-link">{{ i18n.t('pillar2.link') }}</a>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon pillar-icon-local">🔧</div>
              <div class="badge badge-local">{{ i18n.translate('Pillar 3', 'ዘርፍ 3') }}</div>
              <h3 class="pillar-name">{{ i18n.t('pillar3.name') }}</h3>
              <p class="pillar-desc">
                {{ i18n.t('pillar3.desc') }}
              </p>
              <a routerLink="/browse" [queryParams]="{type: 'LOCAL_SERVICE_REQUEST'}" class="pillar-link">{{ i18n.t('pillar3.link') }}</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Trust & Escrow Platform Guarantee -->
      <section class="trust-guarantee-section">
        <div class="container">
          <div class="section-header text-center">
            <h2 class="section-title">{{ i18n.t('trust.title') }}</h2>
            <p class="section-subtitle">{{ i18n.t('trust.subtitle') }}</p>
          </div>

          <div class="trust-grid">
            <div class="trust-box">
              <div class="trust-icon">🪪</div>
              <h4>{{ i18n.t('trust.faydaTitle') }}</h4>
              <p>{{ i18n.t('trust.faydaDesc') }}</p>
            </div>
            <div class="trust-box">
              <div class="trust-icon">💳</div>
              <h4>{{ i18n.t('trust.escrowTitle') }}</h4>
              <p>{{ i18n.t('trust.escrowDesc') }}</p>
            </div>
            <div class="trust-box">
              <div class="trust-icon">⚖️</div>
              <h4>{{ i18n.t('trust.disputeTitle') }}</h4>
              <p>{{ i18n.t('trust.disputeDesc') }}</p>
            </div>
            <div class="trust-box">
              <div class="trust-icon">✦</div>
              <h4>{{ i18n.t('trust.fairnessTitle') }}</h4>
              <p>{{ i18n.t('trust.fairnessDesc') }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Recent Listings -->
      <section class="featured-section" *ngIf="recentListings.length > 0">
        <div class="container">
          <div class="flex justify-between items-center" style="margin-bottom: 2rem;">
            <div>
              <h2>{{ i18n.t('recent.title') }}</h2>
              <p>{{ i18n.t('recent.subtitle') }}</p>
            </div>
            <a routerLink="/browse" class="btn btn-secondary">{{ i18n.t('recent.viewAll') }}</a>
          </div>

          <div class="listings-grid">
            <div *ngFor="let l of recentListings" class="card listing-item-card">
              <div class="listing-top">
                <span class="badge" [ngClass]="{
                  'badge-job': l.listingType === 'JOB',
                  'badge-freelance': l.listingType === 'FREELANCE_PROJECT',
                  'badge-local': l.listingType === 'LOCAL_SERVICE_REQUEST'
                }">
                  {{ l.listingType === 'JOB' ? i18n.translate('Job', 'መደበኛ ስራ') : l.listingType === 'FREELANCE_PROJECT' ? i18n.translate('Freelance', 'ፍሪላንስ') : i18n.translate('Local Service', 'የአካባቢ አገልግሎት') }}
                </span>
                <span class="badge badge-status-open">{{ l.status }}</span>
              </div>
              <h3 class="listing-card-title">
                <a [routerLink]="['/listings', l.id]">{{ l.title }}</a>
              </h3>
              <p class="listing-card-desc">{{ l.description | slice:0:110 }}...</p>

              <div class="listing-skills-row" *ngIf="l.skills && l.skills.length > 0">
                <span *ngFor="let s of l.skills | slice:0:3" class="skill-chip">
                  {{ s.skillName }}
                </span>
                <span *ngIf="l.skills.length > 3" class="skill-chip-more">+{{ l.skills.length - 3 }}</span>
              </div>

              <div class="listing-card-footer">
                <div class="listing-rate">
                  <span *ngIf="l.budgetMax">{{ l.budgetMin ? l.budgetMin + ' - ' : '' }}{{ l.budgetMax }} {{ l.currency }}</span>
                  <span *ngIf="!l.budgetMax">{{ i18n.t('recent.negotiable') }}</span>
                </div>
                <div class="listing-btns">
                  <button (click)="onDetailsClick(l)" class="btn btn-outline btn-sm">
                    {{ i18n.t('recent.details') }}
                  </button>
                  <button (click)="onApplyClick(l)" class="btn btn-primary btn-sm">
                    {{ isSeeker() ? i18n.translate('Applications', 'ማመልከቻዎች') : i18n.translate('Apply Now', 'አመልክት') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .landing-page {
      display: flex;
      flex-direction: column;
      gap: 4rem;
      padding-bottom: 5rem;
    }
    .hero-section {
      background: linear-gradient(180deg, #FFFFFF 0%, var(--color-bg) 100%);
      padding: 4.5rem 0 3.5rem;
      border-bottom: 1px solid var(--color-border);
    }
    .hero-container {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 3.5rem;
      align-items: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: rgba(105, 113, 132, 0.1);
      color: var(--color-slate);
      font-size: 0.825rem;
      font-weight: 700;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      margin-bottom: 1.5rem;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background-color: var(--color-cyan);
      border-radius: 50%;
    }
    .hero-title {
      font-size: 2.75rem;
      font-weight: 800;
      color: var(--color-charcoal);
      margin-bottom: 1.25rem;
      line-height: 1.15;
    }
    .highlight-cyan {
      color: var(--color-cyan);
    }
    .hero-subtitle {
      font-size: 1.1rem;
      color: #555350;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .hero-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
    }
    .hero-auth-banner {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-sm);
    }
    .auth-welcome-text {
      font-size: 0.95rem;
      color: var(--color-charcoal);
      margin-bottom: 1rem;
    }
    .btn-lg {
      padding: 0.8rem 1.75rem;
      font-size: 1rem;
    }
    .hero-stats {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--color-border);
      flex-wrap: wrap;
    }
    .stat-value {
      font-size: 1.65rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .stat-label {
      font-size: 0.8rem;
      color: var(--color-slate);
      font-weight: 600;
    }
    .stat-divider {
      width: 1px;
      height: 36px;
      background-color: var(--color-border);
    }
    .match-card-preview {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 12px 32px rgba(65, 63, 61, 0.12);
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .preview-tag {
      font-size: 0.775rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-slate);
    }
    .match-pill {
      background-color: rgba(28, 184, 205, 0.15);
      color: #0E7F8F;
      font-weight: 800;
      font-size: 0.85rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
    }
    .preview-name {
      font-size: 1.25rem;
      margin-bottom: 0.4rem;
    }
    .preview-desc {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 1.5rem;
      font-style: italic;
    }
    .factor-preview-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .factor-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--color-charcoal);
    }
    .factor-val {
      color: var(--color-cyan);
      font-weight: 700;
    }
    .preview-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
      font-size: 0.75rem;
    }
    .model-badge {
      color: var(--color-slate);
      font-family: monospace;
    }
    .latency-badge {
      background-color: rgba(46, 125, 50, 0.1);
      color: var(--color-success);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-weight: 700;
    }
    /* Ownership Section */
    .ownership-section {
      padding: 2rem 0;
    }
    .ownership-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .ownership-card {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 2.25rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .ownership-badge {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-slate);
      margin-bottom: 1rem;
    }
    .ownership-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .ownership-title {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
    }
    .ownership-desc {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #555;
      margin-bottom: 1.5rem;
    }
    .ownership-features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      color: var(--color-charcoal);
      font-weight: 600;
    }
    .ownership-action {
      margin-top: auto;
    }
    .btn-block {
      width: 100%;
      text-align: center;
    }
    .pillars-section {
      padding: 1rem 0;
    }
    .section-header {
      max-width: 650px;
      margin: 0 auto 3rem;
    }
    .section-title {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }
    .section-subtitle {
      font-size: 1rem;
      color: var(--color-slate);
    }
    .text-center { text-align: center; }
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
    .pillar-card {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .pillar-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-taupe);
    }
    .pillar-icon {
      font-size: 2.25rem;
      margin-bottom: 1rem;
    }
    .pillar-name {
      margin: 0.75rem 0 0.5rem;
      font-size: 1.35rem;
    }
    .pillar-desc {
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .pillar-link {
      font-weight: 700;
      color: var(--color-cyan);
      font-size: 0.9rem;
    }
    .listings-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .listing-item-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .listing-top {
      display: flex;
      justify-content: space-between;
    }
    .listing-card-title {
      font-size: 1.15rem;
    }
    .listing-card-title a {
      color: var(--color-charcoal);
    }
    .listing-card-title a:hover {
      color: var(--color-cyan);
    }
    .listing-skills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 0.25rem 0;
    }
    .skill-chip {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      color: var(--color-slate);
    }
    .skill-chip-more {
      font-size: 0.75rem;
      color: var(--color-slate);
      align-self: center;
    }
    .listing-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
    }
    .listing-btns {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .listing-rate {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--color-charcoal);
    }
    .trust-guarantee-section {
      background: var(--color-surface-subtle);
      padding: 4.5rem 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .trust-box {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .trust-icon {
      font-size: 2rem;
    }
    .trust-box h4 {
      font-size: 1.05rem;
      color: var(--color-charcoal);
      margin: 0;
    }
    .trust-box p {
      font-size: 0.85rem;
      color: var(--color-slate);
      line-height: 1.5;
      margin: 0;
    }
    @media (max-width: 900px) {
      .hero-container, .ownership-grid, .pillars-grid, .listings-grid, .trust-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LandingComponent implements OnInit {
  recentListings: Listing[] = [];
  currentUser: User | null = null;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    public i18n: I18nService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
    });

    this.apiService.browseListings({ size: 3, sort: 'createdAt,desc' }).subscribe({
      next: (res) => {
        this.recentListings = res.data || [];
      },
      error: () => {}
    });
  }

  onDetailsClick(l: Listing): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/listings/${l.id}` } });
      return;
    }
    if (this.isSeeker()) {
      const current = this.authService.currentUser;
      if (current && (l.ownerUserId === current.userId || l.ownerName === current.fullName)) {
        this.router.navigate(['/listings', l.id, 'applications']);
        return;
      }
    }
    this.router.navigate(['/listings', l.id]);
  }

  onApplyClick(l: Listing): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/listings/${l.id}?action=apply` } });
      return;
    }
    if (this.isSeeker()) {
      this.router.navigate(['/listings', l.id, 'applications']);
      return;
    }
    this.router.navigate(['/listings', l.id], { queryParams: { action: 'apply' } });
  }

  isSeeker(): boolean {
    return this.authService.isSeeker();
  }

  isProvider(): boolean {
    return this.authService.isProvider();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
