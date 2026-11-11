import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                  <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                    <strong>{{ s.skillName || 'Skill #' + s.skillId }}</strong>
                    <span *ngIf="s.isVerified" class="badge-skill-verified">
                      🏅 {{ i18n.translate('Verified Expert', 'የተረጋገጠ ባለሙያ') }} ({{ s.assessmentScore }}%)
                    </span>
                    <button
                      *ngIf="!s.isVerified"
                      type="button"
                      [disabled]="loadingQuizSkillId === s.skillId"
                      (click)="startAssessmentForSkill(s)"
                      class="btn-take-quiz">
                      {{ loadingQuizSkillId === s.skillId ? '⏳ Preparing Questions...' : ('🎯 ' + i18n.translate('Take Assessment Quiz', 'የብቃት ፈተና ውሰድ')) }}
                    </button>
                  </div>
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
              <div class="package-pill" [class.selected]="selectedConnectsAmount === 20" (click)="selectedConnectsAmount = 20">
                <div class="pkg-num">20 Connects</div>
                <div class="pkg-price">90 ETB</div>
                <span class="pkg-badge">POPULAR</span>
              </div>
              <div class="package-pill" [class.selected]="selectedConnectsAmount === 50" (click)="selectedConnectsAmount = 50">
                <div class="pkg-num">50 Connects</div>
                <div class="pkg-price">180 ETB</div>
                <span class="pkg-badge">BEST VALUE</span>
              </div>
              <div class="package-pill" [class.selected]="selectedConnectsAmount === 100" (click)="selectedConnectsAmount = 100">
                <div class="pkg-num">100 Connects</div>
                <div class="pkg-price">320 ETB</div>
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

      <!-- Professional Pro Subscription Checkout Modal -->
      <div *ngIf="showProModal" class="modal-backdrop">
        <div class="modal-content" style="max-width: 500px;">
          <div class="flex justify-between items-center" style="margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.5rem;">⭐</span>
              <h2 style="margin: 0; font-size: 1.25rem;">{{ i18n.translate('Upgrade to EthioBridge Pro', 'ወደ ኢትዮብሪጅ ፕሮ ያሳድጉ') }}</h2>
            </div>
            <button (click)="showProModal = false" class="btn-close">✕</button>
          </div>

          <div *ngIf="proError" class="alert-danger" style="margin-bottom: 1rem;">
            {{ proError }}
          </div>

          <div class="pro-modal-perks" style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
            <div style="font-weight: 700; color: #92400E; margin-bottom: 0.5rem; font-size: 0.875rem;">
              {{ i18n.translate('Included Pro Perks for 30 Days:', 'የ 30 ቀናት የፕሮ ጥቅሞች:') }}
            </div>
            <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: #78350F; display: flex; flex-direction: column; gap: 0.35rem;">
              <li>⭐ {{ i18n.translate('Verified Pro Talent Badge on profile & proposals', 'የተረጋገጠ የፕሮ ባለሙያ ባጅ በመገለጫዎና በማመልከቻዎ ላይ') }}</li>
              <li>🎯 {{ i18n.translate('50% Discount on proposal tokens (1 Connect/app)', '50% ቅናሽ በማመልከቻ ነጥቦች (1 ነጥብ በስራ)') }}</li>
              <li>🪙 {{ i18n.translate('+30 Bonus Connects added to your account instantly', '+30 ነፃ የማመልከቻ ነጥቦች ወዲያውኑ ይጨመራሉ') }}</li>
              <li>📈 {{ i18n.translate('Priority ranking in AI Candidate recommendations', 'በ AI እጩዎች ዝርዝር ውስጥ ቀዳሚነት') }}</li>
            </ul>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label">{{ i18n.translate('Select Payment Method', 'የመክፈያ ዘዴ ይምረጡ') }}</label>
            <div style="display: flex; gap: 0.75rem;">
              <label class="package-pill" style="flex: 1;" [class.selected]="proPaymentMethod === 'TELEBIRR'" (click)="proPaymentMethod = 'TELEBIRR'">
                <div class="pkg-num">Telebirr</div>
                <div class="pkg-price">299 ETB / mo</div>
              </label>
              <label class="package-pill" style="flex: 1;" [class.selected]="proPaymentMethod === 'CBE_BIRR'" (click)="proPaymentMethod = 'CBE_BIRR'">
                <div class="pkg-num">CBE Birr</div>
                <div class="pkg-price">299 ETB / mo</div>
              </label>
              <label class="package-pill" style="flex: 1;" [class.selected]="proPaymentMethod === 'CHAPA'" (click)="proPaymentMethod = 'CHAPA'">
                <div class="pkg-num">Chapa / Card</div>
                <div class="pkg-price">299 ETB / mo</div>
              </label>
            </div>
          </div>

          <div class="flex justify-between items-center" style="margin-top: 1.5rem;">
            <button (click)="showProModal = false" class="btn btn-secondary">{{ i18n.translate('Cancel', 'ይቅር') }}</button>
            <button (click)="confirmProUpgrade()" [disabled]="submittingPro" class="btn btn-primary" style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); border: none;">
              {{ submittingPro ? i18n.translate('Activating...', 'በማስኬድ ላይ...') : i18n.translate('Pay 299 ETB & Activate Pro', '299 ብር ከፍለው ያግብሩ') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Skill Assessment Quiz Modal -->
      <div *ngIf="showQuizModal" class="modal-backdrop">
        <div class="quiz-modal-card">
          <div class="modal-header">
            <div>
              <span class="badge-tech">{{ activeQuiz?.category }}</span>
              <h3 style="margin-top: 0.25rem; font-weight: 800;">🎯 {{ activeQuiz?.title }}</h3>
            </div>
            <button type="button" class="btn-close" (click)="closeQuizModal()">✕</button>
          </div>

          <!-- Disqualified View -->
          <div *ngIf="quizDisqualified" class="modal-body result-body" style="text-align: center; padding: 2rem 1.5rem;">
            <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">🚫</div>
            <h3 style="color: #DC2626; font-weight: 800; font-size: 1.35rem; margin-bottom: 0.5rem;">
              {{ i18n.translate('Assessment Disqualified', 'ፈተናው ተሰርዟል') }}
            </h3>
            <p style="color: #64748B; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem;">
              {{ i18n.translate('EthioBridge anti-cheat protocol detected multiple window defocus or tab switches. To ensure integrity and protect platform clients, verified badges require an uninterrupted test session.', 'የታማኝነት ቁጥጥር ሥርዓት መስኮት መቀየርን ወይም ከገጹ መውጣትን አግኝቷል። ባጆች ትክክለኛ እንዲሆኑና ደንበኞችን ለመጠበቅ ፈተናውን ሳይቋረጥ ማጠናቀቅ ግዴታ ነው።') }}
            </p>
            <button type="button" class="btn btn-secondary w-full" (click)="closeQuizModal()">
              {{ i18n.translate('Close Assessment', 'ዝጋ') }}
            </button>
          </div>

          <!-- In-Progress Quiz View -->
          <div *ngIf="!quizResult && !quizDisqualified && activeQuiz" class="modal-body">
            <!-- Anti-Cheat Status & Countdown Bar -->
            <div class="anti-cheat-status-bar">
              <div class="shield-badge">
                <span class="shield-icon">🛡️</span>
                <span>{{ i18n.translate('Anti-Cheat Active: Copy & Tab Lock', 'የታማኝነት ቁጥጥር: መስኮት መቀየር የተከለከለ') }}</span>
              </div>
              <div class="timer-badge" [class.timer-urgent]="questionTimeRemaining <= 10">
                ⏱️ {{ questionTimeRemaining }}s
              </div>
            </div>

            <div *ngIf="tabSwitchWarnings > 0" class="anti-cheat-warning-alert">
              ⚠️ <strong>{{ i18n.translate('Integrity Alert:', 'ማስጠንቀቂያ:') }}</strong>
              {{ i18n.translate('Tab switch or defocus detected (' + tabSwitchWarnings + '/2). Leaving this tab again will automatically disqualify your assessment!', 'የመስኮት መቀየር ታይቷል! ይህን ገጽ እንደገና ለቀው ከወጡ ፈተናው ወዲያው ይሰረዛል!') }}
            </div>

            <div class="quiz-meta-bar">
              <span>⏱️ {{ i18n.translate('Passing Score: ' + activeQuiz.passingScore + '%', 'ማለፊያ ነጥብ: ' + activeQuiz.passingScore + '%') }}</span>
              <span>Question {{ currentQuestionIndex + 1 }} of {{ activeQuiz.questions?.length }}</span>
            </div>

            <div class="quiz-progress-track">
              <div class="quiz-progress-fill" [style.width.%]="((currentQuestionIndex + 1) / (activeQuiz.questions?.length || 1)) * 100"></div>
            </div>

            <div class="question-box protected-content"
                 *ngIf="activeQuiz.questions?.[currentQuestionIndex] as curQ"
                 (copy)="$event.preventDefault()"
                 (cut)="$event.preventDefault()"
                 (contextmenu)="$event.preventDefault()">
              <h4 class="question-text">{{ curQ.question }}</h4>
              <div class="options-group">
                <label *ngFor="let opt of curQ.options; let optIdx = index"
                       class="option-card"
                       [class.selected]="selectedAnswers[curQ.id] === optIdx">
                  <input type="radio"
                         [name]="'q_' + curQ.id"
                         [value]="optIdx"
                         (change)="selectQuizAnswer(curQ.id, optIdx)"
                         [checked]="selectedAnswers[curQ.id] === optIdx" />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>
          </div>

          <div *ngIf="!quizResult && !quizDisqualified && activeQuiz" class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" *ngIf="currentQuestionIndex > 0" (click)="goToPrevQuestion()">
              ← {{ i18n.translate('Previous', 'ወደ ኋላ') }}
            </button>
            <button type="button" class="btn btn-outline btn-sm" (click)="closeQuizModal()">
              {{ i18n.translate('Cancel', 'ይቅር') }}
            </button>
            <button type="button"
                    *ngIf="currentQuestionIndex < ((activeQuiz.questions?.length || 0) - 1)"
                    class="btn btn-primary btn-sm"
                    [disabled]="selectedAnswers[activeQuiz.questions[currentQuestionIndex].id] === undefined"
                    (click)="goToNextQuestion()">
              {{ i18n.translate('Next Question', 'ቀጣይ ጥያቄ') }} →
            </button>
            <button type="button"
                    *ngIf="currentQuestionIndex === ((activeQuiz.questions?.length || 0) - 1)"
                    class="btn btn-primary btn-sm"
                    [disabled]="submittingQuiz || selectedAnswers[activeQuiz.questions[currentQuestionIndex].id] === undefined"
                    (click)="submitQuizAnswers()">
              {{ submittingQuiz ? i18n.translate('Scoring...', 'ውጤት በማስላት ላይ...') : i18n.translate('Submit Assessment', 'ፈተናውን ጨርስ') }}
            </button>
          </div>

          <!-- Quiz Result View -->
          <div *ngIf="quizResult" class="modal-body result-body" style="text-align: center; padding: 1.5rem 1rem;">
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">{{ quizResult.passed ? '🎉' : '📚' }}</div>
            <h3 [style.color]="quizResult.passed ? '#059669' : '#DC2626'" style="font-weight: 800; font-size: 1.35rem;">
              {{ quizResult.passed ? i18n.translate('Assessment Passed!', 'እንኳን ደስ አለዎት! ፈተናውን አልፈዋል!') : i18n.translate('Assessment Incomplete', 'እንደገና ይሞክሩ') }}
            </h3>
            <div style="margin: 1rem 0;">
              <span style="font-size: 2.25rem; font-weight: 800; color: #1E293B;">{{ quizResult.score }}%</span>
              <div style="color: #64748B; font-size: 0.85rem; margin-top: 0.25rem;">
                {{ quizResult.correctCount }} / {{ quizResult.totalQuestions }} {{ i18n.translate('correct answers', 'ትክክለኛ መልሶች') }}
              </div>
            </div>

            <p *ngIf="quizResult.passed" style="color: #065F46; font-size: 0.9rem; line-height: 1.5; background: #ECFDF5; padding: 0.75rem; border-radius: 8px;">
              🏅 <strong>{{ i18n.translate('Badge Earned: Verified Skill Pro', 'የተረጋገጠ የባለሙያ ባጅ ተሸልመዋል') }}</strong>.<br>
              {{ i18n.translate('Your profile now showcases a certified skill badge to potential employers.', 'መገለጫዎ አሁን ለቀጣሪዎች የተረጋገጠ የክህሎት ባጅ ያሳያል።') }}
            </p>
            <p *ngIf="!quizResult.passed" style="color: #991B1B; font-size: 0.9rem; line-height: 1.5; background: #FEF2F2; padding: 0.75rem; border-radius: 8px;">
              {{ i18n.translate('Passing score is ' + quizResult.passingScore + '%. Review the concepts and retake the test at any time.', 'ማለፊያ ነጥብ ' + quizResult.passingScore + '% ነው። ጽንሰ-ሀሳቦቹን እንደገና ከልሰው በማንኛውም ጊዜ መፈተን ይችላሉ።') }}
            </p>

            <div style="margin-top: 1.5rem;">
              <button type="button" class="btn btn-primary w-full" (click)="closeQuizModal()">
                {{ i18n.translate('Done', 'ተጠናቋል') }}
              </button>
            </div>
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
    .badge-skill-verified {
      background: #DCFCE7;
      color: #15803D;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .btn-take-quiz {
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px dashed #93C5FD;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-take-quiz:hover {
      background: #DBEAFE;
      border-color: #3B82F6;
    }
    .quiz-modal-card {
      background: #FFFFFF;
      border-radius: 14px;
      width: 100%;
      max-width: 580px;
      padding: 1.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .badge-tech {
      background: #E0F2FE;
      color: #0369A1;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .quiz-meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748B;
      margin-bottom: 0.5rem;
    }
    .quiz-progress-track {
      height: 6px;
      background: #E2E8F0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 1.25rem;
    }
    .quiz-progress-fill {
      height: 100%;
      background: var(--color-cyan, #06B6D4);
      transition: width 0.3s ease;
    }
    .question-box {
      margin-bottom: 1rem;
    }
    .question-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #1E293B;
      margin: 0 0 1rem 0;
      line-height: 1.4;
    }
    .options-group {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .option-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border: 1.5px solid #E2E8F0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #334155;
      line-height: 1.35;
      transition: all 0.2s ease;
    }
    .option-card:hover {
      border-color: #94A3B8;
      background: #F8FAFC;
    }
    .option-card.selected {
      border-color: #0284C7;
      background: #F0F9FF;
      color: #0369A1;
      font-weight: 600;
    }
    .option-card input[type="radio"] {
      margin-top: 0.2rem;
    }
    .protected-content {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    .anti-cheat-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }
    .shield-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #334155;
    }
    .timer-badge {
      background: #E2E8F0;
      color: #0F172A;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      font-variant-numeric: tabular-nums;
      transition: all 0.2s ease;
    }
    .timer-badge.timer-urgent {
      background: #FEE2E2;
      color: #DC2626;
      animation: timerPulse 0.9s infinite alternate;
    }
    @keyframes timerPulse {
      from { transform: scale(1); }
      to { transform: scale(1.08); }
    }
    .anti-cheat-warning-alert {
      background: #FFFBEB;
      border: 1px solid #FCD34D;
      color: #92400E;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.785rem;
      line-height: 1.4;
      margin-bottom: 0.75rem;
    }
    @media (max-width: 900px) {
      .profile-layout, .grid-cols-2, .grid-cols-3 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProviderProfileComponent implements OnInit, OnDestroy {
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

  // Pro Subscription Modal State
  showProModal = false;
  proPaymentMethod = 'TELEBIRR';
  submittingPro = false;
  proError = '';

  get selectedConnectsPackage(): number {
    return this.selectedConnectsAmount;
  }
  set selectedConnectsPackage(val: number) {
    this.selectedConnectsAmount = val;
  }

  getPackagePrice(amount: number): number {
    if (amount <= 10) return 50;
    if (amount <= 20) return 90;
    if (amount <= 25) return 100;
    if (amount <= 50) return 180;
    if (amount <= 60) return 200;
    return 320;
  }

  // Skill Assessment Quiz & Anti-Cheat Properties
  loadingQuizSkillId: number | null = null;
  showQuizModal = false;
  activeQuiz: any = null;
  currentQuestionIndex = 0;
  selectedAnswers: { [key: number]: number } = {};
  submittingQuiz = false;
  quizResult: any = null;
  availableAssessments: any[] = [];

  // Anti-Cheat: Timer & Tab Focus Tracking
  questionTimeRemaining = 45;
  timerInterval: any = null;
  tabSwitchWarnings = 0;
  quizDisqualified = false;

  @HostListener('window:blur')
  onWindowBlur(): void {
    this.handleTabSwitchViolation();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      this.handleTabSwitchViolation();
    }
  }

  handleTabSwitchViolation(): void {
    if (!this.showQuizModal || !this.activeQuiz || this.quizResult || this.quizDisqualified) {
      return;
    }
    this.tabSwitchWarnings++;
    if (this.tabSwitchWarnings === 1) {
      this.toastService.warning(
        '⚠️ Anti-Cheat Warning: Tab switch / window defocus detected! Leaving the assessment tab again will automatically disqualify your test.',
        'Integrity Monitor'
      );
    } else if (this.tabSwitchWarnings >= 2) {
      this.quizDisqualified = true;
      this.stopQuestionTimer();
      this.toastService.error(
        '🚫 Assessment Disqualified: You left the quiz window multiple times. Assessment terminated for integrity reasons.',
        'Academic Integrity'
      );
    }
  }

  startQuestionTimer(): void {
    this.stopQuestionTimer();
    this.questionTimeRemaining = 45;
    this.timerInterval = setInterval(() => {
      if (this.questionTimeRemaining > 0) {
        this.questionTimeRemaining--;
      } else {
        this.onQuestionTimeout();
      }
    }, 1000);
  }

  stopQuestionTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  onQuestionTimeout(): void {
    this.stopQuestionTimer();
    if (this.currentQuestionIndex < ((this.activeQuiz?.questions?.length || 0) - 1)) {
      this.toastService.info('⏳ Time expired for question. Advancing to next...', 'Timer');
      this.goToNextQuestion();
    } else {
      this.toastService.info('⏳ Time expired for final question. Submitting assessment...', 'Timer');
      this.submitQuizAnswers();
    }
  }

  goToNextQuestion(): void {
    if (this.currentQuestionIndex < ((this.activeQuiz?.questions?.length || 0) - 1)) {
      this.currentQuestionIndex++;
      this.startQuestionTimer();
    }
  }

  goToPrevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.startQuestionTimer();
    }
  }

  ngOnDestroy(): void {
    this.stopQuestionTimer();
  }

  constructor(
    private apiService: ApiService,
    public i18n: I18nService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
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
              if (res.newBalance !== undefined) {
                if (this.profile) {
                  this.profile.connectsBalance = res.newBalance;
                }
              }
              const addedMsg = res.connectsAdded ? `Added ${res.connectsAdded} Connects.` : '';
              const balanceMsg = res.newBalance !== undefined ? `Current balance: ${res.newBalance} Connects.` : '';
              this.toastService.success(
                `🎉 Chapa payment successful! ${addedMsg} ${balanceMsg}`,
                'Connects Credited'
              );
              this.loadProfile();
              this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
            } else {
              this.toastService.error('Chapa payment was not completed or failed. No connects were added.', 'Payment Incomplete');
            }
          },
          error: () => {
            this.toastService.error('Failed to verify Chapa payment.', 'Verification Error');
          }
        });
      }

      if (params['chapa_pro'] && params['tx_ref']) {
        const txRef = params['tx_ref'];
        this.toastService.info('Verifying Chapa Pro membership payment...', 'Chapa Gateway');
        this.apiService.verifyConnectsTopup(txRef).subscribe({
          next: (res) => {
            if (res && res.status === 'SUCCESS') {
              if (res.newBalance !== undefined && this.profile) {
                this.profile.connectsBalance = res.newBalance;
              }
              if (this.profile) {
                this.profile.isPro = true;
                if (res.proExpiresAt) {
                  this.profile.proExpiresAt = res.proExpiresAt;
                }
              }
              this.toastService.success(
                '🎉 Welcome to EthioBridge Pro! Verified badge activated and +30 bonus Connects granted.',
                'Pro Membership Activated'
              );
              this.loadProfile();
              this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
            } else {
              this.toastService.error('Chapa Pro payment was not completed or failed.', 'Payment Incomplete');
            }
          },
          error: () => {
            this.toastService.error('Failed to verify Chapa Pro payment.', 'Verification Error');
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
    this.showProModal = true;
    this.proError = '';
    this.submittingPro = false;
  }

  confirmProUpgrade(): void {
    const method = this.proPaymentMethod || 'TELEBIRR';
    this.submittingPro = true;
    this.proError = '';

    if (method === 'CHAPA') {
      this.apiService.subscribeToPro('CHAPA').subscribe({
        next: (res: any) => {
          this.submittingPro = false;
          const targetUrl = res.checkoutUrl || res.checkout_url;
          if (targetUrl) {
            this.toastService.info('Redirecting to Chapa payment portal...', 'Chapa Gateway');
            window.location.href = targetUrl;
          } else {
            this.proError = 'Could not generate Chapa checkout URL. Please try again.';
          }
        },
        error: (err: any) => {
          this.submittingPro = false;
          this.proError = err.error?.message || 'Pro subscription initiation failed. Please try again.';
        }
      });
      return;
    }

    this.apiService.subscribeToPro(method).subscribe({
      next: (res) => {
        this.submittingPro = false;
        this.showProModal = false;
        if (this.profile) {
          this.profile.isPro = true;
          this.profile.proExpiresAt = res.proExpiresAt;
          this.profile.connectsBalance = res.newConnectsBalance;
        }
        this.toastService.success(`Welcome to EthioBridge Pro! Activated via ${method} (Ref: ${res.referenceId}).`, 'Pro Membership Activated');
      },
      error: (err) => {
        this.submittingPro = false;
        this.proError = err.error?.message || 'Pro subscription upgrade failed. Please try again.';
      }
    });
  }

  startAssessmentForSkill(skill: any): void {
    const skillId = skill.skillId;
    if (!skillId) {
      this.toastService.error('Skill ID is missing. Please save your profile first.');
      return;
    }
    this.loadingQuizSkillId = skillId;
    this.apiService.getAssessmentBySkillId(skillId).subscribe({
      next: (quiz) => {
        this.loadingQuizSkillId = null;
        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
          this.toastService.warning(`Generating assessment questions for ${skill.skillName || 'this skill'}... Please try again in a moment.`);
          return;
        }
        this.activeQuiz = quiz;
        this.currentQuestionIndex = 0;
        this.selectedAnswers = {};
        this.quizResult = null;
        this.tabSwitchWarnings = 0;
        this.quizDisqualified = false;
        this.showQuizModal = true;
        this.startQuestionTimer();
      },
      error: () => {
        this.loadingQuizSkillId = null;
        this.toastService.error(`Failed to load assessment for ${skill.skillName || 'this skill'}. Please try again.`);
      }
    });
  }

  openQuiz(assessmentId: string): void {
    this.apiService.getAssessmentForTaking(assessmentId).subscribe({
      next: (quiz) => {
        this.activeQuiz = quiz;
        this.currentQuestionIndex = 0;
        this.selectedAnswers = {};
        this.quizResult = null;
        this.tabSwitchWarnings = 0;
        this.quizDisqualified = false;
        this.showQuizModal = true;
        this.startQuestionTimer();
      },
      error: () => {
        this.toastService.error('Could not load quiz questions.');
      }
    });
  }

  selectQuizAnswer(questionId: number, optionIndex: number): void {
    this.selectedAnswers[questionId] = optionIndex;
  }

  submitQuizAnswers(): void {
    if (!this.activeQuiz || this.submittingQuiz) return;
    this.stopQuestionTimer();
    this.submittingQuiz = true;

    this.apiService.submitAssessment(this.activeQuiz.id, this.selectedAnswers).subscribe({
      next: (res) => {
        this.submittingQuiz = false;
        this.quizResult = res;
        if (res.passed) {
          this.toastService.success(`🎉 Passed with ${res.score}%! Verified Skill Badge awarded.`, 'Assessment Passed');
          this.loadProfile();
        } else {
          this.toastService.warning(`Scored ${res.score}%. Need ${res.passingScore}% to pass.`, 'Keep Practicing');
        }
      },
      error: () => {
        this.submittingQuiz = false;
        this.toastService.error('Failed to submit assessment.');
      }
    });
  }

  closeQuizModal(): void {
    this.stopQuestionTimer();
    this.showQuizModal = false;
    this.activeQuiz = null;
    this.quizResult = null;
    this.selectedAnswers = {};
    this.currentQuestionIndex = 0;
    this.tabSwitchWarnings = 0;
    this.quizDisqualified = false;
  }
}
