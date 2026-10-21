import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="legal-page-container container">
      <div class="legal-header">
        <span class="badge badge-service">Data Protection & Privacy</span>
        <h1>Privacy Policy & Compliance</h1>
        <p class="effective-date">Aligned with the Ethiopian Personal Data Protection Proclamations | Version 2.0</p>
      </div>

      <div class="legal-card">
        <!-- Self-Service Data Export Action for Logged in Users -->
        <div class="export-banner" *ngIf="authService.currentUser$ | async as user">
          <div class="export-info">
            <h4>Your Data Rights (Article 24 Compliance)</h4>
            <p>You have the right to request a complete, machine-readable JSON copy of all personal records, listings, applications, and transactions associated with your account.</p>
          </div>
          <button (click)="exportUserData()" [disabled]="exporting" class="btn btn-primary btn-sm">
            {{ exporting ? 'Generating Archive...' : 'Download My Data Archive (.json)' }}
          </button>
        </div>

        <div class="privacy-sections">
          <section>
            <h2>1. Information We Collect</h2>
            <p>To provide marketplace matching, identity verification, and escrow services, we collect:</p>
            <ul>
              <li><strong>Account Credentials:</strong> Full name, verified email address, phone number, and hashed authentication secrets.</li>
              <li><strong>Professional Profiles:</strong> Resume details, educational history, skill self-assessments, hourly rate, portfolio links, and regional availability.</li>
              <li><strong>Verification Credentials:</strong> Encrypted Fayda National ID (FAN), Kebele ID copies, or Ethiopian Passport numbers. These are stored using AES-256 encryption and accessible only by accredited moderation officers.</li>
              <li><strong>Financial Transactions:</strong> Telebirr and CBE transaction references, milestone escrow amounts, and payout release records.</li>
            </ul>
          </section>

          <section>
            <h2>2. Purpose of Processing & AI Matching</h2>
            <p>Your data is processed strictly for legitimate operational purposes:</p>
            <ul>
              <li>Matching candidate capabilities with employer requirements via semantic Sentence-BERT and TF-IDF pipelines.</li>
              <li>Preventing fraudulent listings, multi-accounting, and payment chargeback scams.</li>
              <li>Facilitating secure encrypted communication between seekers and candidates.</li>
              <li>Generating transparency metrics and bias parity reports across Ethiopian administrative regions.</li>
            </ul>
          </section>

          <section>
            <h2>3. Fayda National ID Security</h2>
            <p>
              EthioBridge is committed to national digital trust initiatives. National ID (Fayda) details are never
              sold, transferred to unauthorized third parties, or indexed in search engines. Once verified, physical document
              previews are sealed in secure cold storage.
            </p>
          </section>

          <section>
            <h2>4. Your Statutory Rights</h2>
            <p>Under applicable Ethiopian Data Protection laws, you maintain full control over your information:</p>
            <ul>
              <li><strong>Right of Access:</strong> Review all personal information held about you via your dashboard.</li>
              <li><strong>Right to Rectification:</strong> Edit and correct skills, contact details, and portfolio items at any time.</li>
              <li><strong>Right to Data Portability:</strong> Export your full profile, application history, and transaction logs via the self-service export tool above.</li>
              <li><strong>Right to Erasure:</strong> Request permanent de-identification and deletion of non-statutory records by contacting compliance&#64;ethiobridge.et.</li>
            </ul>
          </section>

          <section>
            <h2>5. Contact Data Protection Officer</h2>
            <p>
              For privacy inquiries, audit requests, or formal data deletion notices, contact our compliance team:
            </p>
            <div class="contact-box">
              <p><strong>EthioBridge Compliance & Data Protection Office</strong></p>
              <p>Bole Sub-City, Addis Ababa, Ethiopia</p>
              <p>Email: <a href="mailto:privacy@ethiobridge.et">privacy&#64;ethiobridge.et</a> | Phone: +251 11 661 0000</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal-page-container {
      padding: 3rem 1.5rem 6rem;
      max-width: 960px;
    }
    .legal-header {
      margin-bottom: 2rem;
      text-align: center;
    }
    .legal-header h1 {
      font-size: 2.25rem;
      color: var(--color-charcoal);
      margin: 0.5rem 0;
    }
    .effective-date {
      color: var(--color-slate);
      font-size: 0.9rem;
    }
    .legal-card {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 2.5rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }
    .export-banner {
      background: linear-gradient(135deg, rgba(28, 184, 205, 0.08) 0%, rgba(105, 113, 132, 0.08) 100%);
      border: 1px solid rgba(28, 184, 205, 0.3);
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
    }
    .export-info h4 {
      color: var(--color-charcoal);
      margin-bottom: 0.25rem;
      font-size: 1rem;
    }
    .export-info p {
      font-size: 0.85rem;
      color: var(--color-slate);
      margin: 0;
      line-height: 1.4;
    }
    .privacy-sections section {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1.5rem;
    }
    .privacy-sections section:last-child {
      border-bottom: none;
    }
    .privacy-sections h2 {
      font-size: 1.35rem;
      color: var(--color-charcoal);
      margin-bottom: 1rem;
    }
    .privacy-sections p {
      font-size: 0.95rem;
      color: var(--color-charcoal);
      line-height: 1.7;
      margin-bottom: 1rem;
    }
    .privacy-sections ul {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
      color: var(--color-charcoal);
      line-height: 1.7;
    }
    .privacy-sections li {
      margin-bottom: 0.5rem;
    }
    .contact-box {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 1.25rem;
      border-radius: 8px;
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .contact-box a {
      color: var(--color-cyan);
    }
  `]
})
export class PrivacyComponent {
  exporting = false;

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    public i18n: I18nService
  ) {}

  exportUserData(): void {
    this.exporting = true;
    this.apiService.exportMyData().subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ethiobridge_userdata_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting = false;
      },
      error: () => {
        alert('Could not generate data export. Please try again or contact support.');
        this.exporting = false;
      }
    });
  }
}
