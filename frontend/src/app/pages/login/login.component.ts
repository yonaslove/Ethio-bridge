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

          <div style="display: flex; justify-content: flex-end; margin-bottom: 1.25rem;">
            <button type="button" (click)="toggleForgotModal(true)" class="link-cyan" style="background: none; border: none; cursor: pointer; font-size: 0.825rem;">
              {{ i18n.translate('Forgot password?', 'የይለፍ ቃል ረሱ?') }}
            </button>
          </div>

          <div *ngIf="loading && isColdStarting" class="auth-notice" style="margin-bottom: 1rem; animation: pulse 2s infinite;">
            <span class="notice-icon">⏳</span> 
            <span>{{ i18n.translate('Cloud server is waking up from sleep mode (Render cold start). Please wait a few seconds...', 'የክላውድ ሰርቨሩ እየነቃ ነው (Render cold start)። እባክዎ ጥቂት ሰከንዶች ይጠብቁ...') }}</span>
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading || !emailOrUsername || !password">
            <span *ngIf="!loading">{{ i18n.translate('Sign In', 'ይግቡ') }}</span>
            <span *ngIf="loading" class="spinner-text">
              {{ isColdStarting ? i18n.translate('Waking server & Authenticating...', 'ሰርቨሩን በማስነሳት ላይ...') : i18n.translate('Authenticating...', 'በማረጋገጥ ላይ...') }}
            </span>
          </button>
        </form>

        <!-- Forgot / Reset Password Modal -->
        <div *ngIf="showForgotModal" class="modal-overlay" (click)="toggleForgotModal(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ i18n.translate('Password Recovery', 'የይለፍ ቃል ማግኛ') }}</h2>
              <button (click)="toggleForgotModal(false)" class="close-btn">&times;</button>
            </div>
            
            <div *ngIf="forgotSuccess" class="auth-success" style="margin-bottom: 1rem;">
              {{ forgotSuccess }}
            </div>
            <div *ngIf="forgotError" class="auth-error" style="margin-bottom: 1rem;">
              {{ forgotError }}
            </div>

            <div *ngIf="forgotStep === 'REQUEST'">
              <p style="font-size: 0.85rem; color: var(--color-slate); margin-bottom: 1rem;">
                {{ i18n.translate('Enter your registered email address or username to receive a secure recovery code.', 'የይለፍ ቃልዎን ለመቀየር የተመዘገቡበትን ኢሜይል ወይም የተጠቃሚ ስም ያስገቡ።') }}
              </p>
              <div class="form-group">
                <input
                  type="text"
                  [(ngModel)]="forgotEmail"
                  [placeholder]="i18n.translate('Registered email or username', 'የተመዘገበ ኢሜይል ወይም የተጠቃሚ ስም')"
                  class="form-input"
                />
              </div>
              <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem;">
                <button type="button" (click)="toggleForgotModal(false)" class="btn btn-secondary">
                  {{ i18n.translate('Cancel', 'ይቅር') }}
                </button>
                <button type="button" (click)="submitForgotRequest()" class="btn btn-primary" [disabled]="!forgotEmail || forgotLoading">
                  {{ forgotLoading ? i18n.translate('Sending...', 'በመላክ ላይ...') : i18n.translate('Send Code', 'ኮድ ላክ') }}
                </button>
              </div>
            </div>

            <div *ngIf="forgotStep === 'RESET'">
              <p style="font-size: 0.85rem; color: var(--color-slate); margin-bottom: 1rem;">
                {{ i18n.translate('Enter the recovery code and your new password.', 'የተላከውን ኮድ እና አዲሱን የይለፍ ቃል ያስገቡ።') }}
              </p>
              <div class="form-group">
                <label class="form-label">{{ i18n.translate('Recovery Code', 'የማረጋገጫ ኮድ') }}</label>
                <input type="text" [(ngModel)]="resetToken" placeholder="RESET-..." class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">{{ i18n.translate('New Password', 'አዲስ የይለፍ ቃል') }}</label>
                <input type="password" [(ngModel)]="resetNewPassword" [placeholder]="i18n.translate('Minimum 8 characters', 'ቢያንስ 8 ፊደላት')" class="form-input" />
              </div>
              <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem;">
                <button type="button" (click)="forgotStep = 'REQUEST'" class="btn btn-secondary">
                  {{ i18n.translate('Back', 'ተመለስ') }}
                </button>
                <button type="button" (click)="submitResetPassword()" class="btn btn-primary" [disabled]="!resetToken || !resetNewPassword || forgotLoading">
                  {{ forgotLoading ? i18n.translate('Resetting...', 'በመቀየር ላይ...') : i18n.translate('Update Password', 'የይለፍ ቃል ቀይር') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="auth-footer">
          <p>{{ i18n.translate("Don't have an account yet?", "አካውንት የለዎትም?") }} <a routerLink="/register" class="link-cyan">{{ i18n.t('nav.register') }}</a></p>
        </div>

        <!-- 1-Click Quick Login Persona Drawer for Testing -->
        <div class="quick-personas-section">
          <div class="quick-personas-header">
            <span>⚡ {{ i18n.translate('Instant 1-Click Test Sign-In', 'በ1-ጠቅታ ፈጣን መግቢያ') }}</span>
          </div>
          <p class="quick-personas-hint">
            {{ i18n.translate('Click any persona below to auto-fill credentials & enter directly:', 'ከታች ካሉት አንዱን በመምረጥ ወዲያውኑ ይግቡ፡') }}
          </p>
          <div class="persona-chips-grid">
            <button
              type="button"
              *ngFor="let p of personas"
              (click)="loginAsPersona(p.id)"
              [disabled]="loading"
              class="persona-chip-btn">
              <span class="chip-title">{{ p.name }}</span>
              <span class="chip-badge">{{ p.roleBadge }}</span>
            </button>
          </div>
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
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      padding: 2rem;
      max-width: 440px;
      width: 100%;
      box-shadow: var(--shadow-lg);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .modal-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--color-charcoal);
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--color-slate);
    }
    .quick-personas-section {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px dashed var(--color-border);
    }
    .quick-personas-header {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0E7F8F;
      margin-bottom: 0.35rem;
    }
    .quick-personas-hint {
      font-size: 0.775rem;
      color: var(--color-slate);
      margin-bottom: 0.75rem;
      line-height: 1.35;
    }
    .persona-chips-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    .persona-chip-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.85rem;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }
    .persona-chip-btn:hover {
      background: #F0F9FF;
      border-color: #0284C7;
      transform: translateY(-1px);
    }
    .persona-chip-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .chip-title {
      font-size: 0.825rem;
      font-weight: 700;
      color: #1E293B;
    }
    .chip-badge {
      font-size: 0.725rem;
      font-weight: 600;
      color: #0284C7;
      background: #E0F2FE;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
  `]
})
export class LoginComponent implements OnInit {
  emailOrUsername = '';
  password = '';
  showPassword = false;
  loading = false;
  isColdStarting = false;
  private coldStartTimer: any = null;
  errorMessage = '';
  noticeMessage = '';
  successMessage = '';
  returnUrl = '/';
  personas: PersonaQuickOption[] = TEST_PERSONAS;

  // Forgot password modal state
  showForgotModal = false;
  forgotStep: 'REQUEST' | 'RESET' = 'REQUEST';
  forgotEmail = '';
  resetToken = '';
  resetNewPassword = '';
  forgotLoading = false;
  forgotSuccess = '';
  forgotError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public i18n: I18nService
  ) {}

  toggleForgotModal(open: boolean): void {
    this.showForgotModal = open;
    this.forgotStep = 'REQUEST';
    this.forgotError = '';
    this.forgotSuccess = '';
  }

  submitForgotRequest(): void {
    if (!this.forgotEmail) return;
    this.forgotLoading = true;
    this.forgotError = '';
    this.forgotSuccess = '';

    this.authService.forgotPassword(this.forgotEmail.trim()).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.forgotSuccess = res.message || 'Recovery code generated. Check your inbox or system console.';
        this.forgotStep = 'RESET';
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err?.error?.message || 'Failed to send recovery code. Please check the identifier.';
      }
    });
  }

  submitResetPassword(): void {
    if (!this.resetToken || !this.resetNewPassword) return;
    this.forgotLoading = true;
    this.forgotError = '';
    this.forgotSuccess = '';

    this.authService.resetPassword(this.resetToken.trim(), this.resetNewPassword).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.successMessage = 'Password updated successfully! Please sign in with your new password.';
        this.showForgotModal = false;
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = err?.error?.message || 'Invalid or expired recovery code.';
      }
    });
  }

  ngOnInit(): void {
    // Proactively ping the cloud container to ensure it is awake immediately while user types credentials
    this.authService.pingWarmup();

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.route.snapshot.queryParams['registered'] === 'true') {
      this.successMessage = 'Account created successfully! Please sign in with your email and password to enter your workspace.';
      if (this.route.snapshot.queryParams['email']) {
        this.emailOrUsername = this.route.snapshot.queryParams['email'];
      }
    } else if (this.route.snapshot.queryParams['expired'] === 'true') {
      this.noticeMessage = 'Your session has expired. Please sign in to resume your workspace.';
    } else if (this.route.snapshot.queryParams['returnUrl']) {
      this.noticeMessage = 'Please sign in to access that protected portal or page.';
    }
  }

  private startColdStartTimer(): void {
    this.isColdStarting = false;
    clearTimeout(this.coldStartTimer);
    // If request takes longer than 1.2s, it indicates a Render container cold start
    this.coldStartTimer = setTimeout(() => {
      if (this.loading) {
        this.isColdStarting = true;
      }
    }, 1200);
  }

  private stopColdStartTimer(): void {
    clearTimeout(this.coldStartTimer);
    this.isColdStarting = false;
  }

  onSubmit(): void {
    if (!this.emailOrUsername || !this.password) return;

    this.loading = true;
    this.errorMessage = '';
    this.startColdStartTimer();

    this.authService.login({
      emailOrUsername: this.emailOrUsername,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.stopColdStartTimer();
        this.loading = false;
        this.navigateAfterLogin(res.roles);
      },
      error: (err) => {
        this.stopColdStartTimer();
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Authentication failed. Please verify your credentials.';
      }
    });
  }

  loginAsPersona(personaId: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.startColdStartTimer();

    this.authService.quickLoginAs(personaId).subscribe({
      next: (res) => {
        this.stopColdStartTimer();
        this.loading = false;
        this.navigateAfterLogin(res.roles);
      },
      error: (err) => {
        this.stopColdStartTimer();
        this.loading = false;
        this.errorMessage = err?.error?.message || (err?.status === 0 ? 'Cloud server is waking up. Please wait a moment and try again.' : 'Quick sign-in failed. Please try again.');
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
