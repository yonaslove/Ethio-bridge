import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, TEST_PERSONAS, PersonaQuickOption } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-badge">EB</div>
          <h1 class="auth-title">{{ i18n.translate('Welcome Back', 'እንኳን በደህና መጡ') }}</h1>
          <p class="auth-subtitle">{{ i18n.translate('Sign in to your EthioBridge account to access your workspace', 'ወደ ኢትዮብሪጅ አካውንትዎ በመግባት ስራዎን ያከናውኑ') }}</p>
        </div>

        <div *ngIf="successMessage" class="auth-success">
          <span class="success-icon">✓</span> {{ successMessage }}
        </div>

        <div *ngIf="noticeMessage" class="auth-notice">
          <span class="notice-icon">ℹ️</span> {{ noticeMessage }}
        </div>

        <div *ngIf="errorMessage" class="auth-error">
          <span class="error-icon">⚠️</span> {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email" class="form-label">{{ i18n.translate('Email or Username', 'ኢሜይል ወይም የተጠቃሚ ስም') }}</label>
            <input
              type="text"
              id="email"
              name="email"
              [(ngModel)]="emailOrUsername"
              required
              [placeholder]="i18n.translate('e.g. seeker1@ethiobridge.et or your registered email', 'ለምሳሌ seeker1@ethiobridge.et ወይም የተመዘገበ ኢሜይል')"
              class="form-input"
              [disabled]="loading"
            />
          </div>

          <div class="form-group">
            <div class="flex justify-between items-center" style="margin-bottom: 0.35rem;">
              <label for="password" class="form-label" style="margin-bottom: 0;">{{ i18n.translate('Password', 'የይለፍ ቃል') }}</label>
              <button type="button" (click)="showPassword = !showPassword" class="text-btn">
                {{ showPassword ? i18n.translate('Hide', 'ደብቅ') : i18n.translate('Show', 'አሳይ') }}
              </button>
            </div>
            <input
              [type]="showPassword ? 'text' : 'password'"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              [placeholder]="i18n.translate('Enter your password', 'የይለፍ ቃልዎን ያስገቡ')"
              class="form-input"
              [disabled]="loading"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading || !emailOrUsername || !password">
            <span *ngIf="!loading">{{ i18n.translate('Sign In', 'ይግቡ') }}</span>
            <span *ngIf="loading" class="spinner-text">{{ i18n.translate('Authenticating...', 'በማረጋገጥ ላይ...') }}</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>{{ i18n.translate("Don't have an account yet?", "አካውንት የለዎትም?") }} <a routerLink="/register" class="link-cyan">{{ i18n.t('nav.register') }}</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 180px);
      padding: 3rem 1.5rem;
      background: radial-gradient(circle at top right, rgba(28, 184, 205, 0.05), transparent 40%), var(--color-bg);
    }
    .auth-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      max-width: 480px;
      width: 100%;
      box-shadow: var(--shadow-md);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--color-charcoal) 0%, var(--color-slate) 100%);
      color: #FFFFFF;
      font-weight: 800;
      font-size: 1.25rem;
      border-radius: 12px;
      margin-bottom: 1rem;
    }
    .auth-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-charcoal);
      margin-bottom: 0.5rem;
    }
    .auth-subtitle {
      font-size: 0.9rem;
      color: var(--color-slate);
    }
    .auth-success {
      background: rgba(46, 125, 50, 0.12);
      border-left: 4px solid var(--color-success);
      color: var(--color-success);
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .auth-notice {
      background: rgba(28, 184, 205, 0.1);
      border-left: 4px solid var(--color-cyan);
      color: #0E7F8F;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .auth-error {
      background: rgba(211, 47, 47, 0.1);
      border-left: 4px solid var(--color-danger);
      color: var(--color-danger);
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-charcoal);
      margin-bottom: 0.4rem;
    }
    .form-input {
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.95rem;
      background: var(--color-surface);
      color: var(--color-charcoal);
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus {
      border-color: var(--color-cyan);
      box-shadow: 0 0 0 3px var(--color-cyan-subtle);
    }
    .btn-block {
      width: 100%;
    }
    .text-btn {
      background: none;
      border: none;
      color: var(--color-cyan);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .auth-divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.75rem 0 1.25rem;
    }
    .auth-divider::before, .auth-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--color-border);
    }
    .auth-divider span {
      padding: 0 0.75rem;
      font-size: 0.725rem;
      font-weight: 700;
      color: var(--color-slate);
      letter-spacing: 0.05em;
    }
    .quick-personas-label {
      font-size: 0.8rem;
      color: var(--color-slate);
      margin-bottom: 0.75rem;
      text-align: center;
    }
    .persona-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .persona-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-surface-subtle);
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }
    .persona-btn:hover {
      background: #FFFFFF;
      border-color: var(--color-cyan);
      transform: translateX(4px);
    }
    .p-avatar {
      width: 28px;
      height: 28px;
      background: var(--color-mist);
      color: var(--color-charcoal);
      font-weight: 800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }
    .p-info {
      display: flex;
      flex-direction: column;
    }
    .p-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-charcoal);
    }
    .p-badge {
      font-size: 0.725rem;
      color: var(--color-slate);
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--color-border);
      font-size: 0.875rem;
      color: var(--color-slate);
    }
    .link-cyan {
      color: var(--color-cyan);
      font-weight: 700;
      text-decoration: none;
    }
    .link-cyan:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit {
  emailOrUsername = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  noticeMessage = '';
  successMessage = '';
  returnUrl = '/';
  personas: PersonaQuickOption[] = TEST_PERSONAS;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.route.snapshot.queryParams['registered'] === 'true') {
      this.successMessage = 'Account created successfully! Please sign in with your email and password to enter your workspace.';
      if (this.route.snapshot.queryParams['email']) {
        this.emailOrUsername = this.route.snapshot.queryParams['email'];
      }
    } else if (this.route.snapshot.queryParams['returnUrl']) {
      this.noticeMessage = 'Please sign in to access that protected portal or page.';
    }
  }

  onSubmit(): void {
    if (!this.emailOrUsername || !this.password) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({
      emailOrUsername: this.emailOrUsername,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.navigateAfterLogin(res.roles);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Authentication failed. Please verify your credentials.';
      }
    });
  }

  loginAsPersona(personaId: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.quickLoginAs(personaId).subscribe({
      next: (res) => {
        this.loading = false;
        this.navigateAfterLogin(res.roles);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Quick sign-in failed. Please try again.';
      }
    });
  }

  private navigateAfterLogin(roles: string[]): void {
    if (this.returnUrl && this.returnUrl !== '/') {
      // If user is a Seeker and was redirected from a listing URL, route to applications review page
      if (roles.includes('SEEKER')) {
        const listingMatch = this.returnUrl.match(/\/listings\/([0-9a-fA-F-]+)/);
        if (listingMatch && !this.returnUrl.includes('/applications')) {
          const listingId = listingMatch[1];
          this.router.navigate(['/listings', listingId, 'applications']);
          return;
        }
      }
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin']);
    } else if (roles.includes('SEEKER')) {
      this.router.navigate(['/listings/my']);
    } else if (roles.includes('PROVIDER')) {
      this.router.navigate(['/recommended']);
    } else {
      this.router.navigate(['/browse']);
    }
  }
}
