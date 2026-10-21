import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { I18nService } from '../../services/i18n.service';
import { ToastService } from '../../services/toast.service';
import { ProviderProfile, Location, Skill, ProviderSkill } from '../../models/models';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container profile-page">
      <div class="profile-header">
        <h1>Provider Profile & Skills</h1>
        <p>Your profile is analyzed by the AI engine to recommend jobs, freelance contracts, and local services</p>
      </div>

      <div *ngIf="savedSuccess" class="alert-success" style="margin-bottom: 1.5rem;">
        Profile and skills successfully updated!
      </div>

      <div class="profile-layout" *ngIf="profile">
        <!-- Main Profile Form -->
        <div class="card form-column">
          <h3>Personal & Professional Details</h3>

          <div class="form-group">
            <label class="form-label">Professional Headline</label>
            <input type="text" [(ngModel)]="profile.headline" class="form-input" placeholder="e.g. Senior Java Backend Specialist" />
          </div>

          <div class="form-group">
            <label class="form-label">Biography & Overview</label>
            <textarea [(ngModel)]="profile.bio" rows="4" class="form-textarea" placeholder="Detail your background, industry experience, and strengths..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Years of Experience</label>
              <input type="number" [(ngModel)]="profile.yearsExperience" class="form-input" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label">Location (City / Zone)</label>
              <select [(ngModel)]="profile.locationId" class="form-select">
                <option [ngValue]="null">Select location...</option>
                <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="form-group">
              <label class="form-label">Availability</label>
              <select [(ngModel)]="profile.availability" class="form-select">
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="HOURLY">Hourly / Consulting</option>
                <option value="ONE_OFF">One-Off Gigs</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Hourly Rate (ETB)</label>
              <input type="number" [(ngModel)]="profile.hourlyRate" class="form-input" placeholder="e.g. 750" />
            </div>

            <div class="form-group">
              <label class="form-label">Primary Category Focus</label>
              <select [(ngModel)]="profile.categoryFocus" class="form-select">
                <option value="ANY">Any / All Pillars</option>
                <option value="EMPLOYMENT">Employment (Jobs)</option>
                <option value="FREELANCING">Freelancing</option>
                <option value="LOCAL_SERVICE">Local Services</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Profile Avatar / Headshot URL</label>
              <input type="url" [(ngModel)]="profile.avatarUrl" class="form-input" placeholder="https://... or photo link" />
            </div>

            <div class="form-group">
              <label class="form-label">Portfolio / GitHub / Work Link</label>
              <input type="url" [(ngModel)]="profile.portfolioUrl" class="form-input" placeholder="https://github.com/... or portfolio" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Education & Certifications</label>
              <input type="text" [(ngModel)]="profile.education" class="form-input" placeholder="e.g. BSc Computer Science - AAU, TVET Certified" />
            </div>

            <div class="form-group">
              <label class="form-label">Languages Spoken</label>
              <input type="text" [(ngModel)]="profile.languages" class="form-input" placeholder="e.g. Amharic, English, Afaan Oromoo" />
            </div>
          </div>

          <div class="form-section-divider"></div>

          <!-- Skills Manager -->
          <div class="skills-management-section">
            <h3>Skills & Competencies</h3>
            <p class="section-hint">Add key technical or trade competencies with your proficiency level (1 to 5).</p>

            <div class="add-skill-row">
              <select [(ngModel)]="selectedSkillId" class="form-select flex-1">
                <option [ngValue]="null">Select a skill from catalog...</option>
                <option *ngFor="let s of catalogSkills" [ngValue]="s.id">{{ s.name }} ({{ s.category }})</option>
              </select>

              <select [(ngModel)]="skillProficiency" class="form-select" style="width: 150px;">
                <option [ngValue]="5">5 - Expert</option>
                <option [ngValue]="4">4 - Advanced</option>
                <option [ngValue]="3">3 - Intermediate</option>
                <option [ngValue]="2">2 - Basic</option>
                <option [ngValue]="1">1 - Novice</option>
              </select>

              <input type="number" [(ngModel)]="skillYears" class="form-input" style="width: 110px;" placeholder="Years" min="0" step="0.5" />

              <button (click)="addSkill()" [disabled]="!selectedSkillId" class="btn btn-secondary">+ Add</button>
            </div>

            <div class="skills-list" *ngIf="profile.skills && profile.skills.length > 0">
              <div *ngFor="let s of profile.skills; let i = index" class="skill-row-item">
                <div>
                  <strong>{{ s.skillName || 'Skill #' + s.skillId }}</strong>
                  <span class="skill-meta-tag">Proficiency: {{ s.proficiency }}/5 • {{ s.yearsExperience }} yrs</span>
                </div>
                <button (click)="removeSkill(i)" class="btn-remove">✕</button>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center" style="margin-top: 2rem;">
            <button (click)="saveProfile()" [disabled]="saving" class="btn btn-primary">
              {{ saving ? 'Saving Changes...' : 'Save Profile & Skills' }}
            </button>
          </div>
        </div>

        <!-- Preview & Monetization Column -->
        <div class="preview-column">
          <!-- 1. Connects (Proposal Tokens) Card -->
          <div class="card preview-card connects-status-card">
            <div class="flex justify-between items-center">
              <h3>🪙 {{ i18n.translate('Proposal Connects', 'የማመልከቻ ነጥቦች') }}</h3>
              <span class="badge badge-job">{{ profile.isPro ? 'Pro: 1/app' : 'Standard: 2/app' }}</span>
            </div>
            <div class="connects-number-display">
              <span class="connects-num">{{ profile.connectsBalance ?? 20 }}</span>
              <span class="connects-label">{{ i18n.translate('Connects Available', 'ቀሪ ነጥቦች') }}</span>
            </div>
            <p class="preview-hint">
              {{ i18n.translate('Connects are consumed when submitting proposals. Recharged instantly via Telebirr.', 'ማመልከቻ ሲያስገቡ ነጥቦች ይቀነሳሉ። በቴሌብር ወዲያውኑ መግዛት ይችላሉ።') }}
            </p>
            <button type="button" (click)="openTopupModal()" class="btn btn-primary w-full">
              ⚡ {{ i18n.translate('Top Up Connects', 'ነጥብ ይግዙ') }}
            </button>
          </div>

          <!-- 2. EthioBridge Pro Talent Card -->
          <div class="card preview-card pro-card" [class.pro-active]="profile.isPro">
            <div class="flex justify-between items-center">
              <h3>⭐ {{ i18n.translate('EthioBridge Pro', 'ኢትዮብሪጅ ፕሮ') }}</h3>
              <span class="badge" [ngClass]="profile.isPro ? 'badge-status-open' : 'badge-local'">
                {{ profile.isPro ? 'ACTIVE' : 'UPGRADE' }}
              </span>
            </div>
            <div *ngIf="profile.isPro" class="pro-active-info">
              <p class="pro-tagline">✓ {{ i18n.translate('Verified Pro Talent Badge Active', 'የተረጋገጠ የፕሮ ባለሙያ ባጅ ነቅቷል') }}</p>
              <small class="text-slate">{{ i18n.translate('Renews:', 'የሚያበቃው:') }} {{ profile.proExpiresAt | date:'mediumDate' }}</small>
            </div>
            <div *ngIf="!profile.isPro" class="pro-upgrade-info">
              <p class="pro-tagline">{{ i18n.translate('Boost your earnings with Pro perks for 299 ETB/mo:', 'በወር 299 ብር ገቢዎን ያሳድጉ፡') }}</p>
              <ul class="pro-perks-list">
                <li>⭐ {{ i18n.translate('Verified Pro Talent Badge on Profile', 'በመገለጫዎ ላይ የፕሮ ባለሙያ ባጅ') }}</li>
                <li>🎯 {{ i18n.translate('50% Discount on proposal tokens (1 Connect/app)', '50% ቅናሽ በማመልከቻ ነጥቦች (1 ነጥብ በስራ)') }}</li>
                <li>🪙 {{ i18n.translate('+30 Bonus Connects added immediately', '+30 ነፃ የማመልከቻ ነጥቦች ወዲያውኑ') }}</li>
                <li>📈 {{ i18n.translate('Priority ranking in AI Candidate recommendations', 'በ AI እጩዎች ዝርዝር ውስጥ ቀዳሚነት') }}</li>
              </ul>
              <button type="button" (click)="subscribePro()" class="btn btn-secondary w-full" style="margin-top: 1rem;">
                ⭐ {{ i18n.translate('Upgrade to Pro (299 ETB via Telebirr / Chapa)', 'ወደ ፕሮ ያሳድጉ (299 ብር በቴሌብር / ቻፓ)') }}
              </button>
            </div>
          </div>

          <!-- 3. AI Vector Representation -->
          <div class="card preview-card">
            <h3>AI Vector Representation</h3>
            <p class="preview-hint">This synthesized text is computed by the backend and embedded into the vector space for matching:</p>
            <div class="vector-text-box">
              {{ profile.profileText || 'Fill in your headline, bio, and skills to generate embedding text.' }}
            </div>
            <div class="preview-meta">
              <span>Embedding Engine: paraphrase-multilingual-MiniLM-L12-v2</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Connects Top-Up Modal -->
      <div *ngIf="showTopupModal" class="modal-backdrop">
        <div class="modal-content">
          <div class="flex justify-between items-center" style="margin-bottom: 1.5rem;">
            <h2>🪙 {{ i18n.translate('Top Up Connects', 'የማመልከቻ ነጥቦችን ይግዙ') }}</h2>
            <button (click)="showTopupModal = false" class="btn-close">✕</button>
          </div>

          <div *ngIf="topupSuccess" class="alert-success" style="margin-bottom: 1rem;">
            {{ topupSuccess }}
          </div>
          <div *ngIf="topupError" class="alert-danger" style="margin-bottom: 1rem;">
            {{ topupError }}
          </div>

          <div class="form-group">
            <label class="form-label">{{ i18n.translate('Select Connects Package', 'የነጥብ ጥቅል ይምረጡ') }}</label>
            <div class="topup-packages-grid">
              <div class="package-pill" [class.selected]="selectedConnectsAmount === 10" (click)="selectedConnectsAmount = 10">
                <div class="pkg-num">10 Connects</div>
                <div class="pkg-price">50 ETB</div>
              </div>
              <div class="package-pill" [class.selected]="selectedConnectsAmount === 25" (click)="selectedConnectsAmount = 25">
                <div class="pkg-num">25 Connects</div>
                <div class="pkg-price">100 ETB</div>
                <span class="pkg-badge">POPULAR</span>
              </div>
              <div class="package-pill" [class.selected]="selectedConnectsAmount === 60" (click)="selectedConnectsAmount = 60">
                <div class="pkg-num">60 Connects</div>
                <div class="pkg-price">200 ETB</div>
                <span class="pkg-badge">BEST VALUE</span>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">{{ i18n.translate('Payment Gateway (Ethiopian Rails)', 'የመክፈያ ዘዴ') }}</label>
            <select [(ngModel)]="selectedPaymentMethod" class="form-select">
              <option value="TELEBIRR">Telebirr (ቴሌብር)</option>
              <option value="CBE_BIRR">CBE Birr (ሲቢኢ ብር)</option>
              <option value="CHAPA">Chapa (ቻፓ)</option>
            </select>
          </div>

          <div class="flex justify-between items-center" style="margin-top: 1.5rem;">
            <button (click)="showTopupModal = false" class="btn btn-secondary">{{ i18n.translate('Cancel', 'ይቅር') }}</button>
            <button (click)="confirmTopup()" [disabled]="submittingTopup" class="btn btn-primary">
              {{ submittingTopup ? i18n.translate('Processing...', 'በማስኬድ ላይ...') : i18n.translate('Pay & Top Up Now', 'አሁን ይክፈሉ') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      padding: 2.5rem 1.5rem 5rem;
    }
    .profile-header {
      margin-bottom: 2rem;
    }
    .profile-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
    }
    .form-column {
      background: #FFFFFF;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-column h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }
    .form-section-divider {
      height: 1px;
      background-color: var(--color-border);
      margin: 1rem 0;
    }
    .section-hint {
      font-size: 0.85rem;
      color: var(--color-slate);
      margin-bottom: 1rem;
    }
    .add-skill-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .skills-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .skill-row-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.65rem 1rem;
      border-radius: 6px;
    }
    .skill-meta-tag {
      font-size: 0.75rem;
      color: var(--color-slate);
      margin-left: 0.75rem;
    }
    .btn-remove {
      background: none;
      border: none;
      color: var(--color-slate);
      cursor: pointer;
      font-weight: 700;
    }
    .preview-card {
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .preview-hint {
      font-size: 0.825rem;
      color: var(--color-slate);
    }
    .vector-text-box {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      line-height: 1.6;
      color: #444;
      font-family: monospace;
    }
    .preview-meta {
      font-size: 0.725rem;
      color: var(--color-slate);
      border-top: 1px solid var(--color-border);
      padding-top: 0.75rem;
    }
    .alert-success {
      background-color: rgba(46, 125, 50, 0.12);
      color: var(--color-success);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-weight: 600;
    }
    .connects-status-card {
      border: 1px solid rgba(28, 184, 205, 0.3);
      background: linear-gradient(180deg, #F0FBFD 0%, #FFFFFF 100%);
      margin-bottom: 1.5rem;
    }
    .connects-number-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.25rem 0;
    }
    .connects-num {
      font-size: 2.75rem;
      font-weight: 800;
      color: #0E7F8F;
      line-height: 1;
    }
    .connects-label {
      font-size: 0.825rem;
      color: var(--color-slate);
      font-weight: 600;
      margin-top: 0.35rem;
    }
    .pro-card {
      border: 1px solid #FFE082;
      background: linear-gradient(180deg, #FFFDF0 0%, #FFFFFF 100%);
      margin-bottom: 1.5rem;
    }
    .pro-card.pro-active {
      border-color: #81C784;
      background: linear-gradient(180deg, #F1F8E9 0%, #FFFFFF 100%);
    }
    .pro-tagline {
      font-size: 0.85rem;
      font-weight: 600;
      margin: 0.5rem 0;
      color: var(--color-charcoal);
    }
    .pro-perks-list {
      list-style: none;
      padding: 0;
      margin: 0.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.775rem;
      color: var(--color-charcoal);
    }
    .topup-packages-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .package-pill {
      border: 2px solid var(--color-border);
      border-radius: 8px;
      padding: 0.85rem 0.5rem;
      text-align: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    }
    .package-pill:hover {
      border-color: var(--color-cyan);
    }
    .package-pill.selected {
      border-color: var(--color-cyan);
      background: var(--color-cyan-subtle);
    }
    .pkg-num {
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .pkg-price {
      font-size: 0.8rem;
      color: #0E7F8F;
      font-weight: 700;
      margin-top: 0.2rem;
    }
    .pkg-badge {
      position: absolute;
      top: -9px;
      right: 4px;
      background: #F57C00;
      color: #FFF;
      font-size: 0.55rem;
      font-weight: 800;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    @media (max-width: 900px) {
      .profile-layout, .grid-cols-2, .grid-cols-3 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProviderProfileComponent implements OnInit {
  profile?: ProviderProfile;
  locations: Location[] = [];
  catalogSkills: Skill[] = [];

  selectedSkillId: number | null = null;
  skillProficiency = 4;
  skillYears = 2.0;

  saving = false;
  savedSuccess = false;

  showTopupModal = false;
  selectedConnectsAmount = 10;
  selectedPaymentMethod = 'CHAPA';
  submittingTopup = false;
  topupSuccess = '';
  topupError = '';

  constructor(
    private apiService: ApiService,
    public i18n: I18nService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.apiService.getLocations().subscribe(l => this.locations = l || []);
    this.apiService.getSkills().subscribe(s => this.catalogSkills = s || []);
    this.loadProfile();

    this.route.queryParams.subscribe(params => {
      if (params['chapa_connects'] && params['tx_ref']) {
        const txRef = params['tx_ref'];
        this.toastService.info('Verifying Chapa token purchase payment...', 'Chapa Gateway');
        this.apiService.verifyConnectsTopup(txRef).subscribe({
          next: (res) => {
            if (res && res.status === 'SUCCESS') {
              if (this.profile && res.newBalance !== undefined) {
                this.profile.connectsBalance = res.newBalance;
              }
              this.toastService.success(
                `🎉 Chapa payment successful! Added ${res.connectsAdded || ''} Connects to your balance.`,
                'Connects Credited'
              );
              this.loadProfile();
            } else {
              this.toastService.error('Chapa payment was not completed or failed. No connects were added.', 'Payment Incomplete');
            }
          },
          error: () => {
            this.toastService.error('Failed to verify Chapa payment.', 'Verification Error');
          }
        });
      }
    });
  }

  loadProfile(): void {
    this.apiService.getProviderProfile().subscribe(p => {
      this.profile = p;
    });
  }

  addSkill(): void {
    if (!this.profile || !this.selectedSkillId) return;
    const skillObj = this.catalogSkills.find(s => s.id === this.selectedSkillId);
    if (skillObj) {
      if (!this.profile.skills) this.profile.skills = [];
      const existing = this.profile.skills.find(s => s.skillId === skillObj.id);
      if (existing) {
        existing.proficiency = this.skillProficiency;
        existing.yearsExperience = this.skillYears;
      } else {
        this.profile.skills.push({
          skillId: skillObj.id,
          skillName: skillObj.name,
          skillSlug: skillObj.slug,
          category: skillObj.category,
          proficiency: this.skillProficiency,
          yearsExperience: this.skillYears
        });
      }
      this.selectedSkillId = null;
    }
  }

  removeSkill(index: number): void {
    if (this.profile && this.profile.skills) {
      this.profile.skills.splice(index, 1);
    }
  }

  saveProfile(): void {
    if (!this.profile) return;
    this.saving = true;
    this.savedSuccess = false;

    this.apiService.updateProviderProfile({
      headline: this.profile.headline,
      bio: this.profile.bio,
      yearsExperience: this.profile.yearsExperience,
      locationId: this.profile.locationId,
      availability: this.profile.availability,
      hourlyRate: this.profile.hourlyRate,
      categoryFocus: this.profile.categoryFocus,
      avatarUrl: this.profile.avatarUrl,
      portfolioUrl: this.profile.portfolioUrl,
      education: this.profile.education,
      languages: this.profile.languages
    }).subscribe({
      next: (updatedProfile) => {
        // Now update skills
        const skillsPayload = (this.profile?.skills || []).map(s => ({
          skillId: s.skillId,
          proficiency: s.proficiency,
          yearsExperience: s.yearsExperience
        }));

        this.apiService.updateProviderSkills(skillsPayload).subscribe({
          next: (withSkills) => {
            this.profile = withSkills;
            this.saving = false;
            this.savedSuccess = true;
            setTimeout(() => this.savedSuccess = false, 4000);
          },
          error: () => this.saving = false
        });
      },
      error: () => this.saving = false
    });
  }

  openTopupModal(): void {
    this.showTopupModal = true;
    this.topupSuccess = '';
    this.topupError = '';
  }

  confirmTopup(): void {
    this.submittingTopup = true;
    this.topupError = '';
    this.topupSuccess = '';

    if (this.selectedPaymentMethod === 'CHAPA') {
      this.apiService.topUpConnects(this.selectedConnectsAmount, 'CHAPA').subscribe({
        next: (res: any) => {
          this.submittingTopup = false;
          const targetUrl = res?.checkoutUrl || res?.checkout_url;
          if (targetUrl) {
            window.location.href = targetUrl;
          } else {
            this.topupError = 'Could not generate Chapa checkout URL. Please try again.';
          }
        },
        error: (err: any) => {
          this.submittingTopup = false;
          this.topupError = err.error?.message || 'Payment initiation failed. Please try again.';
        }
      });
      return;
    }

    this.apiService.topUpConnects(this.selectedConnectsAmount, this.selectedPaymentMethod).subscribe({
      next: (res) => {
        this.submittingTopup = false;
        if (this.profile) {
          this.profile.connectsBalance = res.newBalance;
        }
        this.topupSuccess = `Success! Added ${res.addedConnects} Connects. Current Balance: ${res.newBalance} Connects. Reference: ${res.referenceId}`;
        setTimeout(() => this.showTopupModal = false, 2500);
      },
      error: (err) => {
        this.submittingTopup = false;
        this.topupError = err.error?.message || 'Payment processing failed. Please try again.';
      }
    });
  }

  subscribePro(): void {
    const method = this.selectedPaymentMethod || 'CHAPA';
    if (confirm(`Upgrade to EthioBridge Pro for 299 ETB / month via ${method}? (+30 bonus Connects and Verified Pro Badge)`)) {
      this.apiService.subscribeToPro(method).subscribe({
        next: (res) => {
          if (this.profile) {
            this.profile.isPro = true;
            this.profile.proExpiresAt = res.proExpiresAt;
            this.profile.connectsBalance = res.newConnectsBalance;
          }
          this.toastService.success(`Welcome to EthioBridge Pro! Activated via ${method} (Ref: ${res.referenceId}).`, 'Pro Membership Activated');
        },
        error: (err) => this.toastService.error(err.error?.message || 'Pro subscription upgrade failed.')
      });
    }
  }
}
