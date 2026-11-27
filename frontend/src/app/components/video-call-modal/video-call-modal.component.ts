import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-call-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-modal-backdrop" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="video-modal-container card" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="video-modal-header">
          <div class="header-info">
            <div class="live-pill">
              <span class="live-dot"></span>
              <span>LIVE VIDEO ROOM</span>
            </div>
            <h3>{{ title || 'EthioBridge Video Interview' }}</h3>
            <p class="subtitle" *ngIf="partnerName">Meeting with: <strong>{{ partnerName }}</strong></p>
          </div>
          <div class="header-actions">
            <button type="button" class="btn btn-secondary btn-sm" (click)="copyLink()">
              {{ copied ? '✓ Copied!' : '📋 Copy Link' }}
            </button>
            <button type="button" class="btn-close" (click)="closeModal()" aria-label="Close">✕</button>
          </div>
        </div>

        <!-- Video Iframe Body -->
        <div class="video-modal-body">
          <div *ngIf="loading" class="video-loading-placeholder">
            <div class="spinner"></div>
            <p>Connecting to secure encrypted meeting room...</p>
          </div>
          <iframe
            *ngIf="safeUrl"
            [src]="safeUrl"
            allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
            allowfullscreen
            (load)="loading = false"
            class="video-iframe">
          </iframe>
        </div>

        <!-- Modal Footer -->
        <div class="video-modal-footer">
          <div class="footer-tip">
            💡 <span>Ensure your browser allows <strong>Camera & Microphone</strong> permissions. You can also share your screen and chat directly in the meeting.</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm" (click)="closeModal()">
            End / Leave Call
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .video-modal-container {
      width: 100%;
      max-width: 960px;
      height: 88vh;
      max-height: 720px;
      display: flex;
      flex-direction: column;
      background: #0F172A;
      color: #F8FAFC;
      border: 1px solid #334155;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      padding: 0;
    }
    .video-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.9rem 1.25rem;
      background: #1E293B;
      border-bottom: 1px solid #334155;
    }
    .header-info h3 {
      font-size: 1.1rem;
      margin: 0.2rem 0;
      color: #F8FAFC;
    }
    .header-info .subtitle {
      font-size: 0.8rem;
      color: #94A3B8;
      margin: 0;
    }
    .live-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(220, 38, 38, 0.2);
      color: #EF4444;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      border: 1px solid rgba(220, 38, 38, 0.4);
    }
    .live-dot {
      width: 6px;
      height: 6px;
      background: #EF4444;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .btn-close {
      background: transparent;
      border: 1px solid #475569;
      color: #94A3B8;
      border-radius: 6px;
      padding: 0.25rem 0.6rem;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-close:hover {
      background: #DC2626;
      color: white;
      border-color: #DC2626;
    }
    .video-modal-body {
      flex: 1;
      position: relative;
      background: #090D16;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .video-loading-placeholder {
      position: absolute;
      text-align: center;
      color: #94A3B8;
      font-size: 0.9rem;
    }
    .spinner {
      width: 36px;
      height: 36px;
      margin: 0 auto 0.75rem;
      border: 3px solid #334155;
      border-top-color: #0E7F8F;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .video-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: #090D16;
    }
    .video-modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
      background: #1E293B;
      border-top: 1px solid #334155;
    }
    .footer-tip {
      font-size: 0.78rem;
      color: #94A3B8;
    }
    .footer-tip strong {
      color: #E2E8F0;
    }
  `]
})
export class VideoCallModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() roomUrl = '';
  @Input() title = 'EthioBridge Video Interview';
  @Input() partnerName = '';
  @Output() close = new EventEmitter<void>();

  safeUrl: SafeResourceUrl | null = null;
  loading = true;
  copied = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roomUrl'] || changes['isOpen']) {
      if (this.isOpen && this.roomUrl) {
        this.loading = true;
        // Jitsi config parameters to streamline interview experience
        let fullUrl = this.roomUrl;
        if (fullUrl.includes('meet.jit.si') && !fullUrl.includes('#config.')) {
          fullUrl += '#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false';
        }
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
      } else {
        this.safeUrl = null;
      }
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    // Only close if clicked directly on backdrop
    if ((event.target as HTMLElement).classList.contains('video-modal-backdrop')) {
      this.closeModal();
    }
  }

  copyLink(): void {
    if (!this.roomUrl) return;
    navigator.clipboard.writeText(this.roomUrl).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    });
  }
}
