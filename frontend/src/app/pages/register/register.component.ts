import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { I18nService } from '../../services/i18n.service';
import { Location, Skill, RegisterPayload } from '../../models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="register-card">
        <div class="auth-header">
          <div class="brand-badge">EB</div>
          <h1 class="auth-title">{{ i18n.translate('Join EthioBridge', 'ኢትዮብሪጅን ይቀላቀሉ') }}</h1>
          <p class="auth-subtitle">{{ i18n.translate('Create a professional account tailored for Ethiopian talent and employers', 'ለኢትዮጵያ ባለሙያዎች እና አሰሪዎች የተዘጋጀ ፕሮፌሽናል አካውንት ይፍጠሩ') }}</p>
        </div>

        <div *ngIf="errorMessage" class="auth-error">
          <span class="error-icon">⚠️</span> {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" class="register-form" autocomplete="off" novalidate>
          <!-- Step 1: Responsibility & Role Selection -->
          <div class="role-selection-section">
            <label class="section-label">{{ i18n.translate('1. Choose Your Primary Responsibility', '1. ዋና ኃላፊነትዎን ይምረጡ') }}</label>
            <div class="role-cards-grid">
              <!-- Provider Card -->
              <div
                class="role-card"
                [class.selected]="selectedRole === 'PROVIDER'"
                (click)="selectedRole = 'PROVIDER'"
              >
                <div class="role-card-header">
                  <span class="role-icon">🛠️</span>
                  <span class="role-check" *ngIf="selectedRole === 'PROVIDER'">✓</span>
                </div>
                <h3 class="role-name">{{ i18n.translate('Offer Services (Provider / Freelancer)', 'አገልግሎት መስጠት (ባለሙያ / Provider)') }}</h3>
                <p class="role-desc">
                  {{ i18n.translate('Showcase your skills in tech, design, writing, or local trade services and get matched to high-fit job opportunities.', 'በቴክኖሎጂ፣ በዲዛይን፣ በፅሁፍ ወይም በሙያ አገልግሎቶች ያለኝን ክህሎት አሳይቼ ተስማሚ የስራ እድሎችን ማግኘት እፈልጋለሁ።') }}
                </p>
                <div class="role-badge-tag">{{ i18n.translate('Work & Earn', 'ስራ ሰርተው ገቢ ያግኙ') }}</div>
              </div>

              <!-- Seeker Card -->
              <div
                class="role-card"
                [class.selected]="selectedRole === 'SEEKER'"
                (click)="selectedRole = 'SEEKER'"
              >
                <div class="role-card-header">
                  <span class="role-icon">🏢</span>
                  <span class="role-check" *ngIf="selectedRole === 'SEEKER'">✓</span>
                </div>
                <h3 class="role-name">{{ i18n.translate('Hire Talent (Client / Seeker)', 'ባለሙያ መቅጠር (አሰሪ / Seeker)') }}</h3>
                <p class="role-desc">
                  {{ i18n.translate('Post jobs, freelance projects, or local service requests and review applicants with explainable AI semantic matching.', 'ስራዎችን፣ የፍሪላንስ ፕሮጀክቶችን ወይም የአካባቢ አገልግሎቶችን መለጠፍ እና አመልካቾችን በ AI ማዛመጃ መገምገም እፈልጋለሁ።') }}
                </p>
                <div class="role-badge-tag">{{ i18n.translate('Post & Hire', 'ስራ ይለጥፉ እና ይቅጠሩ') }}</div>
              </div>

              <!-- Dual Card -->
              <div
                class="role-card"
                [class.selected]="selectedRole === 'DUAL'"
                (click)="selectedRole = 'DUAL'"
              >
                <div class="role-card-header">
                  <span class="role-icon">🔄</span>
                  <span class="role-check" *ngIf="selectedRole === 'DUAL'">✓</span>
                </div>
                <h3 class="role-name">{{ i18n.translate('Dual Role (Client & Provider)', 'ሁለቱንም ሚናዎች (አሰሪ እና ባለሙያ)') }}</h3>
                <p class="role-desc">
                  {{ i18n.translate('Post listings to hire contractors while also offering your specialized professional services on the marketplace.', 'ባለሙያዎችን መቅጠር እንዲሁም የራስዎን ሙያዊ አገልግሎቶች ማቅረብ።') }}
                </p>
                <div class="role-badge-tag">{{ i18n.translate('Full Access', 'ሙሉ አገልግሎት') }}</div>
              </div>
            </div>
          </div>

          <!-- Step 2: Personal & Account Information -->
          <div class="details-section">
            <label class="section-label">{{ i18n.translate('2. Personal & Account Information', '2. የግል እና የአካውንት መረጃ') }}</label>

            <div class="form-grid">
              <div class="form-group">
                <label for="reg_full_name" class="form-label">{{ i18n.translate('Full Name *', 'ሙሉ ስም *') }}</label>
                <input
                  type="text"
                  id="reg_full_name"
                  name="reg_full_name"
                  [(ngModel)]="fullName"
                  required
                  autocomplete="name"
                  placeholder="e.g. Almaz Tesfaye"
                  class="form-input clean-input"
                  [disabled]="loading"
                />
              </div>

              <div class="form-group">
                <label for="reg_clean_email" class="form-label">{{ i18n.translate('Email Address *', 'የኢሜይል አድራሻ *') }}</label>
                <input
                  type="email"
                  id="reg_clean_email"
                  name="reg_clean_email"
                  [(ngModel)]="email"
                  required
                  autocomplete="new-password"
                  spellcheck="false"
                  placeholder="e.g. almaz.tesfaye@example.et"
                  class="form-input clean-input"
                  [disabled]="loading"
                />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="reg_clean_pass" class="form-label">{{ i18n.translate('Password *', 'የይለፍ ቃል *') }}</label>
                <input
                  type="password"
                  id="reg_clean_pass"
                  name="reg_clean_pass"
                  [(ngModel)]="password"
                  required
                  autocomplete="new-password"
                  [placeholder]="i18n.translate('Minimum 6 characters', 'ቢያንስ 6 ፊደላት ወይም ቁጥሮች')"
                  class="form-input clean-input"
                  [disabled]="loading"
                />
              </div>

              <div class="form-group">
                <label for="reg_clean_confirm" class="form-label">{{ i18n.translate('Confirm Password *', 'የይለፍ ቃል ያረጋግጡ *') }}</label>
                <input
                  type="password"
                  id="reg_clean_confirm"
                  name="reg_clean_confirm"
                  [(ngModel)]="confirmPassword"
                  required
                  autocomplete="new-password"
                  [placeholder]="i18n.translate('Repeat your password', 'የይለፍ ቃልዎን በድጋሚ ያስገቡ')"
                  class="form-input clean-input"
                  [disabled]="loading"
                />
              </div>
            </div>

            <div class="form-grid">
              <!-- Location with Other Option -->
              <div class="form-group">
                <label for="location_select" class="form-label">{{ i18n.translate('Location (City / Region)', 'ክልል / ከተማ') }}</label>
                <select
                  id="location_select"
                  name="location_select"
                  [(ngModel)]="locationSelectValue"
                  (ngModelChange)="onLocationChange($event)"
                  class="form-input form-select"
                  [disabled]="loading">
                  <option [ngValue]="null">{{ i18n.translate('Select your location...', 'አካባቢዎን ይምረጡ...') }}</option>
                  <option *ngFor="let loc of locations" [ngValue]="loc.id">
                    {{ loc.name }} ({{ loc.region }})
                  </option>
                  <option value="OTHER">📍 {{ i18n.translate('Other (Custom Location / ልዩ ቦታ)...', 'ሌላ (ልዩ ከተማ ወይም ዞን ይጻፉ)...') }}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="headline" class="form-label">{{ i18n.translate('Professional Headline', 'የሙያ መጠሪያ') }}</label>
                <input
                  type="text"
                  id="headline"
                  name="headline"
                  [(ngModel)]="headline"
                  [placeholder]="selectedRole === 'SEEKER' ? i18n.translate('e.g. Hiring Manager at Addis Software', 'ለምሳሌ በአዲስ ሶፍትዌር ውስጥ የስራ አስኪያጅ') : i18n.translate('e.g. Senior Angular Developer & Electrician', 'ለምሳሌ ሲኒየር አንጉላር አልሚ ወይም የኤሌክትሪክ ባለሙያ')"
                  class="form-input clean-input"
                  [disabled]="loading"
                />
              </div>
            </div>

            <!-- Custom Location Input (Shown when 'Other' is selected) -->
            <div class="custom-location-box" *ngIf="isCustomLocation">
              <label for="custom_location_text" class="form-label">
                📍 {{ i18n.translate('Specify City / Sub-City / Town *', 'የከተማዎን / የክፍለ ከተማዎን ስም ይጥቀሱ *') }}
              </label>
              <input
                type="text"
                id="custom_location_text"
                name="custom_location_text"
                [(ngModel)]="customLocation"
                required
                [placeholder]="i18n.translate('e.g. Hawassa, Adama, Jimma, Bahir Dar, Kazanchis, Piassa, Bishoftu...', 'ለምሳሌ ሀዋሳ፣ አዳማ፣ ጅማ፣ ባህርዳር፣ ካዛንቺስ፣ ፒያሳ፣ ቢሾፍቱ...')"
                class="form-input custom-input"
                [disabled]="loading"
              />
              <span class="field-hint">
                {{ i18n.translate('This location will be saved to your profile and indexed for local matchmaking.', 'ይህ አካባቢ በመገለጫዎ ውስጥ ተቀምጦ ለአካባቢ ማዛመጃ አገልግሎት ይውላል።') }}
              </span>
            </div>

            <div class="form-group">
              <label for="bio" class="form-label">{{ i18n.translate('Bio / Profile Summary', 'አጭር የህይወት ታሪክ / መግለጫ') }}</label>
              <textarea
                id="bio"
                name="bio"
                [(ngModel)]="bio"
                rows="3"
                [placeholder]="i18n.translate('Brief description of your business or professional background...', 'ስለ ድርጅትዎ ወይም ስለ ሙያዊ ልምድዎ አጭር መግለጫ...')"
                class="form-input form-textarea"
                [disabled]="loading"
              ></textarea>
            </div>
          </div>

          <!-- Step 3: Provider-Specific Professional Credentials (only for Provider / Dual) -->
          <div *ngIf="selectedRole === 'PROVIDER' || selectedRole === 'DUAL'" class="provider-credentials-section">
            <div class="section-title-wrap">
              <label class="section-label">{{ i18n.translate('3. Professional Provider Profile & Credentials', '3. የባለሙያ መገለጫ እና ማረጋገጫዎች') }}</label>
              <span class="section-badge-help">{{ i18n.translate('Helps you stand out to clients and boosts AI matching', 'በአሰሪዎች ዘንድ ተመራጭ እንዲሆኑ እና የ AI ማዛመጃ እድልዎን ከፍ ያደርጋል') }}</span>
            </div>

            <!-- Profile Picture & Avatar Upload -->
            <div class="avatar-setup-card">
              <div class="avatar-preview-wrap">
                <div class="avatar-circle" [style.backgroundImage]="avatarUrl ? 'url(' + avatarUrl + ')' : 'none'">
                  <span *ngIf="!avatarUrl">{{ (fullName || 'P').charAt(0).toUpperCase() }}</span>
                </div>
                <div class="avatar-meta">
                  <h4>{{ i18n.translate('Profile Picture / Avatar', 'የመገለጫ ፎቶ / አምሳያ') }}</h4>
                  <p>{{ i18n.translate('Upload a clean professional headshot or enter a photo URL', 'ግልጽ የሆነ ፕሮፌሽናል ፎቶ ይጫኑ ወይም የፎቶ ሊንክ ያስገቡ') }}</p>
                </div>
              </div>

              <div class="avatar-inputs-row">
                <div class="form-group flex-1">
                  <label class="input-sublabel">{{ i18n.translate('Image URL', 'የፎቶ ሊንክ (URL)') }}</label>
                  <input
                    type="url"
                    [(ngModel)]="avatarUrl"
                    name="avatarUrl"
                    [placeholder]="i18n.translate('https://... or choose preset below', 'https://... ወይም ከታች ካሉት ይምረጡ')"
                    class="form-input clean-input"
                  />
                </div>
                <div class="form-group">
                  <label class="input-sublabel">{{ i18n.translate('Or Upload Local File', 'ወይም ፎቶ ይጫኑ') }}</label>
                  <label class="btn-file-upload">
                    📁 {{ i18n.translate('Select Image', 'ፎቶ ይምረጡ') }}
                    <input type="file" accept="image/*" (change)="onAvatarFileChange($event)" class="sr-only" />
                  </label>
                </div>
              </div>

              <div class="avatar-presets">
                <span class="preset-label">{{ i18n.translate('Quick Presets:', 'ፈጣን ምርጫዎች:') }}</span>
                <button type="button" class="preset-pill" (click)="setPresetAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200')">👩‍💻 Tech Lead</button>
                <button type="button" class="preset-pill" (click)="setPresetAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200')">👨‍💻 Backend Dev</button>
                <button type="button" class="preset-pill" (click)="setPresetAvatar('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200')">👩‍🎨 Designer</button>
                <button type="button" class="preset-pill" (click)="setPresetAvatar('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200')">⚡ Electrician</button>
                <button type="button" class="preset-pill" *ngIf="avatarUrl" (click)="avatarUrl = ''">✕ {{ i18n.translate('Clear', 'አጽዳ') }}</button>
              </div>
            </div>

            <!-- Contact & Online Presence -->
            <div class="form-grid">
              <div class="form-group">
                <label for="phoneNumber" class="form-label">
                  📞 {{ i18n.translate('Phone Number / Telegram Contact *', 'ስልክ ቁጥር / የቴሌግራም አድራሻ *') }}
                </label>
                <div class="input-with-prefix">
                  <span class="input-prefix">🇪🇹 +251</span>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    [(ngModel)]="phoneNumber"
                    placeholder="911 234567"
                    class="form-input clean-input with-prefix"
                  />
                </div>
                <span class="field-hint">{{ i18n.translate('Used for SMS booking alerts and Fayda ID verification.', 'ለ SMS ማሳወቂያዎች እና ለፋይዳ ማረጋገጫ ያገለግላል።') }}</span>
              </div>

              <div class="form-group">
                <label for="portfolioUrl" class="form-label">
                  🌐 {{ i18n.translate('Portfolio / GitHub / Work Link', 'የስራ ማሳያ / GitHub / የፖርትፎሊዮ ሊንክ') }}
                </label>
                <input
                  type="url"
                  id="portfolioUrl"
                  name="portfolioUrl"
                  [(ngModel)]="portfolioUrl"
                  placeholder="https://github.com/myname or https://myportfolio.et"
                  class="form-input clean-input"
                />
                <span class="field-hint">{{ i18n.translate('Showcase your past projects, GitHub code, or Behance samples.', 'ያከናወኗቸውን ፕሮጀክቶች፣ የጊትሀብ ኮድ ወይም ዲዛይኖችን ያጋሩ።') }}</span>
              </div>
            </div>

            <!-- Rates & Experience -->
            <div class="form-grid-3">
              <div class="form-group">
                <label for="yearsExperience" class="form-label">{{ i18n.translate('Years Experience', 'የስራ ልምድ (በዓመታት)') }}</label>
                <input
                  type="number"
                  id="yearsExperience"
                  name="yearsExperience"
                  [(ngModel)]="yearsExperience"
                  min="0"
                  max="50"
                  class="form-input clean-input"
                />
              </div>

              <div class="form-group">
                <label for="hourlyRate" class="form-label">{{ i18n.translate('Hourly Rate (ETB)', 'የሰዓት ክፍያ (በብር)') }}</label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  [(ngModel)]="hourlyRate"
                  min="50"
                  step="50"
                  placeholder="e.g. 600"
                  class="form-input clean-input"
                />
              </div>

              <div class="form-group">
                <label for="availability" class="form-label">{{ i18n.translate('Availability', 'የስራ ዝግጁነት') }}</label>
                <select id="availability" name="availability" [(ngModel)]="availability" class="form-input form-select">
                  <option value="FULL_TIME">{{ i18n.translate('Full Time (40h/wk)', 'ሙሉ ጊዜ (በሳምንት 40 ሰዓት)') }}</option>
                  <option value="PART_TIME">{{ i18n.translate('Part Time (20h/wk)', 'የትርፍ ጊዜ (በሳምንት 20 ሰዓት)') }}</option>
                  <option value="HOURLY">{{ i18n.translate('Hourly / Consulting', 'በሰዓት / ማማከር') }}</option>
                  <option value="ONE_OFF">{{ i18n.translate('One-off Gigs / Tasks', 'የአጭር ጊዜ ስራዎች') }}</option>
                </select>
              </div>
            </div>

            <!-- Education & Certifications -->
            <div class="form-group">
              <label for="education" class="form-label">
                🎓 {{ i18n.translate('Education & Certifications', 'የትምህርት ደረጃ እና ሰርተፊኬቶች') }}
              </label>
              <input
                type="text"
                id="education"
                name="education"
                [(ngModel)]="education"
                [placeholder]="i18n.translate('e.g. BSc in Software Engineering - AAU, TVET Level 4 Electrical Certified', 'ለምሳሌ የሶፍትዌር ምህንድስና ድግሪ - አአዩ፣ የደረጃ 4 የኤሌክትሪክ ሰርተፊኬት')"
                class="form-input clean-input"
              />
            </div>

            <!-- Languages Spoken -->
            <div class="form-group">
              <label class="form-label">
                🗣️ {{ i18n.translate('Languages Spoken', 'የሚናገሯቸው ቋንቋዎች') }}
              </label>
              <div class="language-chips-row">
                <button
                  type="button"
                  *ngFor="let lang of availableLanguages"
                  class="lang-chip"
                  [class.active]="isLanguageSelected(lang.code)"
                  (click)="toggleLanguage(lang.code)"
                >
                  <span class="check-mark" *ngIf="isLanguageSelected(lang.code)">✓</span>
                  {{ lang.name }}
                </button>
              </div>
            </div>

            <!-- Core Skills / Trades Selection -->
            <div class="skills-setup-section">
              <label class="form-label">
                ⭐ {{ i18n.translate('Select Your Core Competencies & Skills', 'ዋና ዋና ክህሎቶችዎን እና ሙያዎችዎን ይምረጡ') }}
              </label>
              <div class="skills-checkbox-grid">
                <label *ngFor="let s of availableSkills" class="skill-check-item" [class.checked]="isSkillSelected(s.id)">
                  <input
                    type="checkbox"
                    [checked]="isSkillSelected(s.id)"
                    (change)="toggleSkill(s.id)"
                    class="sr-only"
                  />
                  <span>{{ s.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg btn-complete"
            [disabled]="loading || !fullName || !email || !password || !confirmPassword"
          >
            <span *ngIf="!loading">{{ i18n.translate('Complete Registration & Enter Workspace', 'ምዝገባውን አጠናቀው ወደ ስራ ገበታ ይግቡ') }}</span>
            <span *ngIf="loading">{{ i18n.translate('Creating Your Professional Account...', 'አካውንትዎን በመፍጠር ላይ...') }}</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>{{ i18n.translate('Already have an account?', 'ቀደም ሲል አካውንት አለዎት?') }} <a routerLink="/login" class="link-cyan">{{ i18n.t('nav.login') }}</a></p>
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
    .register-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      max-width: 860px;
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
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--color-charcoal);
      margin-bottom: 0.5rem;
    }
    .auth-subtitle {
      font-size: 0.95rem;
      color: var(--color-slate);
    }
    .section-label {
      display: block;
      font-size: 0.925rem;
      font-weight: 800;
      color: var(--color-charcoal);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.5rem;
    }
    .section-title-wrap {
      margin-bottom: 1.25rem;
      padding-top: 1.5rem;
      border-top: 1px dashed var(--color-border);
    }
    .section-badge-help {
      display: block;
      font-size: 0.85rem;
      color: var(--color-slate);
      margin-top: 0.2rem;
    }
    .role-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .role-card {
      background: var(--color-surface-subtle);
      border: 2px solid var(--color-border);
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
      position: relative;
    }
    .role-card:hover {
      border-color: var(--color-taupe);
      transform: translateY(-2px);
    }
    .role-card.selected {
      background: #FFFFFF;
      border-color: var(--color-cyan);
      box-shadow: 0 0 0 3px var(--color-cyan-subtle);
    }
    .role-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .role-icon {
      font-size: 1.5rem;
    }
    .role-check {
      background: var(--color-cyan);
      color: #FFFFFF;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
    }
    .role-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-charcoal);
      margin-bottom: 0.4rem;
    }
    .role-desc {
      font-size: 0.825rem;
      color: var(--color-slate);
      line-height: 1.45;
      margin-bottom: 1rem;
      flex: 1;
    }
    .role-badge-tag {
      align-self: flex-start;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-cyan);
      background: var(--color-cyan-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .details-section, .provider-credentials-section {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.75rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1rem;
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 0.75rem;
    }
    .form-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-charcoal);
    }
    .input-sublabel {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--color-slate);
    }
    .field-hint {
      font-size: 0.775rem;
      color: var(--color-slate);
      line-height: 1.35;
    }
    .form-input {
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      background: #FFFFFF;
      color: var(--color-charcoal);
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--color-cyan);
      box-shadow: 0 0 0 3px var(--color-cyan-subtle);
    }
    /* Anti-autofill pale-blue reset */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
      -webkit-text-fill-color: var(--color-charcoal) !important;
      transition: background-color 5000s ease-in-out 0s;
    }
    .form-textarea {
      resize: vertical;
      min-height: 75px;
    }
    .form-select {
      cursor: pointer;
    }
    /* Custom Location Box */
    .custom-location-box {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-cyan);
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
      animation: fadeIn 0.2s ease;
    }
    .custom-input {
      background: #FFFFFF;
      margin: 0.35rem 0;
    }
    /* Avatar Setup Card */
    .avatar-setup-card {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .avatar-preview-wrap {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1rem;
    }
    .avatar-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-cyan), #0E7F8F);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 800;
      background-size: cover;
      background-position: center;
      border: 2px solid #FFFFFF;
      box-shadow: var(--shadow-sm);
      flex-shrink: 0;
    }
    .avatar-meta h4 {
      font-size: 0.95rem;
      margin-bottom: 0.15rem;
      color: var(--color-charcoal);
    }
    .avatar-meta p {
      font-size: 0.8rem;
      color: var(--color-slate);
      margin: 0;
    }
    .avatar-inputs-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .btn-file-upload {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.65rem 1rem;
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-charcoal);
      cursor: pointer;
      transition: all 0.2s ease;
      height: 38px;
    }
    .btn-file-upload:hover {
      border-color: var(--color-cyan);
      background: var(--color-cyan-subtle);
    }
    .avatar-presets {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
    .preset-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-slate);
    }
    .preset-pill {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-charcoal);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .preset-pill:hover {
      border-color: var(--color-cyan);
      background: var(--color-cyan-subtle);
    }
    /* Phone prefix */
    .input-with-prefix {
      display: flex;
      align-items: center;
    }
    .input-prefix {
      padding: 0.65rem 0.85rem;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-right: none;
      border-radius: var(--radius-sm) 0 0 var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-charcoal);
    }
    .with-prefix {
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      flex: 1;
    }
    /* Languages */
    .language-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .lang-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.8rem;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--color-slate);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .lang-chip:hover {
      border-color: var(--color-cyan);
    }
    .lang-chip.active {
      background: var(--color-cyan-subtle);
      border-color: var(--color-cyan);
      color: #0E7F8F;
      font-weight: 700;
    }
    .check-mark {
      font-weight: 900;
      font-size: 0.75rem;
    }
    /* Skills */
    .skills-setup-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px dashed var(--color-border);
    }
    .skills-checkbox-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .skill-check-item {
      padding: 0.35rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 20px;
      background: var(--color-surface-subtle);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-slate);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .skill-check-item:hover {
      border-color: var(--color-cyan);
    }
    .skill-check-item.checked {
      background: var(--color-cyan-subtle);
      border-color: var(--color-cyan);
      color: #0E7F8F;
      font-weight: 700;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
    .btn-block {
      width: 100%;
    }
    .btn-complete {
      padding: 0.85rem 1.5rem;
      font-size: 1rem;
      font-weight: 700;
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
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 768px) {
      .role-cards-grid, .form-grid, .form-grid-3 {
        grid-template-columns: 1fr;
      }
      .avatar-preview-wrap {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  selectedRole: 'SEEKER' | 'PROVIDER' | 'DUAL' = 'PROVIDER';
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  // Location handling
  locationSelectValue: number | 'OTHER' | null = null;
  customLocation = '';

  // Common Profile
  headline = '';
  bio = '';

  // Provider Specific Information
  phoneNumber = '';
  avatarUrl = '';
  portfolioUrl = '';
  yearsExperience: number | null = 3;
  hourlyRate: number | null = 600;
  availability = 'FULL_TIME';
  education = '';
  selectedLanguages: string[] = ['Amharic', 'English'];
  availableLanguages = [
    { code: 'Amharic', name: 'Amharic (አማርኛ)' },
    { code: 'English', name: 'English (እንግሊዝኛ)' },
    { code: 'Afaan Oromoo', name: 'Afaan Oromoo (ኦሮምኛ)' },
    { code: 'Tigrinya', name: 'Tigrinya (ትግርኛ)' },
    { code: 'Somali', name: 'Somali (ሶማሊኛ)' },
    { code: 'Sidama', name: 'Sidama (ሲዳምኛ)' }
  ];

  selectedSkillIds: number[] = [];
  locations: Location[] = [];
  availableSkills: Skill[] = [];

  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    public i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.apiService.getLocations().subscribe({
      next: (locs) => this.locations = locs,
      error: () => {}
    });

    this.apiService.getSkills().subscribe({
      next: (skills) => this.availableSkills = skills,
      error: () => {}
    });
  }

  get isCustomLocation(): boolean {
    return this.locationSelectValue === 'OTHER';
  }

  onLocationChange(value: any): void {
    if (value !== 'OTHER') {
      this.customLocation = '';
    }
  }

  isLanguageSelected(lang: string): boolean {
    return this.selectedLanguages.includes(lang);
  }

  toggleLanguage(lang: string): void {
    if (this.isLanguageSelected(lang)) {
      this.selectedLanguages = this.selectedLanguages.filter(l => l !== lang);
    } else {
      this.selectedLanguages.push(lang);
    }
  }

  setPresetAvatar(url: string): void {
    this.avatarUrl = url;
  }

  onAvatarFileChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  isSkillSelected(skillId: number): boolean {
    return this.selectedSkillIds.includes(skillId);
  }

  toggleSkill(skillId: number): void {
    if (this.isSkillSelected(skillId)) {
      this.selectedSkillIds = this.selectedSkillIds.filter(id => id !== skillId);
    } else {
      this.selectedSkillIds.push(skillId);
    }
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.fullName || !this.email || !this.password) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.isCustomLocation && !this.customLocation.trim()) {
      this.errorMessage = 'Please specify your custom location name.';
      return;
    }

    this.loading = true;

    const payload: RegisterPayload = {
      email: this.email.trim(),
      password: this.password,
      fullName: this.fullName.trim(),
      role: this.selectedRole,
      headline: this.headline.trim() || undefined,
      bio: this.bio.trim() || undefined,
      initialSkillIds: this.selectedSkillIds.length > 0 ? this.selectedSkillIds : undefined
    };

    if (this.isCustomLocation && this.customLocation.trim()) {
      payload.customLocation = this.customLocation.trim();
    } else if (typeof this.locationSelectValue === 'number') {
      payload.locationId = this.locationSelectValue;
    }

    if (this.selectedRole === 'PROVIDER' || this.selectedRole === 'DUAL') {
      if (this.phoneNumber.trim()) {
        payload.phoneNumber = this.phoneNumber.startsWith('+251') ? this.phoneNumber.trim() : `+251${this.phoneNumber.trim().replace(/^0+/, '')}`;
      }
      if (this.avatarUrl.trim()) payload.avatarUrl = this.avatarUrl.trim();
      if (this.portfolioUrl.trim()) payload.portfolioUrl = this.portfolioUrl.trim();
      if (this.yearsExperience !== null && this.yearsExperience !== undefined) payload.yearsExperience = Number(this.yearsExperience);
      if (this.hourlyRate !== null && this.hourlyRate !== undefined) payload.hourlyRate = Number(this.hourlyRate);
      if (this.availability) payload.availability = this.availability;
      if (this.education.trim()) payload.education = this.education.trim();
      if (this.selectedLanguages.length > 0) payload.languages = this.selectedLanguages.join(', ');
    }

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true', email: this.email }
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Registration failed. Email may already be in use.';
      }
    });
  }
}
