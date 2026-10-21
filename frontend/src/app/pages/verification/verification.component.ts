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
          <p class="subtitle">{{ i18n.translate('Complete Ethiopian National ID (Fayda / Kebele) verification to display a verified trust badge and unlock premium listings and contracts.', 'የተረጋገጠ የደህንነት ባጅ ለማግኘት እና አስተማማኝ ስራዎችን እና ውሎችን ለመስራት የኢትዮጵያ ብሔራዊ መታወቂያ (ፋይዳ / ቀበሌ) ማረጋገጫ ያጠናቅቁ።') }}</p>
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
          <p *ngIf="verifStatus.status === 'PENDING'">{{ i18n.translate('Your documents have been submitted to the EthioBridge compliance desk. AI pre-screening and admin verification turnaround is typically under 4 business hours.', 'ሰነዶችዎ ለኢትዮብሪጅ ተቆጣጣሪ ክፍል ቀርበዋል። የሰው ሰራሽ አስተውሎት ቅድመ-ምርመራ እና የፍቃድ ማረጋገጫው በ4 የስራ ሰዓታት ውስጥ ይጠናቀቃል።') }}</p>
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

          <!-- Attached Document Thumbnail -->
          <div *ngIf="verifStatus.documentUrl" class="attached-doc-preview">
            <span class="doc-label">Attached Document:</span>
            <div class="doc-thumb-wrapper">
              <img [src]="verifStatus.documentUrl" alt="Attached Document" class="doc-thumb" (click)="viewFullDoc = true" />
              <button type="button" class="btn btn-outline btn-xs" (click)="viewFullDoc = true">🔍 View High-Res</button>
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
            </div>
            <small class="hint">{{ i18n.translate('Must be an active Ethiopian number (09... or 07...) registered to your name.', 'በስምዎ የተመዘገበ ንቁ የኢትዮ ቴሌኮም ወይም የሳፋሪኮም ስልክ ቁጥር መሆን አለበት።') }}</small>
          </div>

          <!-- Document Upload Field -->
          <div class="form-group">
            <label class="form-label">
              {{ i18n.translate('Upload ID Document Photo / Scan', 'የመታወቂያ ፎቶ ወይም ስካን ያስገቡ') }}
              <span class="required-star">*</span>
            </label>
            <div class="file-upload-card" [class.has-file]="!!documentUrl">
              <input type="file"
                     #fileInput
                     (change)="onFileSelected($event)"
                     accept="image/png,image/jpeg,image/webp,image/jpg"
                     class="file-input-hidden"
                     id="idDocFile" />
              
              <div *ngIf="!documentUrl" class="upload-dropzone" (click)="fileInput.click()">
                <div class="upload-icon">📷</div>
                <div class="upload-prompt">
                  <strong>{{ i18n.translate('Click to choose or capture ID photo', 'የመታወቂያውን ፎቶ ለመምረጥ ወይም ለማንሳት እዚህ ይጫኑ') }}</strong>
                  <span>{{ i18n.translate('JPEG, PNG, or WebP up to 5MB. Ensure text is clear and all four corners are visible.', 'JPEG, PNG ወይም WebP እስከ 5MB። ፅሁፉ በግልጽ መነበብ እና 4ቱ ጠርዞች መታየት አለባቸው።') }}</span>
                </div>
              </div>

              <div *ngIf="documentUrl" class="upload-preview-area">
                <div class="preview-img-container">
                  <img [src]="documentUrl" alt="ID Document Preview" class="id-preview-img" (click)="viewFullDoc = true" />
                </div>
                <div class="file-info-bar">
                  <div class="file-meta">
                    <span class="file-badge">✓ Document Attached</span>
                    <small class="file-name">{{ documentFileName || 'id_document_scan.jpg' }}</small>
                  </div>
                  <button type="button" class="btn-remove-file" (click)="removeDocument()">✕ Remove</button>
                </div>
              </div>
            </div>
            <small class="hint error-hint" *ngIf="uploadError">{{ uploadError }}</small>
            <small class="hint" *ngIf="!uploadError">
              {{ i18n.translate('EthioBridge AI will automatically inspect this image for security watermarks, hologram integrity, and text clarity.', 'አርቴፊሻል ኢንተለጀንስ (AI) የመታወቂያውን ደህንነት፣ ግልጽነት እና ተአማኒነት ይመረምራል።') }}
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
            {{ submitting ? i18n.translate('Submitting & Running AI Verification...', 'በማስገባት እና AI በመመርመር ላይ...') : i18n.t('verification.submit') }}
          </button>
        </form>
      </div>

      <!-- Full-screen Document Modal Preview -->
      <div class="modal-backdrop" *ngIf="viewFullDoc" (click)="viewFullDoc = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ i18n.translate('ID Document Inspection', 'የመታወቂያ ሰነድ እይታ') }}</h3>
            <button class="close-btn" (click)="viewFullDoc = false">✕</button>
          </div>
          <div class="modal-body">
            <img [src]="documentUrl || (verifStatus && verifStatus.documentUrl)" alt="ID Document Full View" class="modal-full-img" />
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
      max-width: 640px;
      width: 100%;
      box-shadow: 0 8px 24px rgba(65, 63, 61, 0.08);
    }
    .verif-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .shield-badge {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    .verif-header h2 {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .subtitle {
      color: var(--color-slate);
      font-size: 0.9rem;
      margin-top: 0.5rem;
      line-height: 1.5;
    }
    .status-banner {
      padding: 1.25rem;
      border-radius: 10px;
      margin-bottom: 2rem;
      font-size: 0.88rem;
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
      font-size: 1.05rem;
      margin-bottom: 0.4rem;
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
      font-size: 0.82rem;
      color: #0E7F8F;
    }
    .ai-verdict-tag {
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      text-transform: uppercase;
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
      font-size: 0.8rem;
      color: #374151;
      margin: 0;
      line-height: 1.4;
    }
    .attached-doc-preview {
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .doc-label {
      font-size: 0.8rem;
      font-weight: 700;
    }
    .doc-thumb-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .doc-thumb {
      width: 50px;
      height: 38px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #ccc;
      cursor: pointer;
    }
    .btn-xs {
      padding: 0.2rem 0.5rem;
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
      font-size: 0.88rem;
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
      font-size: 0.88rem;
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
      font-size: 0.8rem;
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
      font-size: 0.8rem;
      color: var(--color-slate);
      cursor: pointer;
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
      font-size: 0.82rem;
    }
    .btn-block {
      width: 100%;
      height: 48px;
      font-size: 0.95rem;
      font-weight: 700;
    }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
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
  documentUrl = '';
  documentFileName = '';
  agreedToChecks = false;
  submitting = false;
  uploadError = '';
  submitError = '';
  viewFullDoc = false;

  constructor(
    private apiService: ApiService,
    public i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.apiService.getVerificationStatus().subscribe({
      next: (status) => {
        this.verifStatus = status;
        if (status && status.phoneNumber) {
          this.phoneNumber = status.phoneNumber.replace('+251', '');
        }
        if (status && status.documentUrl) {
          this.documentUrl = status.documentUrl;
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadError = '';

    // File validation: check size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'File size exceeds 5MB limit. Please upload a smaller image.';
      return;
    }

    // Check mime type
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Please upload a valid image file (JPEG, PNG, or WebP).';
      return;
    }

    this.documentFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.documentUrl = reader.result as string;
    };
    reader.onerror = () => {
      this.uploadError = 'Failed to read image file. Please try again.';
    };
    reader.readAsDataURL(file);
  }

  removeDocument(): void {
    this.documentUrl = '';
    this.documentFileName = '';
    this.uploadError = '';
  }

  canSubmit(): boolean {
    return !!(this.idNumber.trim() && this.phoneNumber.trim() && this.agreedToChecks && this.documentUrl);
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

    this.apiService.submitVerification(this.idType, this.idNumber.trim(), fullPhone, this.documentUrl).subscribe({
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