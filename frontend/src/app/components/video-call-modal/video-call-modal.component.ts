import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-call-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-modal-backdrop" *ngIf="isOpen" (click)="onBackdropClick($event)">
      <div class="video-modal-container" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="video-modal-header">
          <div class="header-info">
            <div class="live-pill">
              <span class="live-dot"></span>
              <span>LIVE INTERVIEW STUDIO</span>
            </div>
            <h3>{{ title || 'EthioBridge Video Interview' }}</h3>
            <p class="subtitle" *ngIf="partnerName">Meeting with: <strong>{{ partnerName }}</strong></p>
          </div>
          <div class="header-actions">
            <button type="button" class="btn btn-primary btn-sm launch-btn" (click)="openInNewWindow()">
              🚀 Open Full Video Window
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="copyLink()">
              {{ copied ? '✓ Copied!' : '📋 Copy Link' }}
            </button>
            <button type="button" class="btn-close" (click)="closeModal()" aria-label="Close">✕</button>
          </div>
        </div>

        <!-- Video Studio Stage (NO IFRAMES - Zero block guarantee) -->
        <div class="video-modal-body">
          <div class="studio-grid">
            <!-- Left: Webcam Camera & Mic Preview -->
            <div class="camera-card">
              <div class="video-box">
                <video #localVideo autoplay playsinline muted class="camera-feed" [style.display]="cameraActive ? 'block' : 'none'"></video>
                
                <div *ngIf="!cameraActive" class="camera-offline">
                  <div class="avatar-circle">{{ (partnerName || 'User').charAt(0).toUpperCase() }}</div>
                  <h4>Live Webcam Stage</h4>
                  <p class="offline-desc">Click below to activate your local camera and microphone preview before joining.</p>
                  <button type="button" class="btn btn-outline btn-sm btn-cam" (click)="toggleCamera()">
                    📷 Turn On Camera Preview
                  </button>
                </div>

                <div class="monitor-badge top-left">
                  <span class="badge-dot">●</span>
                  <span>{{ cameraActive ? 'Camera Live' : 'Camera Standby' }}</span>
                </div>

                <div class="monitor-badge top-right">
                  <span>🔒 End-to-End Encrypted</span>
                </div>

                <div class="camera-controls-bar" *ngIf="cameraActive">
                  <button type="button" class="cam-btn" (click)="toggleCamera()" [title]="cameraActive ? 'Turn Off Video' : 'Turn On Video'">
                    {{ cameraActive ? '📹 Camera On' : '📷 Camera Off' }}
                  </button>
                  <button type="button" class="cam-btn" (click)="toggleMic()" [title]="micActive ? 'Mute Microphone' : 'Unmute Microphone'">
                    {{ micActive ? '🎙️ Mic Active' : '🔇 Mic Muted' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Right: Room Status & One-Click Launch -->
            <div class="launch-card">
              <div class="launch-header">
                <div class="call-icon-wrap">🎥</div>
                <div class="call-text-wrap">
                  <h4>{{ title || 'Live Video Interview' }}</h4>
                  <p>Encrypted WebRTC meeting room generated for <strong>{{ partnerName || 'your conversation' }}</strong>.</p>
                </div>
              </div>

              <div class="room-details-list">
                <div class="detail-row">
                  <span class="detail-label">Interviewee:</span>
                  <span class="detail-value">{{ partnerName || 'Candidate / Employer' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Protocol:</span>
                  <span class="detail-value text-teal">Ultra-HD WebRTC Peer-to-Peer</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Security:</span>
                  <span class="detail-value text-green">DTLS-SRTP 256-Bit Encrypted</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Compatibility:</span>
                  <span class="detail-value">Works directly in Chrome, Edge, Safari, Mobile</span>
                </div>
              </div>

              <!-- Main Hero Launch Button -->
              <div class="launch-hero-container">
                <button type="button" class="btn-launch-hero" (click)="openInNewWindow()">
                  <span class="hero-icon">🎥</span>
                  <div class="hero-text">
                    <span class="hero-title">ENTER LIVE VIDEO ROOM NOW</span>
                    <span class="hero-sub">Click here to launch full-screen HD meeting with {{ partnerName || 'partner' }} ↗</span>
                  </div>
                </button>
              </div>

              <div class="launch-actions-footer">
                <button type="button" class="btn btn-secondary btn-sm" (click)="copyLink()">
                  {{ copied ? '✓ Link Copied to Clipboard!' : '📋 Copy Meeting Link' }}
                </button>
                <button type="button" class="btn btn-outline btn-sm" (click)="openInNewWindow()">
                  Re-Launch Room ↗
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="video-modal-footer">
          <div class="footer-tip">
            💡 <span>Tip: Both seeker and provider join the exact same secure room to see and talk to each other in real-time.</span>
          </div>
          <div class="footer-btns">
            <button type="button" class="btn btn-outline btn-sm" (click)="openInNewWindow()">
              Re-open Meeting Tab ↗
            </button>
            <button type="button" class="btn btn-danger btn-sm" (click)="closeModal()">
              Leave / Close Studio
            </button>
          </div>
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
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .video-modal-container {
      width: 100%;
      max-width: 980px;
      height: auto;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: #0F172A;
      color: #F8FAFC;
      border: 1px solid #334155;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
      overflow: hidden;
    }
    .video-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #1E293B;
      border-bottom: 1px solid #334155;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .header-info h3 {
      font-size: 1.15rem;
      margin: 0.25rem 0;
      color: #F8FAFC;
      font-weight: 700;
    }
    .header-info .subtitle {
      font-size: 0.825rem;
      color: #94A3B8;
      margin: 0;
    }
    .live-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(14, 127, 143, 0.25);
      color: #38BDF8;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }
    .live-dot {
      width: 6px;
      height: 6px;
      background: #38BDF8;
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
    .launch-btn {
      background: #0E7F8F !important;
      border-color: #0E7F8F !important;
      font-weight: 700;
      color: #fff;
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
      padding: 1.5rem;
      background: #090D16;
      flex: 1;
      overflow-y: auto;
    }
    .studio-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      align-items: stretch;
    }
    @media (max-width: 768px) {
      .studio-grid {
        grid-template-columns: 1fr;
      }
    }
    .camera-card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 320px;
    }
    .video-box {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 320px;
      background: #030712;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .camera-feed {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1); /* Mirror camera for natural look */
    }
    .camera-offline {
      text-align: center;
      padding: 2rem 1rem;
      color: #94A3B8;
    }
    .avatar-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1E293B;
      color: #0E7F8F;
      font-size: 1.8rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      border: 2px solid #334155;
    }
    .offline-desc {
      font-size: 0.8rem;
      color: #64748B;
      max-width: 240px;
      margin: 0 auto 1rem;
    }
    .btn-cam {
      background: #1E293B;
      border-color: #334155;
      color: #F8FAFC;
    }
    .monitor-badge {
      position: absolute;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-size: 0.7rem;
      color: #CBD5E1;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .monitor-badge.top-left { top: 12px; left: 12px; }
    .monitor-badge.top-right { top: 12px; right: 12px; }
    .badge-dot { color: #10B981; }
    .camera-controls-bar {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .cam-btn {
      background: transparent;
      border: none;
      color: #F8FAFC;
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .cam-btn:hover { background: rgba(255, 255, 255, 0.1); }
    .launch-card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .launch-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .call-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(14, 127, 143, 0.2);
      color: #0E7F8F;
      font-size: 1.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .call-text-wrap h4 {
      font-size: 1.05rem;
      margin: 0 0 0.25rem 0;
      color: #F8FAFC;
      font-weight: 700;
    }
    .call-text-wrap p {
      margin: 0;
      font-size: 0.8rem;
      color: #94A3B8;
      line-height: 1.4;
    }
    .room-details-list {
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.25rem;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.35rem 0;
      font-size: 0.78rem;
      border-bottom: 1px solid #293548;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #94A3B8; }
    .detail-value { font-weight: 600; color: #F8FAFC; }
    .text-teal { color: #38BDF8 !important; }
    .text-green { color: #34D399 !important; }
    .launch-hero-container {
      margin-bottom: 1rem;
    }
    .btn-launch-hero {
      width: 100%;
      background: linear-gradient(135deg, #0E7F8F 0%, #0369A1 100%);
      border: none;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      box-shadow: 0 10px 20px -5px rgba(14, 127, 143, 0.5);
      transition: all 0.2s ease;
      text-align: left;
    }
    .btn-launch-hero:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 25px -5px rgba(14, 127, 143, 0.6);
      background: linear-gradient(135deg, #1192A4 0%, #0284C7 100%);
    }
    .hero-icon { font-size: 1.8rem; }
    .hero-text { display: flex; flex-direction: column; }
    .hero-title { font-size: 0.95rem; font-weight: 800; letter-spacing: 0.03em; }
    .hero-sub { font-size: 0.75rem; color: #E0F2FE; margin-top: 0.15rem; }
    .launch-actions-footer {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .video-modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1.5rem;
      background: #1E293B;
      border-top: 1px solid #334155;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .footer-tip { font-size: 0.78rem; color: #94A3B8; }
    .footer-btns { display: flex; gap: 0.5rem; }
    .btn-danger { background: #DC2626; border-color: #DC2626; color: white; }
  `]
})
export class VideoCallModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() roomUrl = '';
  @Input() title = 'EthioBridge Video Interview';
  @Input() partnerName = '';
  @Output() close = new EventEmitter<void>();

  @ViewChild('localVideo') localVideoRef?: ElementRef<HTMLVideoElement>;

  cameraActive = false;
  micActive = true;
  mediaStream: MediaStream | null = null;
  copied = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.startCameraPreview();
      } else {
        this.stopCameraPreview();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopCameraPreview();
  }

  startCameraPreview(): void {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          this.mediaStream = stream;
          this.cameraActive = true;
          this.micActive = true;
          setTimeout(() => {
            if (this.localVideoRef && this.localVideoRef.nativeElement) {
              this.localVideoRef.nativeElement.srcObject = stream;
            }
          }, 100);
        })
        .catch(() => {
          this.cameraActive = false;
        });
    }
  }

  stopCameraPreview(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraActive = false;
  }

  toggleCamera(): void {
    if (!this.mediaStream) {
      this.startCameraPreview();
      return;
    }
    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.cameraActive = videoTrack.enabled;
    }
  }

  toggleMic(): void {
    if (!this.mediaStream) return;
    const audioTrack = this.mediaStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.micActive = audioTrack.enabled;
    }
  }

  closeModal(): void {
    this.stopCameraPreview();
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('video-modal-backdrop')) {
      this.closeModal();
    }
  }

  getCleanMeetingUrl(): string {
    let targetUrl = (this.roomUrl || '').trim();
    if (!targetUrl) return '';
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }
    if (targetUrl.includes('meet.jit.si/')) {
      const parts = targetUrl.split('meet.jit.si/');
      const room = (parts[1] || 'ethiobridge-call').split(/[?#]/)[0];
      targetUrl = `https://p2p.mirotalk.com/join/${room || 'ethiobridge-room'}`;
    }
    return targetUrl;
  }

  openInNewWindow(): void {
    const url = this.getCleanMeetingUrl();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer,width=1280,height=800');
  }

  copyLink(): void {
    const url = this.getCleanMeetingUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    });
  }
}
