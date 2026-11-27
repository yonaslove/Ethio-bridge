import { VideoCallModalComponent } from '../../components/video-call-modal/video-call-modal.component';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, VideoCallModalComponent],
  template: `
    <div class="container messages-page">
      <div class="messages-header">
        <div>
          <h2>{{ i18n.t('messages.inbox') }}</h2>
          <p class="subtitle">{{ i18n.translate('Direct, end-to-end messaging between talent seekers and verified professionals in Ethiopia.', 'በኢትዮጵያ ውስጥ ባሉ አሰሪዎች እና በተረጋገጡ ባለሙያዎች መካከል የሚደረግ ቀጥተኛ መልዕክት።') }}</p>
        </div>
      </div>

      <div class="messaging-card">
        <!-- Thread Sidebar -->
        <aside class="threads-sidebar">
          <div class="threads-header">
            <h4>{{ i18n.translate('Conversations', 'የውይይት መዝገብ') }} ({{ threads.length }})</h4>
            <button type="button" class="btn btn-primary btn-xs" (click)="showNewChatModal = true" title="New Message by Email">
              + New Chat
            </button>
          </div>
          <div *ngIf="loadingThreads" class="loading-state">{{ i18n.translate('Loading chats...', 'መልዕክቶችን በመጫን ላይ...') }}</div>
          <div *ngIf="!loadingThreads && threads.length === 0" class="empty-threads">
            <p>{{ i18n.translate('No active conversations yet.', 'እስካሁን ምንም ንቁ ውይይት የለም።') }}</p>
            <small>{{ i18n.translate('Browse listings or candidate profiles to initiate a message thread.', 'መልዕክት ለመጀመር ስራዎችን ወይም የባለሙያዎችን መገለጫ ያስሱ።') }}</small>
          </div>

          <div class="thread-list">
            <div *ngFor="let t of threads"
                 class="thread-item"
                 [class.active]="selectedThread?.id === t.id"
                 (click)="selectThread(t)">
              <div class="avatar-col">
                <div class="avatar">{{ t.otherUserName.charAt(0).toUpperCase() }}</div>
              </div>
              <div class="info-col">
                <div class="name-row">
                  <span class="user-name">
                    {{ t.otherUserName }}
                    <span *ngIf="t.otherUserVerified" class="verified-badge" [title]="i18n.translate('Verified by National ID', 'በብሔራዊ መታወቂያ የተረጋገጠ')">✓</span>
                  </span>
                  <span class="time-meta">{{ t.lastMessageAt | date:'shortTime' }}</span>
                </div>
                <div class="subject-line">{{ t.subject }}</div>
                <div class="preview-line">{{ t.lastMessageContent || i18n.translate('No messages yet', 'ምንም መልዕክት የለም') }}</div>
              </div>
              <div *ngIf="t.unreadCount > 0" class="unread-badge">{{ t.unreadCount }}</div>
            </div>
          </div>
        </aside>

        <!-- Chat Conversation Area -->
        <main class="chat-main">
          <ng-container *ngIf="selectedThread; else noThreadSelected">
            <div class="chat-header">
              <div class="chat-partner">
                <div class="avatar-lg">{{ selectedThread.otherUserName.charAt(0).toUpperCase() }}</div>
                <div>
                  <h3>
                    {{ selectedThread.otherUserName }}
                    <span *ngIf="selectedThread.otherUserVerified" class="verified-tag">{{ i18n.translate('✓ Verified Ethiopian Talent', '✓ የተረጋገጠ የኢትዮጵያ ባለሙያ') }}</span>
                  </h3>
                  <p class="chat-subject">{{ selectedThread.subject }}</p>
                </div>
              </div>
              <div class="chat-actions">
                <button
                  type="button"
                  (click)="startVideoInterview()"
                  class="btn btn-secondary btn-sm"
                  style="display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; background: #0E7F8F; border-color: #0E7F8F; color: #fff;">
                  🎥 {{ i18n.translate('Video Interview', 'የቪዲዮ ቃለ-መጠይቅ') }}
                </button>
                <a *ngIf="selectedThread.listingId" [routerLink]="['/listings', selectedThread.listingId]" class="btn btn-outline btn-sm">
                  {{ i18n.translate('View Associated Listing', 'የተያያዘውን ስራ ይመልከቱ') }}
                </a>
                <button
                  type="button"
                  (click)="openOfferModal()"
                  class="btn btn-primary btn-sm"
                  style="display: inline-flex; align-items: center; gap: 0.35rem;">
                  📄 {{ i18n.translate('Send Job Offer / Contract', 'የስራ ውል ላክ') }}
                </button>
                <a [routerLink]="['/contracts']" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                  💳 {{ i18n.translate('Escrow Contracts', 'የእስክሮው ውሎች') }}
                </a>
                <button
                  type="button"
                  (click)="openReportModal()"
                  class="btn btn-outline btn-sm"
                  style="display: inline-flex; align-items: center; gap: 0.35rem; color: #DC2626; border-color: rgba(220, 38, 38, 0.35);"
                  [title]="i18n.translate('Report participant for scam, fraud, or violations', 'ተጠቃሚውን ሪፖርት ያድርጉ')">
                  🚩 {{ i18n.translate('Report User', 'ሪፖርት') }}
                </button>
              </div>
            </div>

            <!-- Messages Stream -->
            <div class="messages-stream" #scrollContainer>
              <div *ngFor="let m of messages"
                   class="message-bubble-wrapper"
                   [class.outgoing]="isMyMessage(m)">
                <div class="message-bubble" [class.bubble-out]="isMyMessage(m)">
                  <!-- Contract Offer Interactive Card -->
                  <div *ngIf="isContractOffer(m)" class="contract-offer-card">
                    <div class="offer-card-header">
                      <span class="offer-badge">📜 {{ i18n.translate('Official Escrow Job Offer', 'ይፋዊ የእስክሮው ስራ ውል') }}</span>
                      <span class="offer-amount">{{ getOfferData(m)?.amount | number:'1.2-2' }} ETB</span>
                    </div>
                    <h4 class="offer-title">{{ getOfferData(m)?.title }}</h4>
                    <p class="offer-desc">{{ getOfferPlainContent(m) }}</p>
                    <div class="offer-actions">
                      <a routerLink="/contracts" class="btn btn-primary btn-sm">
                        💳 {{ i18n.translate('View & Fund via Chapa', 'በቻፓ ይመልከቱ እና ይክፈሉ') }}
                      </a>
                    </div>
                  </div>

                  <!-- Video Call Interactive Card -->
                  <div *ngIf="isVideoInvite(m)" class="video-call-card">
                    <div class="video-card-top">
                      <span class="video-card-badge">🎥 {{ i18n.translate('Live 1-on-1 Video Interview', 'የቀጥታ ቪዲዮ ቃለ-መጠይቅ') }}</span>
                      <span class="video-status-dot">● READY</span>
                    </div>
                    <p class="video-card-text">
                      {{ isMyMessage(m) ? i18n.translate('You started a video interview. Candidate can join below.', 'የቪዲዮ ቃለ-መጠይቅ ጀምረዋል። እጩው ከታች መቀላቀል ይችላል።') : i18n.translate('The employer started a video interview session for you.', 'አሰሪው የቪዲዮ ቃለ-መጠይቅ ጀምሮልዎታል።') }}
                    </p>
                    <button type="button"
                            (click)="openVideoRoom(extractMeetingUrl(m.content))"
                            class="btn-join-call">
                      🎥 {{ i18n.translate('Enter Video Interview Room', 'ወደ ቪዲዮ ቃለ-መጠይቁ ግባ') }}
                    </button>
                  </div>

                  <div *ngIf="!isContractOffer(m) && !isVideoInvite(m)" class="bubble-content">{{ m.content }}</div>
                  <div class="bubble-meta">
                    <span>{{ m.createdAt | date:'shortTime' }}</span>
                    <span *ngIf="isMyMessage(m)" class="read-status" [title]="(m.read || m.isRead) ? 'Read' : 'Delivered'">
                      {{ (m.read || m.isRead) ? '✓✓' : '✓' }}
                    </span>
                  </div>
                </div>
              </div>
              <div #messagesEnd></div>
            </div>

            <!-- Floating Jump to Latest Button -->
            <button
              *ngIf="messages.length > 3"
              type="button"
              (click)="scrollToBottom()"
              class="btn-jump-bottom"
              [title]="i18n.translate('Scroll to latest message', 'ወደ መጨረሻው መልዕክት ውረድ')">
              ↓ {{ i18n.translate('Latest Message', 'የቅርብ መልዕክት') }}
            </button>

            <!-- Composer -->
            <form class="chat-composer" (ngSubmit)="sendCurrentMessage()">
              <input type="text"
                     [(ngModel)]="newMessageText"
                     name="messageText"
                     [placeholder]="i18n.t('messages.typePlaceholder')"
                     class="form-control message-input"
                     [disabled]="sending"
                     autocomplete="off" />
              <button type="submit" class="btn btn-primary" [disabled]="!newMessageText.trim() || sending">
                {{ sending ? i18n.translate('Sending...', 'በመላክ ላይ...') : i18n.t('messages.send') }}
              </button>
            </form>
          </ng-container>

          <ng-template #noThreadSelected>
            <div class="no-selection">
              <div class="empty-icon">💬</div>
              <h3>{{ i18n.translate('Select a Conversation', 'ውይይት ይምረጡ') }}</h3>
              <p>{{ i18n.translate('Choose an ongoing thread from the sidebar or contact a provider from their listing application.', 'ከግራ በኩል ካለው ዝርዝር ውስጥ ውይይት ይምረጡ ወይም ከማመልከቻው ላይ ባለሙያውን ያነጋግሩ።') }}</p>
            </div>
          </ng-template>
        </main>
      </div>

      <!-- Send Job Offer / Contract Modal -->
      <div *ngIf="showOfferModal" class="modal-backdrop">
        <div class="offer-modal-card">
          <div class="modal-header">
            <h3>📄 {{ i18n.translate('Create & Send Escrow Contract Offer', 'የእስክሮው ስራ ውል ይፍጠሩ እና ይላኩ') }}</h3>
            <button type="button" class="btn-close" (click)="closeOfferModal()">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-sub">
              {{ i18n.translate('Send a formal escrow-backed agreement to ' + (selectedThread?.otherUserName || 'candidate') + '. Once agreed, funds are held securely under Ethiopian escrow rails.', 'ለ' + (selectedThread?.otherUserName || 'ባለሙያው') + ' ይፋዊ የእስክሮው ስምምነት ይላኩ። ገንዘቡ በእስክሮው የተጠበቀ ነው።') }}
            </p>

            <div class="form-group" style="margin-bottom: 0.75rem;">
              <label style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem;">
                {{ i18n.translate('Contract / Job Title', 'የስራው ርዕስ') }} *
              </label>
              <input type="text" [(ngModel)]="offerForm.title" class="form-control" placeholder="e.g. Mobile Application Development" />
            </div>

            <div class="form-group" style="margin-bottom: 0.75rem;">
              <label style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem;">
                {{ i18n.translate('Total Contract Amount (ETB)', 'አጠቃላይ ክፍያ (በብር)') }} *
              </label>
              <input type="number" [(ngModel)]="offerForm.totalAmount" class="form-control" placeholder="e.g. 5000" min="50" />
            </div>

            <div class="form-group" style="margin-bottom: 0.75rem;">
              <label style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem;">
                {{ i18n.translate('Initial Milestone Title', 'የመጀመሪያው ምዕራፍ ርዕስ') }}
              </label>
              <input type="text" [(ngModel)]="offerForm.milestoneTitle" class="form-control" placeholder="e.g. Milestone 1: Core Setup & Prototype" />
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
              <label style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem;">
                {{ i18n.translate('Terms of Engagement & Deliverables', 'የስራው ዝርዝር እና መስፈርቶች') }}
              </label>
              <textarea [(ngModel)]="offerForm.terms" class="form-control" rows="3" placeholder="Outline specific deliverables, milestones, and expected deadline..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeOfferModal()">
              {{ i18n.translate('Cancel', 'ይቅር') }}
            </button>
            <button type="button" class="btn btn-primary" (click)="submitOffer()" [disabled]="submittingOffer || !offerForm.title.trim() || !offerForm.totalAmount">
              {{ submittingOffer ? i18n.translate('Sending Offer...', 'በመላክ ላይ...') : i18n.translate('Send Official Contract Offer', 'ይፋዊ ውል ላክ') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Start New Chat with Registered User Modal -->
      <div class="modal-backdrop" *ngIf="showNewChatModal" (click)="showNewChatModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">✉️</span>
              <div>
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #1E293B;">
                  {{ i18n.translate('New Conversation by Email', 'በኢሜይል አዲስ ውይይት ይጀምሩ') }}
                </h3>
                <small style="color: #64748B;">Direct end-to-end messaging</small>
              </div>
            </div>
            <button type="button" class="btn-close" (click)="showNewChatModal = false">✕</button>
          </div>

          <div class="modal-body">
            <p class="modal-intro">
              {{ i18n.translate('Enter the email address of any registered client, freelancer, or provider on EthioBridge to start an instant direct message thread.', 'የማንኛውንም የተመዘገበ ተጠቃሚ ኢሜይል በማስገባት ወዲያውኑ ውይይት ይጀምሩ።') }}
            </p>

            <div class="form-group" style="margin-bottom: 1.15rem;">
              <label class="modal-label">
                {{ i18n.translate('Recipient Email Address', 'የተቀባዩ ኢሜይል አድራሻ') }}
                <span style="color: #EF4444;">*</span>
              </label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  type="email"
                  [(ngModel)]="newChatEmail"
                  placeholder="e.g. provider1@ethiobridge.et or yonas@gmail.com"
                  class="modal-input"
                  [disabled]="startingNewChat" />
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="modal-label">
                {{ i18n.translate('Conversation Topic / Subject', 'የውይይቱ ርዕስ') }}
              </label>
              <div class="input-wrapper">
                <span class="input-icon">💬</span>
                <input
                  type="text"
                  [(ngModel)]="newChatSubject"
                  placeholder="e.g. Project Inquiry & Technical Discussion"
                  class="modal-input"
                  [disabled]="startingNewChat" />
              </div>
            </div>

            <div *ngIf="newChatError" class="modal-alert-error">
              <span style="font-size: 1.1rem; flex-shrink: 0;">⚠️</span>
              <span>{{ newChatError }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showNewChatModal = false" [disabled]="startingNewChat">
              {{ i18n.translate('Cancel', 'ይቅር') }}
            </button>
            <button type="button" class="btn btn-primary" (click)="startChatByEmail()" [disabled]="startingNewChat || !newChatEmail.trim()">
              {{ startingNewChat ? 'Connecting...' : 'Start Chat' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Report User & Safety Modal -->
      <div class="modal-backdrop" *ngIf="showReportModal" (click)="closeReportModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">🚩</span>
              <div>
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #DC2626;">
                  {{ i18n.translate('Report User to Trust & Safety', 'ተጠቃሚውን ለደህንነት ቡድን ሪፖርት ያድርጉ') }}
                </h3>
                <small style="color: #64748B;">
                  {{ i18n.translate('Reporting:', 'ሪፖርት የሚደረገው:') }} <strong>{{ selectedThread?.otherUserName }}</strong>
                </small>
              </div>
            </div>
            <button type="button" class="btn-close" (click)="closeReportModal()">✕</button>
          </div>

          <div class="modal-body">
            <p class="modal-intro">
              {{ i18n.translate('If this participant requested offline payments (direct CBE/Telebirr), asked for upfront fees, shared outside contact info, or engaged in harassment, report them below for administrative investigation.', 'ይህ ተጠቃሚ ከስርዓቱ ውጭ ቀጥታ ክፍያ (CBE/ቴሌብር) ከጠየቀ፣ የቅድመ ክፍያ ከጠየቀ፣ ወይም ተገቢ ያልሆነ ባህሪ ካሳየ እባክዎ እዚህ ሪፖርት ያድርጉ።') }}
            </p>

            <div class="form-group" style="margin-bottom: 1.15rem;">
              <label class="modal-label">{{ i18n.translate('Violation Reason', 'የጥሰት ምክንያት') }} <span style="color: #EF4444;">*</span></label>
              <select [(ngModel)]="reportReason" class="modal-input">
                <option value="ESCROW_EVASION">🏦 Escrow Evasion (Asking for direct CBE/Telebirr)</option>
                <option value="UPFRONT_FEE">💸 Upfront Fee Scam (Deposit or registration fee requested)</option>
                <option value="CONTACT_LEAK">📱 Soliciting Contact Outside Platform (Telegram/WhatsApp)</option>
                <option value="HARASSMENT">🛑 Harassment, Abuse, or Threats</option>
                <option value="SCAM_OR_FRAUD">⚠️ Fraudulent Offer or Fake Job</option>
                <option value="OTHER">ℹ️ Other Policy Violation</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="modal-label">{{ i18n.translate('Details and Evidence *', 'ዝርዝር ማብራሪያ እና ማስረጃ *') }}</label>
              <textarea
                [(ngModel)]="reportDetails"
                rows="3"
                class="modal-input"
                style="resize: vertical; min-height: 80px;"
                [placeholder]="i18n.translate('Provide details or quote the violating message...', 'የተፈጸመውን ጥሰት ወይም የተላከውን መልእክት እዚህ ይጥቀሱ...')"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeReportModal()" [disabled]="submittingReport">
              {{ i18n.translate('Cancel', 'ይቅር') }}
            </button>
            <button type="button" class="btn btn-danger" (click)="submitReport()" [disabled]="submittingReport || !reportDetails.trim()">
              {{ submittingReport ? i18n.translate('Submitting...', 'በማስገባት ላይ...') : i18n.translate('Submit Report', 'ሪፖርት አስገባ') }}
            </button>
          </div>
        </div>
      </div>

      <!-- In-App Live Video Interview Modal -->
      <app-video-call-modal
        [isOpen]="showVideoModal"
        [roomUrl]="videoRoomUrl"
        [title]="videoTitle"
        [partnerName]="selectedThread?.otherUserName || ''"
        (close)="showVideoModal = false">
      </app-video-call-modal>
    </div>
  `,
  styles: [`
    .messages-page {
      height: calc(100vh - 72px);
      max-height: calc(100vh - 72px);
      padding: 0.75rem 1.25rem 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      overflow: hidden;
    }
    .messages-header {
      margin-bottom: 0.5rem;
      flex-shrink: 0;
    }
    .messages-header h2 {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--color-charcoal);
      margin: 0;
    }
    .subtitle {
      color: var(--color-slate);
      font-size: 0.785rem;
      margin-top: 0.15rem;
      margin-bottom: 0;
    }
    .messaging-card {
      display: grid;
      grid-template-columns: 320px 1fr;
      flex: 1 1 0;
      min-height: 0;
      height: 100%;
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(65, 63, 61, 0.06);
    }
    .threads-sidebar {
      background: var(--color-surface-subtle);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }
    .threads-header {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .threads-header h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-charcoal);
      margin: 0;
    }
    .thread-list {
      flex: 1 1 0;
      min-height: 0;
      overflow-y: auto;
    }
    .thread-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgba(216, 207, 208, 0.4);
      cursor: pointer;
      position: relative;
      transition: background 0.15s ease;
    }
    .thread-item:hover {
      background: rgba(28, 184, 205, 0.05);
    }
    .thread-item.active {
      background: rgba(28, 184, 205, 0.12);
      border-left: 4px solid var(--color-cyan);
    }
    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--color-charcoal);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .info-col {
      flex: 1;
      min-width: 0;
    }
    .name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.2rem;
    }
    .user-name {
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--color-charcoal);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .verified-badge {
      background: #1CB8CD;
      color: #fff;
      font-size: 0.6875rem;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .time-meta {
      font-size: 0.75rem;
      color: var(--color-slate);
    }
    .subject-line {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-cyan);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .preview-line {
      font-size: 0.8125rem;
      color: var(--color-slate);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .unread-badge {
      background: #D32F2F;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 10px;
      padding: 0.15rem 0.45rem;
    }
    .chat-main {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      background: #fff;
      position: relative;
    }
    .chat-header {
      padding: 0.65rem 1.25rem;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafaf9;
      flex-shrink: 0;
      gap: 1rem;
    }
    .chat-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .chat-partner {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .avatar-lg {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--color-slate);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
    }
    .chat-partner h3 {
      font-size: 1.125rem;
      font-weight: 800;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .verified-tag {
      background: rgba(28, 184, 205, 0.15);
      color: #0E7F8F;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 12px;
      letter-spacing: 0.02em;
    }
    .chat-subject {
      font-size: 0.875rem;
      color: var(--color-slate);
      margin: 0;
    }
    .messages-stream {
      flex: 1 1 0;
      min-height: 0;
      padding: 1rem 1.25rem;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      background: #FDFDFD;
      scroll-behavior: smooth;
    }
    .message-bubble-wrapper {
      display: flex;
      justify-content: flex-start;
    }
    .message-bubble-wrapper.outgoing {
      justify-content: flex-end;
    }
    .message-bubble {
      max-width: 65%;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      color: var(--color-charcoal);
    }
    .bubble-out {
      background: var(--color-cyan);
      color: #FFFFFF;
      border: none;
    }
    .bubble-content {
      font-size: 0.9375rem;
      line-height: 1.5;
      word-break: break-word;
    }
    .bubble-meta {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
      font-size: 0.75rem;
      margin-top: 0.35rem;
      opacity: 0.85;
    }
    .chat-composer {
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: 0.75rem;
      background: #fff;
      flex-shrink: 0;
      align-items: center;
    }
    .btn-jump-bottom {
      position: absolute;
      bottom: 65px;
      right: 25px;
      background: var(--color-charcoal);
      color: #fff;
      border: none;
      border-radius: 20px;
      padding: 0.35rem 0.85rem;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.2s ease;
    }
    .btn-jump-bottom:hover {
      background: var(--color-cyan);
      transform: translateY(-2px);
    }
    .message-input {
      flex: 1;
      height: 44px;
      border-radius: 8px;
    }
    .no-selection {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--color-slate);
      padding: 2rem;
      text-align: center;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .contract-offer-card {
      background: #F0FDF4;
      border: 1px solid #86EFAC;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 0.5rem;
      color: #14532D;
      text-align: left;
    }
    .offer-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .offer-badge {
      font-weight: 700;
      font-size: 0.75rem;
      background: #DCFCE7;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      color: #15803D;
    }
    .offer-amount {
      font-weight: 800;
      font-size: 1.05rem;
      color: #166534;
    }
    .offer-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0 0 0.4rem 0;
      color: #064E3B;
    }
    .video-call-card {
      background: #0F172A;
      color: #F8FAFC;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 0.85rem 1rem;
      margin: 0.35rem 0;
      min-width: 260px;
    }
    .video-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .video-card-badge {
      font-size: 0.8rem;
      font-weight: 700;
      color: #38BDF8;
    }
    .video-status-dot {
      font-size: 0.65rem;
      font-weight: 800;
      color: #10B981;
    }
    .video-card-text {
      font-size: 0.8rem;
      color: #CBD5E1;
      margin: 0 0 0.65rem 0;
      line-height: 1.35;
    }
    .btn-join-call {
      width: 100%;
      background: #0E7F8F;
      color: #FFFFFF;
      border: none;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      transition: background 0.15s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
    }
    .btn-join-call:hover {
      background: #0A6370;
    }
    .offer-desc {
      font-size: 0.85rem;
      color: #1F2937;
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }
    .offer-actions {
      display: flex;
      gap: 0.5rem;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .offer-modal-card {
      background: #FFFFFF;
      border-radius: 14px;
      width: 100%;
      max-width: 520px;
      padding: 1.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
      color: var(--color-charcoal);
    }
    .modal-sub {
      font-size: 0.85rem;
      color: var(--color-slate);
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--color-slate);
    }
    .modal-card {
      background: #FFFFFF;
      border-radius: 14px;
      width: 100%;
      max-width: 440px;
      padding: 1.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(-8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .modal-intro {
      font-size: 0.85rem;
      color: #64748B;
      margin: 0 0 1.25rem 0;
      line-height: 1.45;
    }
    .modal-label {
      display: block;
      font-weight: 700;
      font-size: 0.85rem;
      color: #1E293B;
      margin-bottom: 0.4rem;
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 0.85rem;
      font-size: 1rem;
      pointer-events: none;
      user-select: none;
    }
    .modal-input {
      width: 100%;
      padding: 0.7rem 0.85rem 0.7rem 2.4rem;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #1E293B;
      background: #F8FAFC;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .modal-input:focus {
      outline: none;
      border-color: #0E7F8F;
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(14, 127, 143, 0.15);
    }
    .modal-alert-error {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #FEF2F2;
      border-left: 4px solid #EF4444;
      color: #B91C1C;
      padding: 0.75rem 0.9rem;
      border-radius: 6px;
      font-size: 0.825rem;
      margin-top: 0.75rem;
      line-height: 1.4;
    }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;
  @ViewChild('messagesEnd') private messagesEnd?: ElementRef;

  threads: any[] = [];
  selectedThread: any = null;
  messages: any[] = [];
  newMessageText = '';
  loadingThreads = true;
  sending = false;
  pollInterval: any;
  targetThreadId: string | null = null;
  private routeSub?: Subscription;

  // New Chat Modal state
  showNewChatModal = false;
  newChatEmail = '';
  newChatSubject = '';
  startingNewChat = false;
  newChatError = '';

  // Report Modal state
  showReportModal = false;
  reportReason = 'ESCROW_EVASION';
  reportDetails = '';
  submittingReport = false;

  // Video Interview Modal state
  showVideoModal = false;
  videoRoomUrl = '';
  videoTitle = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public i18n: I18nService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe(params => {
      const threadId = params['threadId'];
      if (threadId) {
        this.targetThreadId = threadId;
        if (this.threads.length > 0) {
          const match = this.threads.find(t => t.id === threadId);
          if (match && (!this.selectedThread || this.selectedThread.id !== match.id)) {
            this.selectThread(match);
          }
        }
      }
    });

    this.loadThreads();

    // Fast 3-second background polling for real-time messaging
    this.pollInterval = setInterval(() => {
      this.refreshThreadsQuietly();
      if (this.selectedThread) {
        this.loadMessages(this.selectedThread.id, false);
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  loadThreads(): void {
    this.apiService.getMyThreads().subscribe({
      next: (data) => {
        this.threads = data || [];
        this.loadingThreads = false;

        if (this.targetThreadId) {
          const match = this.threads.find(t => t.id === this.targetThreadId);
          if (match) {
            this.selectThread(match);
          } else if (this.threads.length > 0 && !this.selectedThread) {
            this.selectThread(this.threads[0]);
          }
        } else if (this.threads.length > 0 && !this.selectedThread) {
          this.selectThread(this.threads[0]);
        }
      },
      error: () => {
        this.loadingThreads = false;
      }
    });
  }

  refreshThreadsQuietly(): void {
    this.apiService.getMyThreads().subscribe({
      next: (data) => {
        this.threads = data || [];
        if (this.targetThreadId && (!this.selectedThread || this.selectedThread.id !== this.targetThreadId)) {
          const match = this.threads.find(t => t.id === this.targetThreadId);
          if (match) this.selectThread(match);
        }
      },
      error: () => {}
    });
  }

  selectThread(thread: any): void {
    this.selectedThread = thread;
    this.messages = [];
    this.loadMessages(thread.id, true, true);
  }

  loadMessages(threadId: string, markRead: boolean, forceScroll: boolean = false): void {
    this.apiService.getThreadMessages(threadId).subscribe({
      next: (msgs) => {
        const prevCount = this.messages.length;
        const newMsgs = msgs || [];
        const countChanged = newMsgs.length !== prevCount || (newMsgs.length > 0 && prevCount === 0);
        this.messages = newMsgs;
        if (markRead && this.selectedThread) {
          this.selectedThread.unreadCount = 0;
        }
        if (forceScroll || countChanged) {
          this.scrollToBottom();
        }
      }
    });
  }

  sendCurrentMessage(): void {
    if (!this.selectedThread || !this.newMessageText.trim() || this.sending) return;

    this.sending = true;
    const content = this.newMessageText.trim();
    this.apiService.sendMessage(this.selectedThread.id, content).subscribe({
      next: (sent) => {
        this.messages.push(sent);
        this.newMessageText = '';
        this.sending = false;
        if (this.selectedThread) {
          this.selectedThread.lastMessageContent = content;
          this.selectedThread.lastMessageAt = new Date().toISOString();
        }
        this.scrollToBottom();
      },
      error: () => {
        this.sending = false;
      }
    });
  }

  scrollToBottom(): void {
    const scrollFn = () => {
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
      if (this.messagesEnd && this.messagesEnd.nativeElement) {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    scrollFn();
    setTimeout(scrollFn, 40);
    setTimeout(scrollFn, 120);
    setTimeout(scrollFn, 300);
  }

  isMyMessage(msg: any): boolean {
    const user = this.authService.currentUser;
    return user ? (msg.senderUserId === user.userId || msg.senderUserId === (user as any).id) : false;
  }

  showOfferModal = false;
  submittingOffer = false;
  offerForm = {
    title: '',
    totalAmount: 1500,
    milestoneTitle: '',
    terms: ''
  };

  openOfferModal(): void {
    if (!this.selectedThread) return;
    this.offerForm = {
      title: `Contract: ${this.selectedThread.subject || 'Direct Service Agreement'}`,
      totalAmount: 2500,
      milestoneTitle: 'Milestone 1: Project Setup & Prototype',
      terms: 'Agreed deliverables and project scope as discussed in chat. Payout is released upon client milestone approval.'
    };
    this.showOfferModal = true;
  }

  closeOfferModal(): void {
    this.showOfferModal = false;
  }

  submitOffer(): void {
    if (!this.selectedThread || !this.offerForm.title.trim() || !this.offerForm.totalAmount || this.submittingOffer) return;

    this.submittingOffer = true;
    const payload = {
      title: this.offerForm.title.trim(),
      totalAmount: this.offerForm.totalAmount,
      terms: this.offerForm.terms,
      milestones: [
        {
          title: this.offerForm.milestoneTitle.trim() || 'Milestone 1: Deliverables',
          description: this.offerForm.terms,
          amount: this.offerForm.totalAmount
        }
      ]
    };

    this.apiService.sendOfferInThread(this.selectedThread.id, payload).subscribe({
      next: (res) => {
        this.submittingOffer = false;
        this.showOfferModal = false;
        if (res?.message) {
          this.messages.push(res.message);
          this.scrollToBottom();
        }
      },
      error: () => {
        this.submittingOffer = false;
      }
    });
  }

  isContractOffer(msg: any): boolean {
    return !!(msg?.content && msg.content.includes('[CONTRACT_OFFER:'));
  }

  getOfferData(msg: any): any {
    try {
      if (!msg?.content) return null;
      const match = msg.content.match(/\[CONTRACT_OFFER:(\{.*?\})\]/);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    } catch {
      return null;
    }
    return null;
  }

  getOfferPlainContent(msg: any): string {
    if (!msg?.content) return '';
    return msg.content.replace(/\[CONTRACT_OFFER:\{.*?\}\]/, '').trim();
  }

  startChatByEmail(): void {
    const email = this.newChatEmail.trim();
    if (!email || this.startingNewChat) return;

    this.startingNewChat = true;
    this.newChatError = '';
    const subject = this.newChatSubject.trim() || 'Direct Inquiry';

    // Step 1: Look up registered user by email to get their user ID (compatible with all backend versions)
    this.apiService.lookupUserByEmail(email).subscribe({
      next: (user) => {
        if (!user || !user.userId) {
          this.startingNewChat = false;
          this.newChatError = `No registered user found with email "${email}". Please verify the address.`;
          return;
        }

        // Step 2: Create thread with recipientUserId and recipientEmail
        this.apiService.createOrGetThread(user.userId, undefined, subject).subscribe({
          next: (thread) => {
            this.startingNewChat = false;
            this.showNewChatModal = false;
            this.newChatEmail = '';
            this.newChatSubject = '';

            // Load and select the thread
            this.loadThreads();
            this.targetThreadId = thread.id;
            this.selectThread(thread);
          },
          error: (threadErr) => {
            this.startingNewChat = false;
            this.newChatError = threadErr?.error?.message || 'Could not start conversation with this user.';
          }
        });
      },
      error: (lookupErr) => {
        // Fallback: Attempt direct thread creation with recipientEmail in case backend is upgraded
        this.apiService.createThreadByEmail(email, subject).subscribe({
          next: (thread) => {
            this.startingNewChat = false;
            this.showNewChatModal = false;
            this.newChatEmail = '';
            this.newChatSubject = '';
            this.loadThreads();
            this.targetThreadId = thread.id;
            this.selectThread(thread);
          },
          error: () => {
            this.startingNewChat = false;
            this.newChatError = lookupErr?.error?.message || `No registered account found with email "${email}". Ensure the user has registered on EthioBridge.`;
          }
        });
      }
    });
  }

  openReportModal(): void {
    if (!this.selectedThread) return;
    this.reportReason = 'ESCROW_EVASION';
    this.reportDetails = '';
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
  }

  submitReport(): void {
    if (!this.selectedThread || !this.reportDetails.trim()) return;
    this.submittingReport = true;
    this.apiService.submitReport({
      reportedUserId: this.selectedThread.otherUserId,
      listingId: this.selectedThread.listingId,
      reason: this.reportReason,
      details: this.reportDetails.trim()
    }).subscribe({
      next: () => {
        this.submittingReport = false;
        this.showReportModal = false;
        this.toastService.success('Participant reported to platform Trust & Safety for review.', 'Report Submitted');
      },
      error: () => {
        this.submittingReport = false;
        this.toastService.error('Could not submit report. Please try again.');
      }
    });
  }

  startVideoInterview(): void {
    if (!this.selectedThread) {
      this.toastService.warning('Please select a conversation thread first.');
      return;
    }

    // Deterministic room name based on thread ID so both parties always join the same live room
    const cleanThreadId = (this.selectedThread.id || 'room').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    this.videoRoomUrl = `https://meet.jit.si/ethiobridge-call-${cleanThreadId}`;
    this.videoTitle = `Live Video Interview: ${this.selectedThread.otherUserName || 'Member'}`;
    this.showVideoModal = true;

    // Send invitation message into thread to notify the provider / other party in real-time
    const inviteMessage = `🎥 [Video Interview Room] I have started our live video interview room. Please click below to join: ${this.videoRoomUrl}`;
    this.apiService.sendMessage(this.selectedThread.id, inviteMessage).subscribe({
      next: (m) => {
        this.messages.push(m);
        this.scrollToBottom();
        this.toastService.success(`Interview invitation sent to ${this.selectedThread.otherUserName}`, 'Video Room Started');
      },
      error: () => {
        // Even if chat notification fails to dispatch, room is still open for the user
      }
    });
  }

  openVideoRoom(url: string): void {
    if (!url) return;
    this.videoRoomUrl = url;
    this.videoTitle = `Live Video Interview: ${this.selectedThread?.otherUserName || 'Member'}`;
    this.showVideoModal = true;
  }

  isVideoInvite(m: any): boolean {
    if (!m || !m.content) return false;
    return m.content.includes('[Video Interview Room]') || m.content.includes('meet.jit.si');
  }

  extractMeetingUrl(content: string): string {
    if (!content) return '';
    const match = content.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : '';
  }
}
