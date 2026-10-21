import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { I18nService } from '../../services/i18n.service';
import { SidebarService } from '../../services/sidebar.service';
import { User } from '../../models/models';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <ng-container *ngIf="sidebarService.isAllowedOnCurrentRoute()">
      <!-- Mobile Backdrop Overlay -->
      <div
        class="sidebar-backdrop"
        *ngIf="sidebarService.isOpen()"
        (click)="sidebarService.close()">
      </div>

      <!-- Sidebar Container -->
      <aside class="sidebar" [class.open]="sidebarService.isOpen()">
      <div class="sidebar-inner">
        <!-- Sidebar Brand/Header -->
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <div class="brand-mini-badge">EB</div>
            <div class="brand-info">
              <span class="brand-title">{{ i18n.t('nav.brandTitle') }}</span>
              <span class="brand-role-pill" [ngClass]="getRoleBadgeClass()">
                {{ getRoleBadgeLabel() }}
              </span>
            </div>
          </div>
          <button (click)="sidebarService.close()" class="btn-sidebar-close" title="Close sidebar">✕</button>
        </div>

        <!-- Dual Role Mode Switcher (Active when user has DUAL role) -->
        <div class="dual-switcher-bar" *ngIf="isDual()">
          <button
            type="button"
            class="dual-switch-btn"
            [class.active]="isSeekerMode()"
            (click)="switchDualMode('SEEKER')">
            🏢 {{ i18n.translate('Employer View', 'የአሰሪ እይታ') }}
          </button>
          <button
            type="button"
            class="dual-switch-btn"
            [class.active]="isProviderMode()"
            (click)="switchDualMode('PROVIDER')">
            🛠️ {{ i18n.translate('Provider View', 'የባለሙያ እይታ') }}
          </button>
        </div>

        <!-- Scrollable Navigation Items -->
        <nav class="sidebar-nav">
          <!-- 1. SEEKER / EMPLOYER WORKSPACE -->
          <div class="nav-group" *ngIf="isSeekerMode()">
            <div class="nav-group-title seeker-title">
              🏢 {{ i18n.lang() === 'am' ? 'የአሰሪ ዋና ኃላፊነቶች' : 'Employer Responsibilities' }}
            </div>

            <!-- Post an Opportunity -->
            <a
              routerLink="/listings/new"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item item-highlight">
              <span class="item-icon">➕</span>
              <span class="item-label">{{ i18n.t('nav.postListing') }}</span>
            </a>

            <!-- Manage My Listings -->
            <a
              routerLink="/listings/my"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">📋</span>
              <span class="item-label">{{ i18n.t('nav.myListings') }}</span>
            </a>

            <!-- Milestone Escrow & Payments -->
            <a
              routerLink="/contracts"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">💳</span>
              <span class="item-label">{{ i18n.translate('Escrow & Contracts', 'የውል እና ክፍያ ዋስትና') }}</span>
              <span class="item-badge-pill">ETB</span>
            </a>

            <!-- Candidate Messaging -->
            <a
              routerLink="/messages"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">💬</span>
              <span class="item-label">{{ i18n.translate('Candidate Messaging', 'ከእጩዎች ጋር መልእክት') }}</span>
              <span *ngIf="unreadMessagesCount > 0" class="item-badge-unread">{{ unreadMessagesCount }}</span>
            </a>

            <!-- Employer / Company Profile -->
            <a
              routerLink="/profile/seeker"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">🏢</span>
              <span class="item-label">{{ i18n.t('nav.employerProfile') }}</span>
            </a>

            <!-- Organization Verification -->
            <a
              routerLink="/verification"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">🪪</span>
              <span class="item-label">{{ i18n.translate('Employer Verification', 'የአሰሪ ማረጋገጫ') }}</span>
              <span *ngIf="currentUser?.isVerified" class="item-verified-badge">✓</span>
            </a>
          </div>

          <!-- 2. PROVIDER / TALENT WORKSPACE -->
          <div class="nav-group" *ngIf="isProviderMode()">
            <div class="nav-group-title provider-title">
              🛠️ {{ i18n.lang() === 'am' ? 'የባለሙያ ዋና ኃላፊነቶች' : 'Talent Responsibilities' }}
            </div>

            <!-- AI Recommended Opportunities -->
            <a
              routerLink="/recommended"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item item-ai">
              <span class="item-icon ai-sparkle">🎯</span>
              <span class="item-label">{{ i18n.t('nav.recommended') }}</span>
              <span class="item-tag-ai">AI-Fit</span>
            </a>

            <!-- My Applications & Proposals -->
            <a
              routerLink="/my-applications"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">📄</span>
              <span class="item-label">{{ i18n.t('nav.myApplications') }}</span>
            </a>

            <!-- My Work & Escrow Contracts -->
            <a
              routerLink="/contracts"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">💳</span>
              <span class="item-label">{{ i18n.translate('My Work & Escrow', 'የስራ ውሎች እና ክፍያ') }}</span>
              <span class="item-badge-pill">ETB</span>
            </a>

            <!-- Client Messaging -->
            <a
              routerLink="/messages"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">💬</span>
              <span class="item-label">{{ i18n.translate('Client Messages', 'ከአሰሪዎች ጋር መልእክት') }}</span>
              <span *ngIf="unreadMessagesCount > 0" class="item-badge-unread">{{ unreadMessagesCount }}</span>
            </a>

            <!-- Professional Profile & Skills -->
            <a
              routerLink="/profile/provider"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">👤</span>
              <span class="item-label">{{ i18n.translate('Profile & Skills', 'የሙያ መገለጫ እና ክህሎቶች') }}</span>
            </a>

            <!-- Fayda National ID Verification -->
            <a
              routerLink="/verification"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">🪪</span>
              <span class="item-label">{{ i18n.translate('Fayda ID Verification', 'የፋይዳ መታወቂያ ማረጋገጫ') }}</span>
              <span *ngIf="currentUser?.isVerified" class="item-verified-badge">✓</span>
            </a>
          </div>

          <!-- 3. ADMIN GOVERNANCE CONSOLE -->
          <div class="nav-group" *ngIf="isAdmin()">
            <div class="nav-group-title admin-title">
              🛡️ {{ i18n.lang() === 'am' ? 'የስርዓት አስተዳደር' : 'System Administration' }}
            </div>

            <!-- Admin Console -->
            <a
              routerLink="/admin"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item item-admin">
              <span class="item-icon">🛡️</span>
              <span class="item-label">{{ i18n.translate('Moderation & Users', 'አስተዳደር እና ቁጥጥር') }}</span>
            </a>

            <!-- AI Benchmarks & Evaluation -->
            <a
              routerLink="/evaluation"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item item-ai">
              <span class="item-icon ai-sparkle">✦</span>
              <span class="item-label">{{ i18n.translate('AI Benchmark Audit', 'የ AI ምዘና ውጤቶች') }}</span>
              <span class="item-tag-ai">FAT-ML</span>
            </a>

            <!-- Verification Approvals -->
            <a
              routerLink="/verification"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">🪪</span>
              <span class="item-label">{{ i18n.translate('ID Approvals Queue', 'የመታወቂያ ማረጋገጫዎች') }}</span>
            </a>

            <!-- System Messages -->
            <a
              routerLink="/messages"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">💬</span>
              <span class="item-label">{{ i18n.translate('System Communications', 'የስርዓት መልእክቶች') }}</span>
              <span *ngIf="unreadMessagesCount > 0" class="item-badge-unread">{{ unreadMessagesCount }}</span>
            </a>
          </div>

          <!-- 4. MARKETPLACE DISCOVERY (Shared) -->
          <div class="nav-group">
            <div class="nav-group-title">
              🔍 {{ i18n.lang() === 'am' ? 'የገበያ አሰሳ' : 'Marketplace Discovery' }}
            </div>

            <a
              routerLink="/browse"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">🔍</span>
              <span class="item-label">{{ isSeekerMode() ? i18n.translate('Browse Talent & Services', 'ባለሙያዎችን እና አገልግሎቶችን ያስሱ') : i18n.t('nav.browse') }}</span>
            </a>
          </div>

          <!-- 5. TRUST & POLICIES -->
          <div class="nav-group">
            <div class="nav-group-title">
              📜 {{ i18n.lang() === 'am' ? 'እምነት እና ህጋዊ' : 'Trust & Policies' }}
            </div>

            <a
              routerLink="/terms"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">📜</span>
              <span class="item-label">{{ i18n.t('nav.terms') }}</span>
            </a>

            <a
              routerLink="/privacy"
              routerLinkActive="active"
              (click)="onLinkClick()"
              class="sidebar-item">
              <span class="item-icon">🔒</span>
              <span class="item-label">{{ i18n.t('nav.privacy') }}</span>
            </a>
          </div>
        </nav>

        <!-- Footer User Profile Card -->
        <div class="sidebar-footer" *ngIf="currentUser">
          <div class="user-chip">
            <div class="chip-avatar">{{ (currentUser.fullName || currentUser.email).charAt(0).toUpperCase() }}</div>
            <div class="chip-text">
              <span class="chip-name">{{ currentUser.fullName || currentUser.email }}</span>
              <span class="chip-role">{{ currentUser.roles.join(', ') }}</span>
            </div>
            <span *ngIf="currentUser.isVerified" class="chip-verified" title="Fayda Verified">✓</span>
          </div>
        </div>
      </div>
    </aside>
  </ng-container>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 72px;
      left: 0;
      bottom: 0;
      width: 260px;
      background: #FFFFFF;
      border-right: 1px solid var(--color-border);
      z-index: 900;
      display: flex;
      flex-direction: column;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 2px 0 12px rgba(65, 63, 61, 0.04);
    }
    .sidebar:not(.open) {
      transform: translateX(-100%);
    }
    .sidebar-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(43, 41, 40, 0.45);
      backdrop-filter: blur(2px);
      z-index: 899;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.15rem;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface-subtle);
      flex-shrink: 0;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .brand-mini-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--color-charcoal) 0%, var(--color-slate) 100%);
      color: #FFFFFF;
      font-weight: 800;
      font-size: 0.85rem;
      border-radius: 8px;
    }
    .brand-info {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-charcoal);
      line-height: 1.15;
    }
    .brand-role-pill {
      font-size: 0.685rem;
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      display: inline-block;
      margin-top: 0.2rem;
      line-height: 1.2;
    }
    .badge-role-seeker {
      background: rgba(28, 184, 205, 0.15);
      color: #0E7F8F;
    }
    .badge-role-provider {
      background: rgba(16, 185, 129, 0.15);
      color: #047857;
    }
    .badge-role-admin {
      background: rgba(140, 82, 255, 0.15);
      color: #7C3AED;
    }
    .badge-role-guest {
      background: var(--color-border);
      color: var(--color-slate);
    }
    .btn-sidebar-close {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: var(--color-slate);
      cursor: pointer;
      display: none;
      padding: 0.25rem;
    }
    /* Dual Switcher Bar */
    .dual-switcher-bar {
      display: flex;
      background: #F3F4F6;
      padding: 0.35rem 0.5rem;
      gap: 0.35rem;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .dual-switch-btn {
      flex: 1;
      padding: 0.35rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: var(--color-slate);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    .dual-switch-btn:hover {
      background: rgba(255, 255, 255, 0.6);
    }
    .dual-switch-btn.active {
      background: #FFFFFF;
      color: var(--color-charcoal);
      border-color: var(--color-border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    /* Navigation Items */
    .sidebar-nav {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 0.85rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .nav-group {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .nav-group-title {
      font-size: 0.685rem;
      font-weight: 800;
      color: var(--color-slate);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.35rem 0.65rem;
      margin-bottom: 0.15rem;
    }
    .seeker-title {
      color: #0E7F8F;
    }
    .provider-title {
      color: #047857;
    }
    .admin-title {
      color: #8C52FF;
    }
    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      color: var(--color-charcoal);
      font-size: 0.865rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
      position: relative;
    }
    .sidebar-item:hover {
      background: var(--color-surface-subtle);
      color: var(--color-cyan);
    }
    .sidebar-item.active {
      background: var(--color-cyan-subtle);
      color: #0E7F8F;
      font-weight: 700;
    }
    .sidebar-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      background: var(--color-cyan);
      border-radius: 0 4px 4px 0;
    }
    .item-icon {
      font-size: 1rem;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    .item-label {
      flex: 1 1 auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-badge-pill {
      font-size: 0.65rem;
      font-weight: 800;
      background: var(--color-surface-subtle);
      color: var(--color-slate);
      border: 1px solid var(--color-border);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }
    .item-badge-unread {
      background: var(--color-danger);
      color: #FFFFFF;
      font-size: 0.685rem;
      font-weight: 800;
      padding: 0.1rem 0.45rem;
      border-radius: 10px;
      line-height: 1;
    }
    .item-highlight {
      background: rgba(28, 184, 205, 0.08);
      color: #0E7F8F;
    }
    .item-highlight:hover {
      background: var(--color-cyan-subtle);
    }
    .item-ai {
      background: rgba(105, 113, 132, 0.04);
    }
    .ai-sparkle {
      color: var(--color-cyan);
      font-weight: 800;
    }
    .item-tag-ai {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--color-cyan);
      background: #FFFFFF;
      border: 1px solid rgba(28, 184, 205, 0.4);
      padding: 0.05rem 0.35rem;
      border-radius: 4px;
    }
    .item-admin {
      color: #8C52FF;
    }
    .item-admin.active {
      background: rgba(140, 82, 255, 0.1);
      color: #8C52FF;
    }
    .item-admin.active::before {
      background: #8C52FF;
    }
    .item-verified-badge {
      width: 14px;
      height: 14px;
      background: #10B981;
      color: #FFFFFF;
      border-radius: 50%;
      font-size: 0.6rem;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    /* Footer User Profile Card */
    .sidebar-footer {
      padding: 0.85rem 1rem;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface-subtle);
      flex-shrink: 0;
    }
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .chip-avatar {
      width: 32px;
      height: 32px;
      background: var(--color-charcoal);
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
    }
    .chip-text {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      overflow: hidden;
    }
    .chip-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-charcoal);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chip-role {
      font-size: 0.685rem;
      color: var(--color-cyan);
      font-weight: 600;
      text-transform: uppercase;
    }
    .chip-verified {
      width: 14px;
      height: 14px;
      background: #10B981;
      color: #FFFFFF;
      border-radius: 50%;
      font-size: 0.6rem;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    /* Responsive Behaviors */
    @media (max-width: 1023px) {
      .sidebar {
        top: 72px;
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.18);
      }
      .btn-sidebar-close {
        display: block;
      }
      .sidebar-backdrop {
        display: block;
      }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  unreadMessagesCount = 0;
  activeDualMode: 'SEEKER' | 'PROVIDER' = 'PROVIDER';
  private pollSub?: Subscription;

  constructor(
    public sidebarService: SidebarService,
    public authService: AuthService,
    private apiService: ApiService,
    public i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      if (u) {
        if (this.isSeeker() && !this.isProvider()) {
          this.activeDualMode = 'SEEKER';
        } else {
          this.activeDualMode = 'PROVIDER';
        }
        this.fetchAlerts();
      } else {
        this.unreadMessagesCount = 0;
      }
    });

    this.pollSub = interval(30000).subscribe(() => {
      if (this.currentUser) {
        this.fetchAlerts();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
  }

  fetchAlerts(): void {
    this.apiService.getUnreadMessageCount().subscribe({
      next: (res) => this.unreadMessagesCount = res.unreadCount,
      error: () => {}
    });
  }

  onLinkClick(): void {
    this.sidebarService.closeIfMobile();
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

  isDual(): boolean {
    return this.isSeeker() && this.isProvider();
  }

  isSeekerMode(): boolean {
    if (this.isDual()) return this.activeDualMode === 'SEEKER';
    return this.isSeeker();
  }

  isProviderMode(): boolean {
    if (this.isDual()) return this.activeDualMode === 'PROVIDER';
    return this.isProvider();
  }

  switchDualMode(mode: 'SEEKER' | 'PROVIDER'): void {
    this.activeDualMode = mode;
  }

  getRoleBadgeLabel(): string {
    if (this.isAdmin()) return this.i18n.translate('System Admin', 'አስተዳዳሪ');
    if (this.isDual()) {
      return this.activeDualMode === 'SEEKER' 
        ? this.i18n.translate('Employer Mode', 'አሰሪ ሞድ')
        : this.i18n.translate('Provider Mode', 'ባለሙያ ሞድ');
    }
    if (this.isSeeker()) return this.i18n.translate('Employer Workspace', 'የአሰሪ ገበታ');
    if (this.isProvider()) return this.i18n.translate('Talent Workspace', 'የባለሙያ ገበታ');
    return this.i18n.translate('Marketplace', 'የስራ ገበያ');
  }

  getRoleBadgeClass(): string {
    if (this.isAdmin()) return 'badge-role-admin';
    if (this.isSeekerMode()) return 'badge-role-seeker';
    if (this.isProviderMode()) return 'badge-role-provider';
    return 'badge-role-guest';
  }
}
