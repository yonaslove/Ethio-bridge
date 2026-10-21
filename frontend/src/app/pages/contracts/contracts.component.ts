import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { ToastService } from '../../services/toast.service';
import { ContractItem } from '../../models/models';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container contracts-page">
      <div class="contracts-header">
        <div>
          <h2>{{ i18n.t('contracts.escrowTitle') }}</h2>
          <p class="subtitle">{{ i18n.translate('Legally binding service agreements secured via Telebirr, CBE Birr & national banking rails.', 'በቴሌብር፣ በሲቢኢ ብር እና በሀገር ውስጥ የባንክ አሰራር የተረጋገጠ ህጋዊ የስራ እና የክፍያ ውል።') }}</p>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">{{ i18n.translate('Loading agreements...', 'ውሎችን በመጫን ላይ...') }}</div>

      <div *ngIf="!loading && contracts.length === 0" class="empty-contracts">
        <div class="empty-icon">📜</div>
        <h3>{{ i18n.translate('No Contracts Created Yet', 'እስካሁን ምንም የተፈጠረ ውል የለም') }}</h3>
        <p>{{ i18n.translate('When a seeker accepts an application or issues an offer, an escrow contract will appear here.', 'አሰሪው ማመልከቻ ሲቀበል ወይም የስራ ውል ሲያቀርብ፣ የዋስትና ውሉ እዚህ ይታያል።') }}</p>
        <a routerLink="/browse" class="btn btn-primary">{{ i18n.translate('Browse Active Listings', 'ክፍት ስራዎችን ያስሱ') }}</a>
      </div>

      <div *ngIf="!loading && contracts.length > 0" class="contracts-grid">
        <div *ngFor="let c of contracts" class="contract-card">
          <div class="card-top">
            <div class="title-group">
              <span class="status-badge" [ngClass]="'status-' + c.status.toLowerCase()">{{ c.status }}</span>
              <h3>{{ c.title }}</h3>
              <p class="parties">
                <strong>{{ i18n.translate('Seeker:', 'አሰሪ:') }}</strong> {{ c.seekerName }} &bull;
                <strong>{{ i18n.translate('Provider:', 'ባለሙያ:') }}</strong> {{ c.providerName }}
                <span *ngIf="c.providerVerified" class="verified-pill">{{ i18n.translate('✓ Verified', '✓ የተረጋገጠ') }}</span>
              </p>
              <div class="parties-chat-row" style="margin-top: 0.5rem;">
                <button
                  type="button"
                  (click)="openChatWithParty(c)"
                  class="btn btn-outline btn-sm btn-contract-msg"
                  title="Direct messaging with contract party">
                  💬 {{ isSeeker(c) ? (i18n.translate('Message Provider: ', 'ባለሙያውን ያነጋግሩ: ') + c.providerName) : (i18n.translate('Message Seeker: ', 'አሰሪውን ያነጋግሩ: ') + c.seekerName) }}
                </button>
              </div>
            </div>
            <div class="amount-badge">
              <span class="currency">ETB</span>
              <span class="value">{{ c.totalAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <div *ngIf="c.terms" class="contract-terms">
            <strong>{{ i18n.translate('Scope & Terms:', 'የስራ ዝርዝር እና ውል:') }}</strong> {{ c.terms }}
          </div>

          <!-- Milestones Section -->
          <div class="milestones-container">
            <h4>{{ i18n.translate('Escrow Deliverables & Milestones', 'የውል ደረጃዎች እና የዋስትና ክፍያዎች') }}</h4>
            <div class="milestone-list">
              <div *ngFor="let m of c.milestones" class="milestone-item">
                <div class="m-info">
                  <div class="m-title-row">
                    <span class="m-title">{{ m.title }}</span>
                    <span class="m-status-badge" [ngClass]="'m-status-' + m.status.toLowerCase()">{{ m.status }}</span>
                  </div>
                  <p *ngIf="m.description" class="m-desc">{{ m.description }}</p>
                  <div class="m-meta">
                    <span>{{ i18n.translate('Due:', 'የማጠናቀቂያ ቀን:') }} {{ m.dueDate ? (m.dueDate | date:'mediumDate') : i18n.translate('On Delivery', 'ስራው ሲደርስ') }}</span>
                    <span *ngIf="m.fundedAt">{{ i18n.translate('Funded:', 'ክፍያ የተያዘለት:') }} {{ m.fundedAt | date:'shortDate' }}</span>
                    <span *ngIf="m.deliveredAt">{{ i18n.translate('Delivered:', 'ስራ የቀረበበት:') }} {{ m.deliveredAt | date:'shortDate' }}</span>
                    <span *ngIf="m.releasedAt">{{ i18n.translate('Released:', 'የተለቀቀ:') }} {{ m.releasedAt | date:'shortDate' }}</span>
                  </div>

                  <!-- Deliverable Box if delivered or has notes -->
                  <div class="m-delivery-box" *ngIf="m.deliveryNotes">
                    <div class="delivery-box-header">
                      <span>📦 <strong>{{ i18n.translate('Submitted Deliverable for Review:', 'የቀረበው የስራ ውጤት:') }}</strong></span>
                      <small *ngIf="m.deliveredAt">{{ m.deliveredAt | date:'medium' }}</small>
                    </div>
                    <p class="delivery-notes">{{ m.deliveryNotes }}</p>
                  </div>

                  <!-- 10% Platform Take Rate Financial Breakdown (Upwork Model) -->
                  <div class="m-fee-pill" *ngIf="m.status === 'FUNDED' || m.status === 'DELIVERED' || m.status === 'RELEASED'">
                    <span>Gross: <strong>{{ m.amount | number:'1.2-2' }} ETB</strong></span>
                    <span>•</span>
                    <span class="fee-deduction">10% Platform Fee: <strong>-{{ (m.platformFeeAmount || (m.amount * 0.10)) | number:'1.2-2' }} ETB</strong></span>
                    <span>•</span>
                    <span class="fee-net">Net to Provider: <strong>{{ (m.netPayoutAmount || (m.amount * 0.90)) | number:'1.2-2' }} ETB</strong></span>
                  </div>
                </div>

                <div class="m-action-col">
                  <span class="m-amount">{{ m.amount | number:'1.2-2' }} ETB</span>

                  <!-- State: PENDING -->
                  <ng-container *ngIf="m.status === 'PENDING'">
                    <div *ngIf="isSeeker(c)" class="escrow-pay-buttons">
                      <button (click)="payMilestoneDirectWithChapa(m, c)"
                              class="btn btn-chapa-direct btn-sm"
                              [disabled]="chapaCheckoutLoading">
                        💳 {{ i18n.translate('Pay with Chapa', 'በቻፓ ይክፈሉ') }}
                      </button>
                      <button (click)="openFundModal(m, c)"
                              class="btn btn-outline btn-sm">
                        {{ i18n.translate('Other Rails (Telebirr/CBE)', 'ሌሎች አማራጮች') }}
                      </button>
                    </div>
                    <span *ngIf="isProvider(c)" class="badge-unfunded">
                      {{ i18n.translate('🔒 Deposit Pending', '🔒 ክፍያ በመጠበቅ ላይ') }}
                    </span>
                  </ng-container>

                  <!-- State: FUNDED -->
                  <ng-container *ngIf="m.status === 'FUNDED'">
                    <button *ngIf="isProvider(c)"
                            (click)="openDeliverModal(m, c)"
                            class="btn btn-primary btn-sm">
                      {{ i18n.translate('Submit Work / Deliver 📤', 'ስራውን አስረክብ 📤') }}
                    </button>
                    <span *ngIf="isSeeker(c)" class="badge-in-progress">
                      {{ i18n.translate('⏳ Provider In Progress', '⏳ ባለሙያው በመስራት ላይ') }}
                    </span>
                  </ng-container>

                  <!-- State: DELIVERED -->
                  <ng-container *ngIf="m.status === 'DELIVERED'">
                    <div *ngIf="isSeeker(c)" class="delivery-action-btns">
                      <button (click)="openInspectReleaseModal(m, c)"
                              class="btn btn-success btn-sm">
                        {{ i18n.translate('Inspect & Release ✓', 'መርምረህ ክፍያውን ልቀቅ ✓') }}
                      </button>
                      <button (click)="openRevisionModal(m, c)"
                              class="btn btn-outline btn-sm">
                        {{ i18n.translate('Revision ↺', 'ማሻሻያ ↺') }}
                      </button>
                    </div>
                    <span *ngIf="isProvider(c)" class="badge-under-review">
                      {{ i18n.translate('📤 Under Seeker Review', '📤 በመገምገም ላይ') }}
                    </span>
                  </ng-container>

                  <!-- State: RELEASED -->
                  <ng-container *ngIf="m.status === 'RELEASED'">
                    <span class="badge-released">
                      {{ i18n.translate('✓ Released', '✓ ተለቋል') }}
                    </span>
                  </ng-container>

                  <!-- Both: Dispute -->
                  <button *ngIf="m.status === 'FUNDED' || m.status === 'DELIVERED'"
                          (click)="openDisputeModal(c)"
                          class="btn-dispute-link">
                    {{ i18n.translate('Dispute', 'ቅሬታ ያቅርቡ') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Telebirr / CBE Birr Funding Modal -->
      <div *ngIf="fundingModalMilestone" class="modal-backdrop">
        <div class="modal-window">
          <div class="modal-header">
            <h3>Fund Escrow Milestone</h3>
            <button (click)="fundingModalMilestone = null" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="payment-summary">
              <div class="summary-line">
                <span>Milestone:</span>
                <strong>{{ fundingModalMilestone.title }}</strong>
              </div>
              <div class="summary-line">
                <span>Total Escrow Amount:</span>
                <strong class="highlight-amount">{{ fundingModalMilestone.amount | number:'1.2-2' }} ETB</strong>
              </div>
            </div>

            <label class="form-label">Select Payment Rail</label>
            <div class="rail-options">
              <label class="rail-card" [class.selected]="selectedRail === 'TELEBIRR'">
                <input type="radio" [(ngModel)]="selectedRail" name="rail" value="TELEBIRR" />
                <div class="rail-icon tb-icon">TB</div>
                <div class="rail-text">
                  <strong>Telebirr</strong>
                  <small>Ethio telecom instant USSD & SuperApp QR</small>
                </div>
              </label>

              <label class="rail-card" [class.selected]="selectedRail === 'CBE_BIRR'">
                <input type="radio" [(ngModel)]="selectedRail" name="rail" value="CBE_BIRR" />
                <div class="rail-icon cbe-icon">CBE</div>
                <div class="rail-text">
                  <strong>CBE Birr</strong>
                  <small>Commercial Bank of Ethiopia direct payment</small>
                </div>
              </label>

              <label class="rail-card" [class.selected]="selectedRail === 'CHAPA'">
                <input type="radio" [(ngModel)]="selectedRail" name="rail" value="CHAPA" />
                <div class="rail-icon chp-icon">CH</div>
                <div class="rail-text">
                  <strong>Chapa Payment</strong>
                  <small>Cards, Awash, Dashen, Bank transfer</small>
                </div>
              </label>
            </div>

            <div *ngIf="selectedRail === 'CHAPA'" class="chapa-test-banner" style="margin-top: 1rem; background: #E8F5E9; border: 1px dashed #2E7D32; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; color: #1B5E20;">
              <div style="margin-bottom: 0.4rem;">
                💳 <strong>Chapa Sandbox Test Mode:</strong> Active test secret key configured. Supports Visa / Mastercard, Awash, Dashen, and Telebirr.
              </div>
              <button type="button" (click)="testChapaHostedCheckout()" class="btn btn-outline btn-sm" [disabled]="chapaCheckoutLoading" style="font-size: 0.75rem; background: #fff;">
                {{ chapaCheckoutLoading ? 'Connecting to Chapa Gateway...' : '↗ Test Hosted Chapa Payment Page (New Window)' }}
              </button>
              <div *ngIf="chapaHostedUrl" style="margin-top: 0.35rem; font-size: 0.75rem; word-break: break-all;">
                Hosted URL: <a [href]="chapaHostedUrl" target="_blank" style="color: #0072BC; font-weight: 600;">{{ chapaHostedUrl }}</a>
              </div>
            </div>

            <div class="escrow-notice">
              🛡️ <strong>EthioBridge Guarantee:</strong> Funds remain securely locked in platform escrow until you inspect and approve the completed deliverable.
            </div>
          </div>

          <div class="modal-footer">
            <button (click)="fundingModalMilestone = null" class="btn btn-outline" [disabled]="processingPayment">Cancel</button>
            <button (click)="confirmFunding()" class="btn btn-primary" [disabled]="processingPayment">
              {{ processingPayment ? 'Connecting Payment Rail...' : 'Authorize ' + fundingModalMilestone.amount + ' ETB' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Provider Submit Deliverables Modal -->
      <div *ngIf="deliverModalMilestone" class="modal-backdrop">
        <div class="modal-window">
          <div class="modal-header">
            <h3>{{ i18n.translate('Submit Milestone Deliverable', 'የስራውን ውጤት ያስረክቡ') }}</h3>
            <button (click)="deliverModalMilestone = null" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="payment-summary">
              <div class="summary-line">
                <span>{{ i18n.translate('Milestone:', 'ደረጃ:') }}</span>
                <strong>{{ deliverModalMilestone.title }}</strong>
              </div>
              <div class="summary-line">
                <span>{{ i18n.translate('Escrow Funds Locked:', 'በዋስትና የተያዘ በጀት:') }}</span>
                <strong class="highlight-amount">{{ deliverModalMilestone.amount | number:'1.2-2' }} ETB</strong>
              </div>
              <div class="summary-line">
                <span>{{ i18n.translate('Net Payout to You (after 10% platform fee):', 'የእርስዎ የተጣራ ክፍያ (10% የሲስተም ክፍያ ተቀንሶ):') }}</span>
                <strong style="color: #0E7F8F;">{{ (deliverModalMilestone.amount * 0.90) | number:'1.2-2' }} ETB</strong>
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">{{ i18n.translate('Completion Summary / Work Notes *', 'የተከናወነው ስራ ማጠቃለያ *') }}</label>
              <textarea [(ngModel)]="deliveryNotes" rows="4" class="form-control"
                        [placeholder]="i18n.translate('Describe what was built, features completed, and instructions for the seeker to review...', 'የተጠናቀቀውን ስራ ዝርዝር እና አሰሪው የሚመለከትበትን ሁኔታ ያብራሩ...')"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">{{ i18n.translate('Deliverable Link / Attachment URL (Optional)', 'የስራው ማስረጃ ሊንክ (አማራጭ)') }}</label>
              <input type="text" [(ngModel)]="deliveryLink" class="form-control"
                     [placeholder]="i18n.translate('e.g. https://github.com/... or Figma / Google Drive link', 'ለምሳሌ https://github.com/... ወይም የፊግማ ሊንክ')" />
            </div>

            <div class="escrow-notice">
              🛡️ <strong>{{ i18n.translate('Upwork Escrow Protection:', 'የስራ ዋስትና ከለላ:') }}</strong>
              {{ i18n.translate('The seeker must inspect and approve this delivery to release the escrow payout of ' + ((deliverModalMilestone.amount * 0.90) | number:'1.2-2') + ' ETB.', 'አሰሪው ስራዎን መርምሮ ሲያፀድቅ የተጣራ ክፍያ ' + ((deliverModalMilestone.amount * 0.90) | number:'1.2-2') + ' ብር ወዲያውኑ ይለቀቃል።') }}
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="deliverModalMilestone = null" class="btn btn-outline" [disabled]="submittingDelivery">{{ i18n.translate('Cancel', 'ይቅር') }}</button>
            <button (click)="confirmDelivery()" class="btn btn-primary" [disabled]="submittingDelivery || !deliveryNotes.trim()">
              {{ submittingDelivery ? i18n.translate('Submitting...', 'በማስረከብ ላይ...') : i18n.translate('Submit Work for Inspection 📤', 'ስራውን አስረክብ 📤') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Seeker Inspect & Release Modal -->
      <div *ngIf="inspectReleaseMilestone" class="modal-backdrop">
        <div class="modal-window">
          <div class="modal-header">
            <h3>{{ i18n.translate('Inspect Deliverables & Release Payout', 'የቀረበውን ስራ መርምረው ክፍያ ይልቀቁ') }}</h3>
            <button (click)="inspectReleaseMilestone = null" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="delivery-review-card">
              <div class="review-title">📦 {{ i18n.translate('Provider Deliverable Submission', 'የቀረበው የስራ ውጤት') }}</div>
              <div class="review-notes">{{ inspectReleaseMilestone.deliveryNotes || 'Work submitted by provider.' }}</div>
              <div class="review-meta" *ngIf="inspectReleaseMilestone.deliveredAt">
                {{ i18n.translate('Delivered on:', 'የቀረበበት ቀን:') }} {{ inspectReleaseMilestone.deliveredAt | date:'medium' }}
              </div>
            </div>

            <div class="payment-summary" style="margin-top: 1.25rem;">
              <div class="summary-line">
                <span>{{ i18n.translate('Milestone:', 'ደረጃ:') }}</span>
                <strong>{{ inspectReleaseMilestone.title }}</strong>
              </div>
              <div class="summary-line">
                <span>{{ i18n.translate('Total Escrow Deposited:', 'የተያዘው ጠቅላላ ዋስትና:') }}</span>
                <strong class="highlight-amount">{{ inspectReleaseMilestone.amount | number:'1.2-2' }} ETB</strong>
              </div>
              <div class="summary-line">
                <span>{{ i18n.translate('10% EthioBridge Service Fee:', '10% የኢትዮብሪጅ አገልግሎት ክፍያ:') }}</span>
                <strong class="fee-deduction">-{{ (inspectReleaseMilestone.amount * 0.10) | number:'1.2-2' }} ETB</strong>
              </div>
              <div class="summary-line">
                <span>{{ i18n.translate('Net Transferred to Provider:', 'ለባለሙያው የሚተላለፍ የተጣራ ክፍያ:') }}</span>
                <strong class="fee-net">{{ (inspectReleaseMilestone.amount * 0.90) | number:'1.2-2' }} ETB</strong>
              </div>
            </div>

            <div class="escrow-notice" style="margin-top: 1rem;">
              ⚖️ <strong>{{ i18n.translate('Professional Upwork-Style Escrow Settlement:', 'ህጋዊ የዋስትና ክፍያ ማጠናቀቂያ:') }}</strong>
              {{ i18n.translate('Releasing funds marks this deliverable as successfully fulfilled and automatically transfers payout to provider account via the Chapa / Telebirr rail.', 'ክፍያ ሲለቁ ስራው በአግባቡ መጠናቀቁ ተረጋግጦ የተጣራው ገንዘብ በቻፓ ወይም በቴሌብር ወደ ባለሙያው ሂሳብ ይተላለፋል።') }}
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="openRevisionModal(inspectReleaseMilestone, inspectReleaseContract)" class="btn btn-outline" [disabled]="releasingPayout">
              {{ i18n.translate('Request Revisions ↺', 'ማሻሻያ ይጠይቁ ↺') }}
            </button>
            <button (click)="confirmRelease()" class="btn btn-success" [disabled]="releasingPayout">
              {{ releasingPayout ? i18n.translate('Releasing Escrow...', 'ክፍያ በመልቀቅ ላይ...') : i18n.translate('Approve & Release Funds ✓', 'አፅድቀህ ክፍያውን ልቀቅ ✓') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Seeker Request Revision Modal -->
      <div *ngIf="revisionModalMilestone" class="modal-backdrop">
        <div class="modal-window">
          <div class="modal-header">
            <h3>{{ i18n.translate('Request Deliverable Revisions', 'የስራ ማሻሻያ ይጠይቁ') }}</h3>
            <button (click)="revisionModalMilestone = null" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>{{ i18n.translate('Specify what parts of the deliverable need adjustment before escrow funds are released.', 'ክፍያው ከመለቀቁ በፊት በስራው ላይ ምን መስተካከል እንዳለበት በዝርዝር ያብራሩ።') }}</p>
            <div class="form-group">
              <label class="form-label">{{ i18n.translate('Revision Instructions *', 'የማሻሻያ መመሪያዎች *') }}</label>
              <textarea [(ngModel)]="revisionReason" rows="4" class="form-control"
                        [placeholder]="i18n.translate('Describe changes required...', 'የሚፈለጉትን ለውጦች ይግለጹ...')"></textarea>
            </div>
            <div class="escrow-notice">
              🛡️ {{ i18n.translate('Escrow funds will remain safely locked. The provider will be notified to revise and re-submit the deliverable.', 'የዋስትና ገንዘቡ እንደተጠበቀ ይቆያል። ባለሙያው ማሻሻያ አድርጎ በድጋሚ እንዲያስረክብ ማሳሰቢያ ይደርሰዋል።') }}
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="revisionModalMilestone = null" class="btn btn-outline" [disabled]="submittingRevision">{{ i18n.translate('Cancel', 'ይቅር') }}</button>
            <button (click)="confirmRevision()" class="btn btn-danger" [disabled]="submittingRevision || !revisionReason.trim()">
              {{ submittingRevision ? i18n.translate('Sending...', 'በመላክ ላይ...') : i18n.translate('Send Revision Request', 'የማሻሻያ ጥያቄ ላክ') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Dispute Modal -->
      <div *ngIf="disputeModalContract" class="modal-backdrop">
        <div class="modal-window">
          <div class="modal-header">
            <h3>Open Mediation Dispute</h3>
            <button (click)="disputeModalContract = null" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>If deliverables do not match agreed specifications, our compliance arbitration team will review milestones, message logs, and submit a binding settlement.</p>
            <div class="form-group">
              <label class="form-label">Dispute Reason</label>
              <select [(ngModel)]="disputeReason" class="form-control">
                <option value="Incomplete Deliverable">Incomplete Deliverable</option>
                <option value="Quality Divergence">Quality Divergence from Scope</option>
                <option value="Missed Deadline">Unresponsive / Missed Deadline</option>
                <option value="Other">Other Conflict</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Detailed Explanation</label>
              <textarea [(ngModel)]="disputeDetails" rows="4" class="form-control" placeholder="Provide concrete evidence or milestone deficiencies..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button (click)="disputeModalContract = null" class="btn btn-outline">Cancel</button>
            <button (click)="submitDispute()" class="btn btn-danger" [disabled]="!disputeDetails.trim()">
              Submit Dispute
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contracts-page {
      padding: 2rem 1rem 4rem 1rem;
    }
    .contracts-header {
      margin-bottom: 2rem;
    }
    .contracts-header h2 {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .subtitle {
      color: var(--color-slate);
      font-size: 0.95rem;
    }
    .contracts-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .contract-card {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(65, 63, 61, 0.05);
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .title-group h3 {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0.35rem 0;
      color: var(--color-charcoal);
    }
    .parties {
      font-size: 0.85rem;
      color: var(--color-slate);
      margin: 0;
    }
    .verified-pill {
      background: rgba(28, 184, 205, 0.15);
      color: #0E7F8F;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 10px;
      margin-left: 0.35rem;
    }
    .amount-badge {
      text-align: right;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.5rem 1rem;
      border-radius: 8px;
    }
    .currency {
      font-size: 0.75rem;
      color: var(--color-slate);
      display: block;
      font-weight: 700;
    }
    .value {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .contract-terms {
      background: #fbfbfb;
      border-left: 3px solid var(--color-cyan);
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      color: var(--color-slate);
      margin-bottom: 1.5rem;
      border-radius: 0 6px 6px 0;
    }
    .status-badge {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
    }
    .status-active { background: #E8F5E9; color: #2E7D32; }
    .status-completed { background: #E1F5FE; color: #0288D1; }
    .status-disputed { background: #FFEBEE; color: #D32F2F; }
    .milestones-container h4 {
      font-size: 1rem;
      font-weight: 800;
      margin-bottom: 1rem;
      color: var(--color-charcoal);
    }
    .milestone-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .milestone-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }
    .m-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }
    .m-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--color-charcoal);
    }
    .m-desc {
      font-size: 0.82rem;
      color: var(--color-slate);
      margin: 0.2rem 0;
    }
    .m-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--color-slate);
    }
    .m-fee-pill {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.75rem;
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 0.25rem 0.6rem;
      margin-top: 0.4rem;
      color: var(--color-charcoal);
    }
    .fee-deduction {
      color: #E65100;
      font-weight: 700;
    }
    .fee-net {
      color: #2E7D32;
      font-weight: 700;
    }
    .m-status-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .m-status-pending { background: #FFF3E0; color: #E65100; }
    .m-status-funded { background: #E0F7FA; color: #006064; }
    .m-status-delivered { background: #EDE7F6; color: #4527A0; }
    .m-status-released { background: #E8F5E9; color: #2E7D32; }
    .m-status-disputed { background: #FFEBEE; color: #C62828; }
    .m-delivery-box {
      background: rgba(14, 127, 143, 0.05);
      border-left: 3px solid var(--color-cyan);
      padding: 0.65rem 0.85rem;
      border-radius: 4px;
      margin-top: 0.5rem;
    }
    .delivery-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
      color: var(--color-charcoal);
    }
    .delivery-notes {
      font-size: 0.85rem;
      color: #333333;
      white-space: pre-wrap;
      margin: 0;
      line-height: 1.45;
    }
    .delivery-action-btns {
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }
    .badge-unfunded {
      background: #FFF3E0;
      color: #E65100;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      display: inline-block;
    }
    .badge-in-progress {
      background: #E0F7FA;
      color: #006064;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      display: inline-block;
    }
    .badge-under-review {
      background: #EDE7F6;
      color: #4527A0;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      display: inline-block;
    }
    .badge-released {
      background: #E8F5E9;
      color: #2E7D32;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      display: inline-block;
    }
    .delivery-review-card {
      background: #F9FAFB;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem;
    }
    .review-title {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--color-charcoal);
      margin-bottom: 0.4rem;
    }
    .review-notes {
      font-size: 0.875rem;
      color: #333;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .review-meta {
      font-size: 0.75rem;
      color: var(--color-slate);
      margin-top: 0.5rem;
      border-top: 1px dashed var(--color-border);
      padding-top: 0.35rem;
    }
    .m-action-col {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .m-amount {
      font-weight: 800;
      font-size: 1.05rem;
      color: var(--color-charcoal);
    }
    .btn-telebirr {
      background: #0072BC;
      color: #FFFFFF;
      border: none;
      font-weight: 700;
      border-radius: 6px;
      padding: 0.45rem 0.85rem;
      cursor: pointer;
    }
    .btn-telebirr:hover {
      background: #005c99;
    }
    .btn-dispute-link {
      background: none;
      border: none;
      color: #D32F2F;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-window {
      background: #FFFFFF;
      border-radius: 12px;
      width: 90%;
      max-width: 520px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 800;
      margin: 0;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .payment-summary {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      margin-bottom: 0.35rem;
    }
    .highlight-amount {
      color: var(--color-cyan);
      font-size: 1.15rem;
    }
    .rail-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .rail-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 2px solid var(--color-border);
      padding: 0.85rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .rail-card.selected {
      border-color: var(--color-cyan);
      background: rgba(28, 184, 205, 0.05);
    }
    .rail-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
    }
    .tb-icon { background: #0072BC; }
    .cbe-icon { background: #562365; }
    .chp-icon { background: #00A651; }
    .rail-text {
      display: flex;
      flex-direction: column;
    }
    .rail-text small {
      color: var(--color-slate);
      font-size: 0.75rem;
    }
    .escrow-notice {
      background: #E8F5E9;
      color: #2E7D32;
      font-size: 0.8rem;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1.25rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .escrow-pay-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .btn-chapa-direct {
      background: linear-gradient(135deg, #00A651 0%, #00843D 100%);
      color: #FFFFFF !important;
      border: none;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(0, 166, 81, 0.3);
      transition: all 0.2s ease;
    }
    .btn-chapa-direct:hover {
      background: linear-gradient(135deg, #00843D 0%, #00662F 100%);
      box-shadow: 0 4px 10px rgba(0, 166, 81, 0.4);
      transform: translateY(-1px);
    }
  `]
})
export class ContractsComponent implements OnInit {
  contracts: any[] = [];
  loading = true;
  fundingModalMilestone: any = null;
  fundingModalContract: any = null;
  selectedRail = 'TELEBIRR';
  processingPayment = false;

  deliverModalMilestone: any = null;
  deliverModalContract: any = null;
  deliveryNotes = '';
  deliveryLink = '';
  submittingDelivery = false;

  inspectReleaseMilestone: any = null;
  inspectReleaseContract: any = null;
  releasingPayout = false;

  revisionModalMilestone: any = null;
  revisionModalContract: any = null;
  revisionReason = '';
  submittingRevision = false;

  chapaCheckoutLoading = false;
  chapaHostedUrl: string | null = null;

  disputeModalContract: any = null;
  disputeReason = 'Incomplete Deliverable';
  disputeDetails = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public i18n: I18nService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadContracts();

    this.route.queryParams.subscribe(params => {
      if (params['chapa_milestone'] && params['tx_ref']) {
        const txRef = params['tx_ref'];
        this.toastService.info('Verifying Chapa escrow deposit...', 'Chapa Gateway');
        this.apiService.verifyChapaPayment(txRef).subscribe({
          next: (res) => {
            if (res && res.status === 'SUCCESS') {
              this.toastService.success(
                `🎉 Payment verified on Chapa! Escrow milestone of ${res.amount} ETB is now FUNDED and secured.`,
                'Escrow Funded'
              );
              this.loadContracts();
            } else {
              this.toastService.warning('Payment verification is pending or incomplete on Chapa.', 'Chapa Verification');
            }
          },
          error: () => {
            this.toastService.error('Failed to verify payment with Chapa.', 'Verification Error');
          }
        });
      }
    });
  }

  payMilestoneDirectWithChapa(milestone: any, contract: any): void {
    this.chapaCheckoutLoading = true;
    this.apiService.initializeChapaCheckout(
      milestone.amount,
      contract.id,
      milestone.id,
      `Escrow deposit for milestone: ${milestone.title}`
    ).subscribe({
      next: (res) => {
        this.chapaCheckoutLoading = false;
        const targetUrl = res?.checkoutUrl || res?.checkout_url;
        if (targetUrl) {
          window.location.href = targetUrl;
        } else {
          this.toastService.info(`Chapa sandbox reference generated: ${res.txRef}`, 'Chapa Gateway');
        }
      },
      error: (err) => {
        this.chapaCheckoutLoading = false;
        this.toastService.error('Could not initialize Chapa payment: ' + (err?.error?.message || 'Network error'));
      }
    });
  }

  openChatWithParty(c: ContractItem): void {
    const targetUserId = this.isSeeker(c) ? c.providerUserId : c.seekerUserId;
    if (!targetUserId) {
      this.router.navigate(['/messages']);
      return;
    }
    this.apiService.createOrGetThread(
      targetUserId,
      c.listingId,
      `Contract: ${c.title}`
    ).subscribe({
      next: (thread) => this.router.navigate(['/messages'], { queryParams: { threadId: thread.id } }),
      error: () => this.router.navigate(['/messages'])
    });
  }

  loadContracts(): void {
    this.apiService.getMyContracts().subscribe({
      next: (data) => {
        this.contracts = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  isSeeker(contract: any): boolean {
    const user = this.authService.currentUser;
    return user ? contract.seekerUserId === user.userId : false;
  }

  isProvider(contract: any): boolean {
    const user = this.authService.currentUser;
    return user ? contract.providerUserId === user.userId : false;
  }

  openFundModal(milestone: any, contract: any): void {
    this.fundingModalMilestone = milestone;
    this.fundingModalContract = contract;
    this.chapaHostedUrl = null;
  }

  testChapaHostedCheckout(): void {
    if (!this.fundingModalMilestone) return;
    this.chapaCheckoutLoading = true;
    this.chapaHostedUrl = null;

    this.apiService.initializeChapaCheckout(
      this.fundingModalMilestone.amount,
      this.fundingModalContract?.id,
      this.fundingModalMilestone.id,
      `Escrow deposit for: ${this.fundingModalMilestone.title}`
    ).subscribe({
      next: (res) => {
        this.chapaCheckoutLoading = false;
        if (res && res.checkout_url) {
          this.chapaHostedUrl = res.checkout_url;
          window.open(res.checkout_url, '_blank');
          this.toastService.info('Opened live Chapa hosted checkout in a new window.', 'Chapa Gateway');
        } else {
          this.toastService.info(`Chapa sandbox reference generated: ${res.txRef}`, 'Chapa Sandbox');
        }
      },
      error: (err) => {
        this.chapaCheckoutLoading = false;
        this.toastService.error('Could not initialize Chapa checkout: ' + (err?.error?.message || 'Network error'));
      }
    });
  }

  confirmFunding(): void {
    if (!this.fundingModalMilestone) return;

    if (this.selectedRail === 'CHAPA') {
      this.payMilestoneDirectWithChapa(this.fundingModalMilestone, this.fundingModalContract);
      this.fundingModalMilestone = null;
      return;
    }

    this.processingPayment = true;

    this.apiService.fundMilestone(this.fundingModalMilestone.id, this.selectedRail).subscribe({
      next: (updated) => {
        this.fundingModalMilestone.status = updated.status;
        this.fundingModalMilestone.fundedAt = updated.fundedAt;
        this.processingPayment = false;
        const railName = this.selectedRail === 'TELEBIRR' ? 'Telebirr' : 'CBE Birr';
        this.toastService.success(
          `Escrow milestone funded successfully via ${railName}! Funds are securely held in platform escrow.`,
          'Milestone Funded'
        );
        this.fundingModalMilestone = null;
        this.loadContracts();
      },
      error: () => {
        this.processingPayment = false;
        this.toastService.error('Failed to fund escrow milestone. Gateway rail reported an error.', 'Payment Failed');
      }
    });
  }

  openDeliverModal(milestone: any, contract: any): void {
    this.deliverModalMilestone = milestone;
    this.deliverModalContract = contract;
    this.deliveryNotes = '';
    this.deliveryLink = '';
  }

  confirmDelivery(): void {
    if (!this.deliverModalMilestone || !this.deliveryNotes.trim()) return;
    this.submittingDelivery = true;

    const fullNotes = this.deliveryLink.trim()
      ? `${this.deliveryNotes.trim()}\n\n🔗 Deliverable URL / Repository: ${this.deliveryLink.trim()}`
      : this.deliveryNotes.trim();

    this.apiService.deliverMilestone(this.deliverModalMilestone.id, fullNotes).subscribe({
      next: (updated) => {
        this.deliverModalMilestone.status = updated.status;
        this.deliverModalMilestone.deliveredAt = updated.deliveredAt;
        this.deliverModalMilestone.deliveryNotes = updated.deliveryNotes;
        this.submittingDelivery = false;
        this.toastService.success(
          'Deliverable submitted successfully! Seeker has been notified to inspect and release escrow payout.',
          'Work Submitted'
        );
        this.deliverModalMilestone = null;
        this.loadContracts();
      },
      error: (err) => {
        this.submittingDelivery = false;
        this.toastService.error(
          err?.error?.message || 'Failed to submit deliverable. Ensure milestone is funded in escrow.',
          'Delivery Failed'
        );
      }
    });
  }

  openInspectReleaseModal(milestone: any, contract: any): void {
    this.inspectReleaseMilestone = milestone;
    this.inspectReleaseContract = contract;
  }

  confirmRelease(): void {
    if (!this.inspectReleaseMilestone) return;
    this.releasingPayout = true;

    this.apiService.releaseMilestone(this.inspectReleaseMilestone.id).subscribe({
      next: (updated) => {
        this.inspectReleaseMilestone.status = updated.status;
        this.inspectReleaseMilestone.releasedAt = updated.releasedAt;
        this.inspectReleaseMilestone.platformFeePercent = updated.platformFeePercent;
        this.inspectReleaseMilestone.platformFeeAmount = updated.platformFeeAmount;
        this.inspectReleaseMilestone.netPayoutAmount = updated.netPayoutAmount;
        this.releasingPayout = false;
        this.toastService.success(
          `Escrow payout released successfully! Net ${updated.netPayoutAmount || (this.inspectReleaseMilestone.amount * 0.90)} ETB transferred to provider (10% platform fee retained).`,
          'Payout Released'
        );
        this.inspectReleaseMilestone = null;
        this.loadContracts();
      },
      error: (err) => {
        this.releasingPayout = false;
        this.toastService.error(err?.error?.message || 'Failed to release payout.');
      }
    });
  }

  openRevisionModal(milestone: any, contract: any): void {
    this.inspectReleaseMilestone = null;
    this.revisionModalMilestone = milestone;
    this.revisionModalContract = contract;
    this.revisionReason = '';
  }

  confirmRevision(): void {
    if (!this.revisionModalMilestone || !this.revisionReason.trim()) return;
    this.submittingRevision = true;

    this.apiService.requestMilestoneRevision(this.revisionModalMilestone.id, this.revisionReason.trim()).subscribe({
      next: (updated) => {
        this.revisionModalMilestone.status = updated.status;
        this.revisionModalMilestone.deliveryNotes = updated.deliveryNotes;
        this.submittingRevision = false;
        this.toastService.info(
          'Revision request sent to provider. Escrow funds remain safely locked until revised deliverables are submitted.',
          'Revision Requested'
        );
        this.revisionModalMilestone = null;
        this.loadContracts();
      },
      error: (err) => {
        this.submittingRevision = false;
        this.toastService.error(err?.error?.message || 'Failed to request revision.');
      }
    });
  }

  releaseFunds(milestone: any): void {
    const fee = (milestone.amount * 0.10).toFixed(2);
    const net = (milestone.amount * 0.90).toFixed(2);
    const promptMsg = `Release escrow payout of ${milestone.amount} ETB to the provider?\n\n- Gross Escrow: ${milestone.amount} ETB\n- 10% Platform Service Fee: ${fee} ETB\n- Net Payout Transferred: ${net} ETB\n\nProceed with release?`;

    if (!confirm(promptMsg)) {
      return;
    }

    this.apiService.releaseMilestone(milestone.id).subscribe({
      next: (updated) => {
        milestone.status = updated.status;
        milestone.releasedAt = updated.releasedAt;
        milestone.platformFeePercent = updated.platformFeePercent;
        milestone.platformFeeAmount = updated.platformFeeAmount;
        milestone.netPayoutAmount = updated.netPayoutAmount;
        this.loadContracts();
      }
    });
  }

  openDisputeModal(contract: any): void {
    this.disputeModalContract = contract;
    this.disputeDetails = '';
  }

  submitDispute(): void {
    if (!this.disputeModalContract || !this.disputeDetails.trim()) return;

    this.apiService.raiseDispute(this.disputeModalContract.id, this.disputeReason, this.disputeDetails).subscribe({
      next: () => {
        this.disputeModalContract.status = 'DISPUTED';
        this.disputeModalContract = null;
        this.toastService.info('Dispute submitted successfully. Our legal arbitration desk will review the milestone evidence.', 'Dispute Opened');
      }
    });
  }
}
