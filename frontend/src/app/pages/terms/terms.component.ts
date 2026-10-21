import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="legal-page-container container">
      <div class="legal-header">
        <span class="badge badge-job">Legal & Governance</span>
        <h1>Terms of Service</h1>
        <p class="effective-date">Effective Date: October 2026 | Version 2.0 (Ethiopia Unified Marketplace)</p>
      </div>

      <div class="legal-card">
        <div class="table-of-contents">
          <h4>Contents</h4>
          <ul>
            <li><a href="#acceptance">1. Acceptance of Terms</a></li>
            <li><a href="#accountability">2. Eligibility & Identity Verification</a></li>
            <li><a href="#marketplace">3. Marketplace Services & Escrow Protection</a></li>
            <li><a href="#matching">4. AI Talent Matching & Transparency</a></li>
            <li><a href="#conduct">5. User Conduct & Prohibited Activities</a></li>
            <li><a href="#disputes">6. Dispute Mediation & Settlement</a></li>
            <li><a href="#termination">7. Account Suspension & Termination</a></li>
          </ul>
        </div>

        <div class="legal-body">
          <section id="acceptance">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using EthioBridge ("Platform", "we", "our"), whether as a job seeker, employer,
              freelancer, or local service provider, you agree to be bound by these Terms of Service. If you do not
              agree to these terms, you must not access or use our services.
            </p>
          </section>

          <section id="accountability">
            <h2>2. Eligibility & Identity Verification</h2>
            <p>
              Users must be at least 18 years of age and legally permitted to engage in work or hire labor under
              the laws of the Federal Democratic Republic of Ethiopia.
            </p>
            <p>
              To foster marketplace trust and protect participants, EthioBridge provides identity verification
              supporting the <strong>National ID (Fayda - FAN)</strong>, Kebele ID, and Ethiopian Passports. Providing
              fraudulent identification documents results in immediate permanent account termination and referral to
              law enforcement authorities.
            </p>
          </section>

          <section id="marketplace">
            <h2>3. Marketplace Services & Escrow Protection</h2>
            <p>
              EthioBridge enables job postings, freelance contract negotiations, and local on-demand service requests.
              For freelance and milestone-based services:
            </p>
            <ul>
              <li><strong>Milestone Escrow:</strong> Seekers fund milestones in Ethiopian Birr (ETB) via approved payment rails (Telebirr, Commercial Bank of Ethiopia - CBE Birr, Chapa).</li>
              <li><strong>Fund Security:</strong> Funds are locked in smart escrow until the seeker reviews and accepts the submitted deliverables.</li>
              <li><strong>Release of Payout:</strong> Once accepted, funds are automatically credited to the verified provider's payout wallet.</li>
            </ul>
          </section>

          <section id="matching">
            <h2>4. AI Talent Matching & Transparency</h2>
            <p>
              EthioBridge employs hybrid explainable artificial intelligence (Sentence-BERT / TF-IDF semantic embeddings)
              to match seekers with qualified providers.
            </p>
            <ul>
              <li><strong>Non-Discriminatory Parity:</strong> Algorithmic audits are regularly conducted across all 12 Ethiopian administrative regions and chartered cities (Addis Ababa, Dire Dawa) to eliminate systemic bias.</li>
              <li><strong>Human in the Loop:</strong> Recommendations are advisory only. Hiring decisions remain exclusively under the discretion of the employer or seeker.</li>
            </ul>
          </section>

          <section id="conduct">
            <h2>5. User Conduct & Prohibited Activities</h2>
            <p>
              All platform participants agree never to engage in:
            </p>
            <ul>
              <li>Posting fictitious job vacancies or pyramid/advance-fee scams.</li>
              <li>Circumventing platform escrow payments to avoid trust protection.</li>
              <li>Harassment, hate speech, or defamatory communications in chat channels.</li>
              <li>Scraping candidate profiles or automating unauthorized interactions.</li>
            </ul>
          </section>

          <section id="disputes">
            <h2>6. Dispute Mediation & Settlement</h2>
            <p>
              If a deliverable fails to satisfy the agreed contract specifications, either party may trigger
              an on-platform Dispute. Our designated Mediation Council investigates submitted work logs and chat transcripts
              to render a binding resolution (full refund, partial settlement, or complete payout release).
            </p>
          </section>

          <section id="termination">
            <h2>7. Account Suspension & Termination</h2>
            <p>
              EthioBridge reserves the right to suspend or terminate accounts that breach platform trust,
              fail verification integrity audits, or receive repeated substantiated abuse reports.
            </p>
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
    .table-of-contents {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 1.25rem 1.75rem;
      border-radius: 8px;
      margin-bottom: 2.5rem;
    }
    .table-of-contents h4 {
      margin-bottom: 0.75rem;
      font-size: 1rem;
      color: var(--color-charcoal);
    }
    .table-of-contents ul {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem 1.5rem;
    }
    .table-of-contents a {
      color: var(--color-cyan);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .table-of-contents a:hover {
      text-decoration: underline;
    }
    .legal-body section {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1.5rem;
    }
    .legal-body section:last-child {
      border-bottom: none;
    }
    .legal-body h2 {
      font-size: 1.35rem;
      color: var(--color-charcoal);
      margin-bottom: 1rem;
    }
    .legal-body p {
      font-size: 0.95rem;
      color: var(--color-charcoal);
      line-height: 1.7;
      margin-bottom: 1rem;
    }
    .legal-body ul {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
      color: var(--color-charcoal);
      line-height: 1.7;
    }
    .legal-body li {
      margin-bottom: 0.5rem;
    }
    @media (max-width: 768px) {
      .table-of-contents ul {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TermsComponent {
  constructor(public i18n: I18nService) {}
}
