import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { I18nService } from '../../services/i18n.service';
import { SidebarService } from '../../services/sidebar.service';
import { User, NotificationItem } from '../../models/models';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar">
      <div class="navbar-container">
        <!-- Left: Hamburger Drawer Toggle + Brand -->
        <div class="navbar-left">
          <button
            *ngIf="sidebarService.isAllowedOnCurrentRoute()"
            type="button"
            class="btn-hamburger"
            (click)="toggleSidebar()"
            title="Toggle sidebar navigation"
            aria-label="Toggle navigation">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>

          <a routerLink="/" class="navbar-brand">
            <div class="brand-logo-badge">EB</div>
            <div class="brand-text">
              <span class="brand-title">{{ i18n.t('nav.brandTitle') }}</span>
              <span class="brand-subtitle">{{ i18n.t('nav.brandSubtitle') }}</span>
            </div>
          </a>
        </div>

        <!-- Center: Dynamic Actor Quick Action -->
        <div class="navbar-center" *ngIf="currentUser">
          <a *ngIf="isSeeker()" routerLink="/listings/new" class="btn-quick-post">
            + {{ i18n.t('nav.postListing') }}
          </a>
          <a *ngIf="isPureProvider()" routerLink="/recommended" class="btn-quick-post">
            🎯 {{ i18n.t('nav.recommended') }}
          </a>
          <a *ngIf="isAdmin() && !isSeeker() && !isProvider()" routerLink="/admin" class="btn-quick-post">
            🛡️ {{ i18n.t('nav.admin') }}
          </a>
        </div>

        <!-- Right: Lang Toggle + Notifications + User Profile Dropdown -->
        <div class="auth-box">
          <!-- Language Switcher -->
          <button
            type="button"
            (click)="toggleLanguage()"
            class="btn-lang-toggle"
            [title]="i18n.lang() === 'en' ? 'ወደ አማርኛ ይቀይሩ' : 'Switch to English'">
            🌐 <strong>{{ i18n.lang() === 'en' ? 'አማርኛ' : 'EN' }}</strong>
          </button>

          <!-- Unauthenticated / Guest View -->
          <div *ngIf="!currentUser" class="guest-actions">
            <a routerLink="/login" class="btn btn-primary btn-sm">{{ i18n.t('nav.login') }}</a>
          </div>

          <!-- Authenticated View -->
          <div *ngIf="currentUser" class="user-session">
            <!-- Messages Link & Badge -->
            <a
              routerLink="/messages"
              class="btn-bell"
              [title]="i18n.t('nav.messages')"
              style="text-decoration: none; color: inherit;">
              💬
              <span *ngIf="unreadMessagesCount > 0" class="badge-bell-count">
                {{ unreadMessagesCount }}
              </span>
            </a>

            <!-- Notifications Bell & Dropdown -->
            <div class="notification-wrapper">
              <!-- Backdrop to close dropdown when clicking outside -->
              <div
                class="dropdown-backdrop"
                *ngIf="showNotifications"
                (click)="showNotifications = false">
              </div>

              <button
                type="button"
                (click)="toggleNotificationDropdown()"
                class="btn-bell"
                [title]="i18n.t('nav.notifications')">
                🔔
                <span *ngIf="unreadNotificationsCount > 0" class="badge-bell-count">
                  {{ unreadNotificationsCount }}
                </span>
              </button>

              <!-- Notifications Dropdown Drawer -->
              <div class="notification-dropdown" *ngIf="showNotifications">
                <div class="dropdown-header">
                  <h4>{{ i18n.t('nav.notifications') }}</h4>
                  <button (click)="markAllAsRead()" class="btn-mark-all" *ngIf="unreadNotificationsCount > 0">
                    {{ i18n.t('nav.markAllRead') }}
                  </button>
                </div>

                <div class="notifications-list" *ngIf="notifications.length > 0">
                  <div
                    *ngFor="let n of notifications"
                    class="notification-item"
                    [class.unread]="!n.isRead"
                    (click)="openNotification(n)">
                    <div class="item-title">{{ n.title }}</div>
                    <div class="item-body">{{ n.message }}</div>
                    <div class="item-time">{{ n.createdAt | date:'short' }}</div>
                  </div>
                </div>

                <div *ngIf="notifications.length === 0" class="empty-notifications">
                  {{ i18n.t('nav.noNotifications') }}
                </div>
              </div>
            </div>

            <!-- User Profile Menu Trigger & Dropdown -->
            <div class="profile-dropdown-wrapper">
              <!-- Backdrop to close dropdown when clicking outside -->
              <div
                class="dropdown-backdrop"
                *ngIf="showProfileDropdown"
                (click)="showProfileDropdown = false">
              </div>

              <!-- Profile Pill Button (Click to open menu with Sign Out) -->
              <button
                type="button"
                (click)="toggleProfileDropdown()"
                class="user-profile-pill"
                [class.active]="showProfileDropdown"
                title="Account menu & Sign Out">
                <div class="user-avatar">{{ (currentUser.fullName || currentUser.email).charAt(0).toUpperCase() }}</div>
                <div class="user-meta">
                  <span class="user-name">
                    {{ currentUser.fullName || currentUser.email }}
                    <span *ngIf="currentUser.isVerified" class="verified-check" title="Fayda ID Verified">✓</span>
                  </span>
                  <span class="user-role-badge">
                    {{ currentUser.roles.join(' & ') }}
                  </span>
                </div>
                <span class="profile-caret" [class.rotated]="showProfileDropdown">▾</span>
              </button>

              <!-- Profile Dropdown Menu Card -->
              <div class="profile-dropdown" *ngIf="showProfileDropdown">
                <!-- User Card Header -->
                <div class="profile-dropdown-header">
                  <div class="profile-dropdown-avatar">
                    {{ (currentUser.fullName || currentUser.email).charAt(0).toUpperCase() }}
                  </div>
                  <div class="profile-dropdown-info">
                    <strong class="profile-user-name">{{ currentUser.fullName || 'User' }}</strong>
                    <span class="profile-user-email">{{ currentUser.email }}</span>
                    <div class="profile-tags">
                      <span class="role-tag">{{ currentUser.roles.join(', ') }}</span>
                      <span class="verif-tag" [class.verified]="currentUser.isVerified">
                        {{ currentUser.isVerified ? i18n.translate('✓ Fayda Verified', '✓ በፋይዳ የተረጋገጠ') : i18n.translate('Unverified', 'ያልተረጋገጠ') }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="dropdown-separator"></div>

                  <!-- Seeker Specific Links -->
                  <ng-container *ngIf="isSeeker()">
                    <a
                      routerLink="/listings/my"
                      (click)="showProfileDropdown = false"
                      class="profile-menu-item">
                      <span class="p-icon">📋</span>
                      <span>{{ i18n.t('nav.myListings') }}</span>
                    </a>
                    <a
                      routerLink="/profile/seeker"
                      (click)="showProfileDropdown = false"
                      class="profile-menu-item">
                      <span class="p-icon">🏢</span>
                      <span>{{ i18n.t('nav.employerProfile') }}</span>
                    </a>
                  </ng-container>

                  <!-- Provider Specific Links -->
                  <ng-container *ngIf="isProvider()">
                    <a
                      routerLink="/recommended"
                      (click)="showProfileDropdown = false"
                      class="profile-menu-item">
                      <span class="p-icon">🎯</span>
                      <span>{{ i18n.t('nav.recommended') }}</span>
                    </a>
                    <a
                      routerLink="/my-applications"
                      (click)="showProfileDropdown = false"
                      class="profile-menu-item">
                      <span class="p-icon">📄</span>
                      <span>{{ i18n.t('nav.myApplications') }}</span>
                    </a>
                    <a
                      routerLink="/profile/provider"
                      (click)="showProfileDropdown = false"
                      class="profile-menu-item">
                      <span class="p-icon">👤</span>
                      <span>{{ i18n.t('nav.profile') }}</span>
                    </a>
                  </ng-container>

                  <!-- Admin Specific Links -->
                  <ng-container *ngIf="isAdmin()">
                    <a
                      routerLink="/admin"
                      (click)="showProfileDropdown = false"
                      class="profile-menu-item">
                      <span class="p-icon">🛡️</span>
                      <span>{{ i18n.t('nav.admin') }}</span>
                    </a>
                    <a
                      routerLink="/evaluation"
                      (click)="showProfileDropdown = false"
                      class="profile-menu-item">
                      <span class="p-icon">📊</span>
                      <span>{{ i18n.t('nav.evaluation') }}</span>
                    </a>
                  </ng-container>

                  <!-- Shared Workspace Links -->
                  <a
                    routerLink="/contracts"
                    (click)="showProfileDropdown = false"
                    class="profile-menu-item">
                    <span class="p-icon">💳</span>
                    <span>{{ i18n.t('nav.contracts') }}</span>
                  </a>

                  <a
                    routerLink="/messages"
                    (click)="showProfileDropdown = false"
                    class="profile-menu-item">
                    <span class="p-icon">💬</span>
                    <span>{{ i18n.t('nav.messages') }}</span>
                  </a>

                  <a
                    routerLink="/verification"
                    (click)="showProfileDropdown = false"
                    class="profile-menu-item">
                    <span class="p-icon">🪪</span>
                    <span>{{ i18n.t('nav.verification') }}</span>
                  </a>

                <div class="dropdown-separator"></div>

                <!-- Sign Out Option -->
                <button
                  type="button"
                  (click)="onLogout()"
                  class="profile-menu-item btn-signout-action"
                  title="Sign out of your session">
                  <span class="p-icon">🚪</span>
                  <span><strong>{{ i18n.t('nav.signOut') }}</strong></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    /* Static fixed navbar that NEVER hides when scrolling */
    .navbar {
      background-color: #FFFFFF;
      border-bottom: 1px solid var(--color-border);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 72px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(65, 63, 61, 0.06);
    }
    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 0 1.5rem;
      position: relative;
    }
    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .btn-hamburger {
      width: 40px;
      height: 40px;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 4.5px;
      cursor: pointer;
      padding: 0;
      transition: all 0.2s ease;
    }
    .btn-hamburger:hover {
      background: var(--color-cyan-subtle);
      border-color: var(--color-cyan);
    }
    .hamburger-line {
      width: 20px;
      height: 2px;
      background-color: var(--color-charcoal);
      border-radius: 2px;
      transition: all 0.2s ease;
    }
    .btn-hamburger:hover .hamburger-line {
      background-color: var(--color-cyan);
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    .brand-logo-badge {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--color-charcoal) 0%, var(--color-slate) 100%);
      color: #FFFFFF;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
      box-shadow: 0 2px 6px rgba(65, 63, 61, 0.2);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-charcoal);
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 0.7rem;
      color: var(--color-slate);
      font-weight: 500;
    }

    .navbar-center {
      display: flex;
      align-items: center;
    }
    .btn-quick-post {
      background-color: var(--color-cyan-subtle);
      color: #0E7F8F;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.45rem 1rem;
      border-radius: 6px;
      border: 1px solid rgba(28, 184, 205, 0.3);
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-quick-post:hover {
      background-color: var(--color-cyan);
      color: #FFFFFF;
    }

    .auth-box {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .btn-lang-toggle {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-charcoal);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.2s ease;
    }
    .btn-lang-toggle:hover {
      background: var(--color-cyan-subtle);
      border-color: var(--color-cyan);
      color: #0E7F8F;
    }
    .guest-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .user-session {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
    }

    /* Notifications Dropdown */
    .notification-wrapper {
      position: relative;
    }
    .btn-bell {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      position: relative;
      transition: all 0.2s ease;
    }
    .btn-bell:hover {
      background: rgba(28, 184, 205, 0.1);
      border-color: var(--color-cyan);
    }
    .badge-bell-count {
      position: absolute;
      top: -3px;
      right: -3px;
      background: var(--color-danger);
      color: #FFFFFF;
      font-size: 0.65rem;
      font-weight: 800;
      border-radius: 10px;
      padding: 0.1rem 0.35rem;
      line-height: 1;
    }
    .notification-dropdown {
      position: absolute;
      right: 0;
      top: 48px;
      width: 340px;
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.12);
      z-index: 1001;
      overflow: hidden;
    }
    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: var(--color-surface-subtle);
      border-bottom: 1px solid var(--color-border);
    }
    .dropdown-header h4 {
      margin: 0;
      font-size: 0.9rem;
      color: var(--color-charcoal);
    }
    .btn-mark-all {
      background: none;
      border: none;
      color: var(--color-cyan);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }
    .notifications-list {
      max-height: 320px;
      overflow-y: auto;
    }
    .notification-item {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .notification-item:hover {
      background: var(--color-surface-subtle);
    }
    .notification-item.unread {
      background: rgba(28, 184, 205, 0.05);
      border-left: 3px solid var(--color-cyan);
    }
    .item-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-charcoal);
      margin-bottom: 0.2rem;
    }
    .item-body {
      font-size: 0.8rem;
      color: var(--color-slate);
      line-height: 1.3;
      margin-bottom: 0.3rem;
    }
    .item-time {
      font-size: 0.7rem;
      color: var(--color-taupe);
    }
    .empty-notifications {
      padding: 1.5rem;
      text-align: center;
      color: var(--color-slate);
      font-size: 0.85rem;
    }

    /* Profile Trigger & Dropdown Menu */
    .profile-dropdown-wrapper {
      position: relative;
    }
    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      background: transparent;
    }
    .user-profile-pill {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.35rem 0.75rem 0.35rem 0.5rem;
      border-radius: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      z-index: 1001;
    }
    .user-profile-pill:hover, .user-profile-pill.active {
      border-color: var(--color-cyan);
      background: #FFFFFF;
      box-shadow: 0 2px 6px rgba(28, 184, 205, 0.12);
    }
    .user-avatar {
      width: 30px;
      height: 30px;
      background: var(--color-charcoal);
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.825rem;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .user-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-charcoal);
      line-height: 1.2;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .verified-check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      background: #10B981;
      color: #FFFFFF;
      border-radius: 50%;
      font-size: 0.6rem;
      font-weight: 900;
    }
    .user-role-badge {
      font-size: 0.675rem;
      color: var(--color-cyan);
      font-weight: 700;
      text-transform: uppercase;
    }
    .profile-caret {
      font-size: 0.75rem;
      color: var(--color-slate);
      transition: transform 0.2s ease;
      margin-left: 0.15rem;
    }
    .profile-caret.rotated {
      transform: rotate(180deg);
    }

    /* Profile Dropdown Menu */
    .profile-dropdown {
      position: absolute;
      right: 0;
      top: 48px;
      width: 290px;
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
      z-index: 1002;
      overflow: hidden;
      animation: fadeInDown 0.18s ease-out;
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .profile-dropdown-header {
      padding: 1rem 1.15rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      background: var(--color-surface-subtle);
    }
    .profile-dropdown-avatar {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, var(--color-charcoal) 0%, var(--color-slate) 100%);
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .profile-dropdown-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      overflow: hidden;
    }
    .profile-user-name {
      font-size: 0.925rem;
      color: var(--color-charcoal);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-user-email {
      font-size: 0.775rem;
      color: var(--color-slate);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-tags {
      display: flex;
      gap: 0.35rem;
      margin-top: 0.2rem;
      flex-wrap: wrap;
    }
    .role-tag {
      font-size: 0.65rem;
      font-weight: 700;
      background: var(--color-cyan-subtle);
      color: #0E7F8F;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .verif-tag {
      font-size: 0.65rem;
      font-weight: 700;
      background: rgba(105, 113, 132, 0.1);
      color: var(--color-slate);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }
    .verif-tag.verified {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }
    .dropdown-separator {
      height: 1px;
      background-color: var(--color-border);
    }
    .profile-dropdown-links {
      padding: 0.4rem 0;
      display: flex;
      flex-direction: column;
    }
    .profile-menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1.15rem;
      color: var(--color-charcoal);
      font-size: 0.865rem;
      font-weight: 600;
      text-decoration: none;
      transition: background 0.15s ease, color 0.15s ease;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
    }
    .profile-menu-item:hover {
      background: var(--color-surface-subtle);
      color: var(--color-cyan);
    }
    .p-icon {
      font-size: 1rem;
      width: 20px;
      text-align: center;
    }
    .btn-signout-action {
      color: var(--color-danger);
      padding: 0.75rem 1.15rem;
    }
    .btn-signout-action:hover {
      background: rgba(211, 47, 47, 0.08);
      color: var(--color-danger);
    }

    @media (max-width: 600px) {
      .brand-subtitle, .navbar-center {
        display: none;
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  unreadNotificationsCount = 0;
  unreadMessagesCount = 0;
  notifications: NotificationItem[] = [];
  showNotifications = false;
  showProfileDropdown = false;

  private pollSub?: Subscription;

  constructor(
    public sidebarService: SidebarService,
    public authService: AuthService,
    private apiService: ApiService,
    public i18n: I18nService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      if (u) {
        this.fetchAlerts();
      } else {
        this.notifications = [];
        this.unreadNotificationsCount = 0;
        this.unreadMessagesCount = 0;
        this.showProfileDropdown = false;
      }
    });

    this.pollSub = interval(5000).subscribe(() => {
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

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
    if (this.showProfileDropdown) {
      this.showNotifications = false;
    }
  }

  toggleNotificationDropdown(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showProfileDropdown = false;
      this.fetchAlerts();
    }
  }

  fetchAlerts(): void {
    this.apiService.getUnreadNotificationCount().subscribe({
      next: (res) => this.unreadNotificationsCount = res.unreadCount,
      error: () => {}
    });

    this.apiService.getUnreadMessageCount().subscribe({
      next: (res) => this.unreadMessagesCount = res.unreadCount,
      error: () => {}
    });

    this.apiService.getMyNotifications().subscribe({
      next: (res) => this.notifications = res || [],
      error: () => {}
    });
  }

  openNotification(n: NotificationItem): void {
    if (!n.isRead) {
      this.apiService.markNotificationRead(n.id).subscribe(() => {
        n.isRead = true;
        if (this.unreadNotificationsCount > 0) this.unreadNotificationsCount--;
      });
    }
    this.showNotifications = false;
    if (n.linkUrl) {
      this.router.navigateByUrl(n.linkUrl);
    }
  }

  markAllAsRead(): void {
    this.apiService.markAllNotificationsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadNotificationsCount = 0;
    });
  }

  toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  isSeeker(): boolean {
    return this.authService.isSeeker();
  }

  isProvider(): boolean {
    return this.authService.isProvider();
  }

  isPureSeeker(): boolean {
    return this.authService.isSeeker() && !this.authService.isProvider();
  }

  isPureProvider(): boolean {
    return this.authService.isProvider() && !this.authService.isSeeker();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onLogout(): void {
    this.showProfileDropdown = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
