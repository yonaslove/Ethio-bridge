import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container verification-page">
      <div class="verif-card">
        <div class="verif-header">
          <div class="shield-badge">🛡️</div>
          <h2>{{ i18n.t('verification.modalTitle') }}</h2>
          <p class="subtitle">{{ i18n.translate('Complete Ethiopian National ID (Fayda / Kebele / Driver\'s License) two-sided verification to display a verified trust badge and unlock platform escrow.', 'የተረጋገጠ የደህንነት ባጅ ለማግኘት እና አስተማማኝ ስራዎችን ለመስራት የኢትዮጵያ ብሔራዊ መታወቂያ (ፋይዳ / ቀበሌ / መንጃ ፈቃድ) የፊት እና የጀርባ ገጽ ማረጋገጫ ያጠናቅቁ።') }}</p>
        </div>

        <!-- Current Status Banner -->
        <div *ngIf="verifStatus" class="status-banner" [ngClass]="'banner-' + verifStatus.status.toLowerCase()">
          <div class="status-indicator">
            <span *ngIf="verifStatus.status === 'VERIFIED'" class="status-icon">✓</span>
            <span *ngIf="verifStatus.status === 'PENDING'" class="status-icon">⏳</span>
            <span *ngIf="verifStatus.status === 'REJECTED'" class="status-icon">✕</span>
            <strong>{{ i18n.translate('Status:', 'ሁኔታ:') }} {{ verifStatus.status }}</strong>
          </div>
          <p *ngIf="verifStatus.status === 'VERIFIED'">{{ i18n.translate('Your identity has been authenticated against national civil registry databases. Verified Badge is active on your profile and applications.', 'ማንነትዎ በብሔራዊ የመረጃ ቋት ተረጋግጧል። የተረጋገጠ ባጅ በመገለጫዎ እና በማመልከቻዎችዎ ላይ ነቅቷል።') }}</p>
          <p *ngIf="verifStatus.status === 'PENDING'">{{ i18n.translate('Your front and back ID documents have been submitted to the EthioBridge compliance desk. AI pre-screening and admin verification turnaround is typically under 4 business hours.', 'የመታወቂያዎ የፊት እና የጀርባ ሰነዶች ለኢትዮብሪጅ ተቆጣጣሪ ክፍል ቀርበዋል። የሰው ሰራሽ አስተውሎት ቅድመ-ምርመራ እና የፍቃድ ማረጋገጫው በ4 የስራ ሰዓታት ውስጥ ይጠናቀቃል።') }}</p>
          <p *ngIf="verifStatus.status === 'REJECTED'">{{ i18n.translate('Rejection reason:', 'ውድቅ የተደረገበት ምክንያት:') }} {{ verifStatus.rejectionReason || i18n.translate('Document mismatch. Please re-submit.', 'የሰነድ አለመጣጣም። እባክዎ እንደገና ያስገቡ።') }}</p>

          <!-- AI Integrity Assessment Preview (if generated) -->
          <div *ngIf="verifStatus.aiScore !== undefined && verifStatus.aiScore !== null" class="ai-assessment-box">
            <div class="ai-badge-row">
              <span class="ai-badge">✦ AI Integrity Score: {{ verifStatus.aiScore }}%</span>
              <span class="ai-verdict-tag" [ngClass]="getAiVerdictClass(verifStatus.aiVerdict)">
                {{ verifStatus.aiVerdict || 'ANALYZED' }}
              </span>
            </div>
            <p class="ai-summary" *ngIf="verifStatus.aiAnalysis">{{ verifStatus.aiAnalysis }}</p>
          </div>

          <!-- Attached Document Thumbnails (Front and Back) -->
          <div *ngIf="verifStatus.documentUrl || verifStatus.documentBackUrl" class="attached-doc-preview">
            <span class="doc-label">{{ i18n.translate('Submitted ID Documents (Two-Sided):', 'የተያያዙ የመታወቂያ ሰነዶች (ሁለቱም ገጾች):') }}</span>
            <div class="docs-gallery">
              <div *ngIf="verifStatus.documentUrl" class="doc-thumb-wrapper">
                <span class="doc-side-label">Front (ፊት ለፊት)</span>
                <img [src]="verifStatus.documentUrl" alt="Front ID" class="doc-thumb" (click)="openDocModal(verifStatus.documentUrl, 'ID Front Page')" />
                <button type="button" class="btn btn-outline btn-xs" (click)="openDocModal(verifStatus.documentUrl, 'ID Front Page')">🔍 View Front</button>
              </div>
              <div *ngIf="verifStatus.documentBackUrl" class="doc-thumb-wrapper">
                <span class="doc-side-label">Back (የጀርባ ገጽ)</span>
                <img [src]="verifStatus.documentBackUrl" alt="Back ID" class="doc-thumb" (click)="openDocModal(verifStatus.documentBackUrl, 'ID Back Page')" />
                <button type="button" class="btn btn-outline btn-xs" (click)="openDocModal(verifStatus.documentBackUrl, 'ID Back Page')">🔍 View Back</button>
              </div>
            </div>
          </div>

          <!-- Resubmit Button for Rejected -->
          <div *ngIf="verifStatus.status === 'REJECTED'" style="margin-top: 1rem;">
            <button type="button" class="btn btn-secondary btn-sm" (click)="verifStatus = null">
              ↻ {{ i18n.translate('Submit New Verification', 'አዲስ ማረጋገጫ ያስገቡ') }}
            </button>
          </div>
        </div>

        <!-- Submission Form -->
        <form *ngIf="!verifStatus || verifStatus.status === 'REJECTED'" (ngSubmit)="onSubmit()" class="verif-form">
          <div class="form-group">
            <label class="form-label">{{ i18n.translate('Identity Document Type', 'የመታወቂያ ሰነድ አይነት') }}</label>
            <select [(ngModel)]="idType" name="idType" class="form-control">
              <option value="FAYDA_NATIONAL_ID">{{ i18n.t('verification.faydaId') }} (ዲጂታል ፋይዳ መታወቂያ)</option>
              <option value="KEBELE_ID">{{ i18n.t('verification.kebeleId') }} (ከተማ አስተዳደር የቀበሌ መታወቂያ)</option>
              <option value="PASSPORT">{{ i18n.t('verification.passport') }} (የኢትዮጵያ ፓስፖርት)</option>
              <option value="DRIVERS_LICENSE">{{ i18n.translate("Driver's License", 'መንጃ ፈቃድ') }}</option>
              <option value="BUSINESS_LICENSE">{{ i18n.translate('Business / Trade License', 'የንግድ ምዝገባና ፈቃድ') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ i18n.translate('ID / Document Number', 'የመታወቂያ ቁጥር') }}</label>
            <input type="text"
                   [(ngModel)]="idNumber"
                   name="idNumber"
                   class="form-control"
                   placeholder="e.g. FAN-8491-0294-ET, AA-03-94812, or EP0938412"
                   required />
            <small class="hint">{{ i18n.translate('Fayda format: FAN-XXXX-XXXX-ET; Passport: EP followed by 7 digits; Kebele: Regional code and sequence.', 'የፋይዳ ቅርጸት፡ FAN-XXXX-XXXX-ET፤ ፓስፖርት፡ EP እና 7 አሃዞች፤ የቀበሌ፡ የከተማ ኮድ እና ቁጥር።') }}</small>
          </div>

          <!-- Full Legal Name as printed on ID Document with Real-time Similarity Check -->
          <div class="form-group">
            <label class="form-label">
              {{ i18n.translate('Full Legal Name on ID Document (የመታወቂያው ሙሉ ስም)', 'በመታወቂያው ላይ የተጻፈው ሙሉ ስም') }}
              <span class="required-star">*</span>
            </label>
            <input type="text"
                   [(ngModel)]="idFullName"
                   name="idFullName"
                   (input)="checkNameSimilarity()"
                   class="form-control"
                   [placeholder]="registeredUserName || 'e.g. Abebe Bikila Tadesse'"
                   required />
            <div *ngIf="nameSimilarityNotice" class="name-match-feedback" [ngClass]="nameMatchPass ? 'match-ok' : 'match-warn'">
              <span>{{ nameSimilarityNotice }}</span>
            </div>
            <small class="hint">{{ i18n.translate('Must be similar to your registered account name (' + (registeredUserName || 'Account Name') + '). Minor spelling transliterations or adding father/grandfather names are allowed.', 'ከተመዘገበው ስምዎ (' + (registeredUserName || 'የመለያ ስም') + ') ጋር መመሳሰል አለበት። የውሸት ወይም የሌላ ሰው መታወቂያ ፈጽሞ ተቀባይነት የለውም።') }}</small>
          </div>

          <!-- Phone Number and Real OTP Dispatch -->
          <div class="form-group">
            <label class="form-label">{{ i18n.translate('Ethiopian Mobile Number (Ethio Telecom / Safaricom)', 'የኢትዮጵያ ስልክ ቁጥር (ኢትዮ ቴሌኮም / ሳፋሪኮም)') }}</label>
            <div class="phone-input-group">
              <span class="phone-prefix">+251</span>
              <input type="tel"
                     [(ngModel)]="phoneNumber"
                     name="phoneNumber"
                     class="form-control phone-input"
                     placeholder="911 234 567"
                     required />
              <button type="button" class="btn btn-secondary btn-sm" (click)="sendPhoneOtp()" [disabled]="otpSending || !phoneNumber || phoneVerified">
                {{ phoneVerified ? '✓ Verified' : (otpSending ? 'Sending...' : 'Send OTP') }}
              </button>
            </div>

            <!-- OTP Input and Confirmation -->
            <div *ngIf="otpSent && !phoneVerified" style="margin-top: 0.65rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <input type="text" [(ngModel)]="otpCode" name="otpCode" placeholder="Enter 6-digit OTP" class="form-control" style="max-width: 180px; font-weight: 700; letter-spacing: 0.1em;" />
              <button type="button" class="btn btn-primary btn-sm" (click)="verifyPhoneOtp()" [disabled]="!otpCode || otpVerifying">
                {{ otpVerifying ? 'Verifying...' : 'Confirm OTP' }}
              </button>
              <button type="button" class="btn btn-outline btn-sm" (click)="sendPhoneOtp()" [disabled]="otpSending">
                Resend Code
              </button>
            </div>
            <div class="carrier-otp-alert" *ngIf="otpSuccess">
              <span>{{ otpSuccess }}</span>
            </div>
            <small class="hint error-hint" *ngIf="otpError">{{ otpError }}</small>
            <small class="hint" *ngIf="!otpSuccess && !otpError">{{ i18n.translate('Enter your active Ethiopian mobile number (09... or 07...). Security OTP code is dispatched via SMS.', 'በስምዎ የተመዘገበ ንቁ የኢትዮ ቴሌኮም ወይም የሳፋሪኮም ስልክ ቁጥር ያስገቡ። የማረጋገጫ ኮድ በSMS ይላካል።') }}</small>
          </div>

          <!-- 1. Front Side Document Upload Field -->
          <div class="form-group">
            <label class="form-label">
              {{ i18n.translate('1. Upload ID Front Page (Photo & Full Name)', '1. የመታወቂያውን ፊት ለፊት ገጽ ፎቶ (ፎቶ እና ሙሉ ስም ያለበት)') }}
              <span class="required-star">*</span>
            </label>
            <div class="file-upload-card" [class.has-file]="!!documentUrl">
              <input type="file"
                     #fileInputFront
                     (change)="onFileSelected($event, 'front')"
                     accept="image/png,image/jpeg,image/webp,image/jpg"
                     class="file-input-hidden"
                     id="idDocFrontFile" />
              
              <div *ngIf="!documentUrl" class="upload-dropzone" (click)="fileInputFront.click()">
                <div class="upload-icon">📷</div>
                <div class="upload-prompt">
                  <strong>{{ i18n.translate('Click to upload FRONT of ID card', 'የመታወቂያውን ፊት ለፊት ገጽ እዚህ ይጫኑ') }}</strong>
                  <span>{{ i18n.translate('Fayda, Kebele, or Driver\'s License front with clear photo and full name.', 'ግልጽ ፎቶ እና ሙሉ ስም የሚታይበት የፊት ለፊት ገጽ (JPEG, PNG እስከ 5MB)።') }}</span>
                </div>
              </div>

              <div *ngIf="documentUrl" class="upload-preview-area">
                <div class="preview-img-container">
                  <img [src]="documentUrl" alt="Front ID Preview" class="id-preview-img" (click)="openDocModal(documentUrl, 'ID Front Page')" />
                </div>
                <div class="file-info-bar">
                  <div class="file-meta">
                    <span class="file-badge">✓ Front Page Attached</span>
                    <small class="file-name">{{ documentFileName || 'id_front_scan.jpg' }}</small>
                  </div>
                  <button type="button" class="btn-remove-file" (click)="removeDocument('front')">✕ Remove</button>
                </div>
              </div>
            </div>
            <small class="hint error-hint" *ngIf="uploadError">{{ uploadError }}</small>
          </div>

          <!-- 2. Back Side Document Upload Field -->
          <div class="form-group">
            <label class="form-label">
              {{ i18n.translate('2. Upload ID Back Page (Address, Woreda, Barcode/QR)', '2. የመታወቂያውን የጀርባ ገጽ ፎቶ (አድራሻ፣ ባርኮድ/QR ኮድ)') }}
              <span class="required-star">*</span>
            </label>
            <div class="file-upload-card" [class.has-file]="!!documentBackUrl">
              <input type="file"
                     #fileInputBack
                     (change)="onFileSelected($event, 'back')"
                     accept="image/png,image/jpeg,image/webp,image/jpg"
                     class="file-input-hidden"
                     id="idDocBackFile" />
              
              <div *ngIf="!documentBackUrl" class="upload-dropzone" (click)="fileInputBack.click()">
                <div class="upload-icon">🔄</div>
                <div class="upload-prompt">
                  <strong>{{ i18n.translate('Click to upload BACK of ID card', 'የመታወቂያውን የጀርባ ገጽ እዚህ ይጫኑ') }}</strong>
                  <span>{{ i18n.translate('Back page with national barcode/QR code, subcity/woreda, and renewal stamp.', 'ባርኮድ/QR፣ ክፍለ ከተማ/ወረዳ እና ማህተም ያለበት የጀርባ ገጽ (JPEG, PNG እስከ 5MB)።') }}</span>
                </div>
              </div>

              <div *ngIf="documentBackUrl" class="upload-preview-area">
                <div class="preview-img-container">
                  <img [src]="documentBackUrl" alt="Back ID Preview" class="id-preview-img" (click)="openDocModal(documentBackUrl, 'ID Back Page')" />
                </div>
                <div class="file-info-bar">
                  <div class="file-meta">
                    <span class="file-badge">✓ Back Page Attached</span>
                    <small class="file-name">{{ documentBackFileName || 'id_back_scan.jpg' }}</small>
                  </div>
                  <button type="button" class="btn-remove-file" (click)="removeDocument('back')">✕ Remove</button>
                </div>
              </div>
            </div>
            <small class="hint error-hint" *ngIf="uploadBackError">{{ uploadBackError }}</small>
            <small class="hint" *ngIf="!uploadBackError">
              {{ i18n.translate('Both front and back pages are required to verify holographic watermarks, civil address, and QR validity.', 'የውሸት ሰነዶችን ለመከላከል የሁለቱም ገጾች ፎቶዎች አስፈላጊ ናቸው።') }}
            </small>
          </div>

          <div class="consent-box">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="agreedToChecks" name="agreed" required />
              <span>{{ i18n.translate('I consent to identity validation and automated AI document analysis in accordance with the Ethiopian Data Protection Proclamation and Ministry of Innovation & Technology (MInT) guidelines.', 'በኢትዮጵያ የግል መረጃ ጥበቃ አዋጅ እና በኢኖቬሽን እና ቴክኖሎጂ ሚኒስቴር መመሪያ መሰረት ማንነቴ እና የመታወቂያ ሰነዴ በAI እና በአድሚን እንዲረጋገጥ እስማማለሁ።') }}</span>
            </label>
          </div>

          <div *ngIf="submitError" class="submit-error-banner">
            {{ submitError }}
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="!canSubmit() || submitting">
            {{ submitting ? i18n.translate('Submitting & Running Two-Sided AI Verification...', 'በማስገባት እና AI ሁለቱንም ገጾች በመመርመር ላይ...') : i18n.t('verification.submit') }}
          </button>
        </form>
      </div>

      <!-- Full-screen Document Modal Preview -->
      <div class="modal-backdrop" *ngIf="viewFullDoc" (click)="viewFullDoc = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ activeModalDocTitle || i18n.translate('ID Document Inspection', 'የመታወቂያ ሰነድ እይታ') }}</h3>
            <button class="close-btn" (click)="viewFullDoc = false">✕</button>
          </div>
          <div class="modal-body">
            <img [src]="activeModalDocUrl" alt="ID Document Full View" class="modal-full-img" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verification-page {
      padding: 3rem 1rem 5rem 1rem;
      display: flex;
      justify-content: center;
    }
    .verif-card {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 680px;
      width: 100%;
      box-shadow: 0 8px 24px rgba(65, 63, 61, 0.08);
    }
    .verif-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .shield-badge {
      font-size: 1.85rem;
      margin-bottom: 0.35rem;
    }
    .verif-header h2 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .subtitle {
      color: var(--color-slate);
      font-size: 0.85rem;
      margin-top: 0.35rem;
      line-height: 1.45;
    }
    .status-banner {
      padding: 1.15rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
    }
    .banner-verified {
      background: #E8F5E9;
      border: 1px solid #A5D6A7;
      color: #1B5E20;
    }
    .banner-pending {
      background: #FFF8E1;
      border: 1px solid #FFE082;
      color: #F57F17;
    }
    .banner-rejected {
      background: #FFEBEE;
      border: 1px solid #FFCDD2;
      color: #B71C1C;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      margin-bottom: 0.35rem;
    }
    .status-icon {
      font-weight: 800;
    }
    .ai-assessment-box {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: rgba(14, 127, 143, 0.06);
      border-radius: 8px;
      border: 1px solid rgba(14, 127, 143, 0.2);
    }
    .ai-badge-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .ai-badge {
      font-weight: 700;
      font-size: 0.875rem;
      color: #0E7F8F;
    }
    .ai-verdict-tag {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .verdict-high {
      background: #D1FAE5;
      color: #065F46;
    }
    .verdict-med {
      background: #FEF3C7;
      color: #92400E;
    }
    .verdict-low {
      background: #FEE2E2;
      color: #991B1B;
    }
    .ai-summary {
      font-size: 0.875rem;
      color: #374151;
      margin: 0;
      line-height: 1.6;
    }
    .attached-doc-preview {
      margin-top: 0.85rem;
    }
    .doc-label {
      font-size: 0.875rem;
      font-weight: 700;
      display: block;
      margin-bottom: 0.5rem;
    }
    .docs-gallery {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .doc-side-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0E7F8F;
    }
    .doc-thumb-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      background: #FFFFFF;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid #E2E8F0;
    }
    .doc-thumb {
      width: 90px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #CBD5E1;
      cursor: pointer;
    }
    .btn-xs {
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
    }
    .verif-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .form-label {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-charcoal);
    }
    .required-star {
      color: var(--color-danger);
    }
    .phone-input-group {
      display: flex;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      overflow: hidden;
    }
    .phone-prefix {
      background: var(--color-surface-subtle);
      padding: 0.65rem 0.85rem;
      font-weight: 700;
      color: var(--color-slate);
      border-right: 1px solid var(--color-border);
    }
    .phone-input {
      border: none !important;
      border-radius: 0 !important;
    }
    .carrier-otp-alert {
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #065F46;
      font-size: 0.825rem;
      font-weight: 600;
    }
    .name-match-feedback {
      margin-top: 0.4rem;
      padding: 0.45rem 0.75rem;
      border-radius: 6px;
      font-size: 0.825rem;
      font-weight: 600;
    }
    .name-match-feedback.match-ok {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #065F46;
    }
    .name-match-feedback.match-warn {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #991B1B;
    }
    .hint {
      font-size: 0.75rem;
      color: var(--color-slate);
    }
    .error-hint {
      color: #DC2626;
      font-weight: 600;
    }
    /* File Upload Card */
    .file-upload-card {
      border: 2px dashed var(--color-border);
      border-radius: 8px;
      padding: 1rem;
      background: #FAFAFA;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .file-upload-card:hover {
      border-color: #0E7F8F;
      background: #F4FBFB;
    }
    .file-upload-card.has-file {
      border-style: solid;
      border-color: #10B981;
      background: #F0FDF4;
      cursor: default;
    }
    .file-input-hidden {
      display: none;
    }
    .upload-dropzone {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .upload-icon {
      font-size: 2rem;
    }
    .upload-prompt {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .upload-prompt strong {
      font-size: 0.9375rem;
      color: #0E7F8F;
    }
    .upload-prompt span {
      font-size: 0.75rem;
      color: var(--color-slate);
    }
    .upload-preview-area {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .preview-img-container {
      width: 72px;
      height: 52px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #10B981;
      flex-shrink: 0;
    }
    .id-preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
    }
    .file-info-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }
    .file-meta {
      display: flex;
      flex-direction: column;
    }
    .file-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #065F46;
    }
    .file-name {
      font-size: 0.75rem;
      color: var(--color-slate);
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .btn-remove-file {
      background: none;
      border: none;
      color: #DC2626;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
    }
    .btn-remove-file:hover {
      text-decoration: underline;
    }
    .consent-box {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.85rem;
      border-radius: 8px;
    }
    .checkbox-label {
      display: flex;
      gap: 0.6rem;
      align-items: flex-start;
      font-size: 0.875rem;
      color: var(--color-slate);
      cursor: pointer;
      line-height: 1.45;
    }
    .checkbox-label input {
      margin-top: 0.2rem;
    }
    .submit-error-banner {
      background: #FEE2E2;
      border: 1px solid #FCA5A5;
      color: #991B1B;
      padding: 0.65rem 0.85rem;
      border-radius: 6px;
      font-size: 0.875rem;
    }
    .btn-block {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      font-weight: 700;
    }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .modal-content {
      background: #FFF;
      border-radius: 12px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
    }
    .modal-header {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--color-slate);
    }
    .modal-body {
      padding: 1rem;
      overflow: auto;
      text-align: center;
      background: #111;
    }
    .modal-full-img {
      max-width: 100%;
      max-height: 75vh;
      border-radius: 6px;
      object-fit: contain;
    }
  `]
})
export class VerificationComponent implements OnInit {
  verifStatus: any = null;
  idType = 'FAYDA_NATIONAL_ID';
  idNumber = '';
  phoneNumber = '';

  // Name Matching Check
  registeredUserName = '';
  idFullName = '';
  nameMatchPass = true;
  nameSimilarityNotice = '';

  // Two-sided document state
  documentUrl = '';
  documentFileName = '';
  uploadError = '';

  documentBackUrl = '';
  documentBackFileName = '';
  uploadBackError = '';

  agreedToChecks = false;
  submitting = false;
  submitError = '';

  // Modal inspection preview
  viewFullDoc = false;
  activeModalDocUrl = '';
  activeModalDocTitle = '';

  // Phone OTP state
  phoneVerified = false;
  otpSending = false;
  otpSent = false;
  otpVerifying = false;
  otpCode = '';
  otpSuccess = '';
  otpError = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public i18n: I18nService
  ) {}

  sendPhoneOtp(): void {
    if (!this.phoneNumber) return;
    this.otpSending = true;
    this.otpError = '';
    this.otpSuccess = '';
    const fullPhone = '+251' + this.phoneNumber.replace(/^0+/, '').replace(/\s+/g, '');
    this.authService.sendPhoneOtp(fullPhone).subscribe({
      next: (res) => {
        this.otpSending = false;
        this.otpSent = true;
        if (res.otpCode) {
          this.otpSuccess = `📲 SMS sent to ${res.phone || fullPhone}! [Verification OTP Code: ${res.otpCode}]`;
          this.otpCode = res.otpCode;
        } else {
          this.otpSuccess = res.message || 'OTP code dispatched via SMS to your mobile.';
        }
      },
      error: (err) => {
        this.otpSending = false;
        this.otpError = err?.error?.message || 'Failed to dispatch phone OTP.';
      }
    });
  }

  verifyPhoneOtp(): void {
    if (!this.otpCode) return;
    this.otpVerifying = true;
    this.otpError = '';
    const fullPhone = '+251' + this.phoneNumber.replace(/^0+/, '').replace(/\s+/g, '');
    this.authService.verifyPhoneOtp(this.otpCode.trim(), fullPhone).subscribe({
      next: () => {
        this.otpVerifying = false;
        this.phoneVerified = true;
        this.otpSuccess = 'Phone number verified via SMS! ✓';
      },
      error: (err) => {
        this.otpVerifying = false;
        this.otpError = err?.error?.message || 'Invalid or expired OTP code.';
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user && user.fullName) {
      this.registeredUserName = user.fullName.trim();
    }

    this.apiService.getVerificationStatus().subscribe({
      next: (status) => {
        this.verifStatus = status;
        if (status && status.phoneNumber) {
          this.phoneNumber = status.phoneNumber.replace('+251', '');
        }
        if (status && status.documentUrl) {
          this.documentUrl = status.documentUrl;
        }
        if (status && status.documentBackUrl) {
          this.documentBackUrl = status.documentBackUrl;
        }
        if (status && status.documentName) {
          this.idFullName = status.documentName;
          this.checkNameSimilarity();
        }
      }
    });
  }

  checkNameSimilarity(): void {
    if (!this.idFullName || !this.idFullName.trim()) {
      this.nameMatchPass = false;
      this.nameSimilarityNotice = '⚠️ Please enter the full name printed on the uploaded ID card.';
      return;
    }

    if (!this.registeredUserName) {
      this.nameMatchPass = true;
      this.nameSimilarityNotice = '';
      return;
    }

    const reg = this.registeredUserName.toLowerCase().trim();
    const id = this.idFullName.toLowerCase().trim();

    if (reg === id) {
      this.nameMatchPass = true;
      this.nameSimilarityNotice = '✓ ID Name exactly matches your registered account name (' + this.registeredUserName + ').';
      return;
    }

    const regTokens = reg.split(/\s+/).filter(t => t.length > 0);
    const idTokens = id.split(/\s+/).filter(t => t.length > 0);

    const regFirst = regTokens[0] || '';
    const idFirst = idTokens[0] || '';

    // First name must be similar in Ethiopian patronymic naming
    const firstMatch = regFirst === idFirst || 
      (regFirst.length >= 3 && idFirst.length >= 3 && (regFirst.startsWith(idFirst.slice(0, 3)) || idFirst.startsWith(regFirst.slice(0, 3))));

    if (!firstMatch) {
      this.nameMatchPass = false;
      this.nameSimilarityNotice = '❌ Severe Identity Name Mismatch: The ID name "' + this.idFullName + '" does not match your registered account name "' + this.registeredUserName + '". You cannot verify an account with someone else\'s ID card.';
      return;
    }

    // Check second/father name if provided in both
    if (regTokens.length >= 2 && idTokens.length >= 2) {
      const regSecond = regTokens[1];
      const idSecond = idTokens[1];
      const secondMatch = regSecond === idSecond || (regSecond.length >= 3 && idSecond.length >= 3 && (regSecond.startsWith(idSecond.slice(0, 3)) || idSecond.startsWith(regSecond.slice(0, 3))));
      if (!secondMatch) {
        this.nameMatchPass = false;
        this.nameSimilarityNotice = '❌ Father\'s Name Mismatch: "' + this.idFullName + '" differs from registered account "' + this.registeredUserName + '". The names must belong to you.';
        return;
      }
    }

    this.nameMatchPass = true;
    this.nameSimilarityNotice = '✓ Compatible Ethiopian name match with registered profile (' + this.registeredUserName + ').';
  }

  inspectUploadedFileName(fileName: string): void {
    if (!fileName) return;
    const clean = fileName.toLowerCase().replace(/\.[^/.]+$/, '').replace(/[^a-z0-9\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter(t => t.length >= 3 && !['jpg','png','jpeg','webp','card','front','back','scan','file','photo','image','doc','id','kebele','fayda','license'].includes(t));
    if (tokens.length > 0) {
      const candidateName = tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
      const regLower = (this.registeredUserName || '').toLowerCase();
      const isConsistentWithRegistered = tokens.some(t => regLower.includes(t));
      if (!isConsistentWithRegistered) {
        // Detected filename belongs to another person!
        this.idFullName = candidateName;
        this.checkNameSimilarity();
      }
    }
  }

  onFileSelected(event: Event, side: 'front' | 'back'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (side === 'front') this.uploadError = '';
    else this.uploadBackError = '';

    // File validation: check size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      const err = 'File size exceeds 5MB limit. Please upload a smaller image.';
      if (side === 'front') this.uploadError = err;
      else this.uploadBackError = err;
      return;
    }

    // Check mime type
    if (!file.type.startsWith('image/')) {
      const err = 'Please upload a valid image file (JPEG, PNG, or WebP).';
      if (side === 'front') this.uploadError = err;
      else this.uploadBackError = err;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (side === 'front') {
        this.documentFileName = file.name;
        this.documentUrl = reader.result as string;
        this.inspectUploadedFileName(file.name);
      } else {
        this.documentBackFileName = file.name;
        this.documentBackUrl = reader.result as string;
      }
    };
    reader.onerror = () => {
      const err = 'Failed to read image file. Please try again.';
      if (side === 'front') this.uploadError = err;
      else this.uploadBackError = err;
    };
    reader.readAsDataURL(file);
  }

  removeDocument(side: 'front' | 'back'): void {
    if (side === 'front') {
      this.documentUrl = '';
      this.documentFileName = '';
      this.uploadError = '';
    } else {
      this.documentBackUrl = '';
      this.documentBackFileName = '';
      this.uploadBackError = '';
    }
  }

  openDocModal(url: string, title: string): void {
    this.activeModalDocUrl = url;
    this.activeModalDocTitle = title;
    this.viewFullDoc = true;
  }

  canSubmit(): boolean {
    return !!(this.nameMatchPass && this.idFullName.trim() && this.idNumber.trim() && this.phoneNumber.trim() && this.agreedToChecks && this.documentUrl && this.documentBackUrl);
  }

  getAiVerdictClass(verdict?: string): string {
    if (!verdict) return 'verdict-med';
    const v = verdict.toUpperCase();
    if (v.includes('HIGH') || v.includes('APPROVED')) return 'verdict-high';
    if (v.includes('SUSPICIOUS') || v.includes('REJECTED') || v.includes('LOW')) return 'verdict-low';
    return 'verdict-med';
  }

  onSubmit(): void {
    if (!this.canSubmit() || this.submitting) return;

    this.submitting = true;
    this.submitError = '';
    const fullPhone = '+251' + this.phoneNumber.replace(/\s+/g, '').replace(/^0/, '');

    this.apiService.submitVerification(
      this.idType,
      this.idNumber.trim(),
      fullPhone,
      this.documentUrl,
      this.documentBackUrl,
      undefined,
      this.idFullName.trim(),
      this.documentFileName
    ).subscribe({
      next: (res) => {
        this.verifStatus = res;
        this.submitting = false;
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.message || 'Verification submission failed. Please check your network and inputs.';
      }
    });
  }
}
