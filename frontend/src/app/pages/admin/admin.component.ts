import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User, Skill, SkillCategory, UserVerificationStatus, TrustReport, AuditLogItem, MonetizationStats } from '../../models/models';

type AdminTab = 'monetization' | 'users' | 'verifications' | 'reports' | 'disputes' | 'skills' | 'audit';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container admin-page">
      <div class="page-header">
        <div class="badge badge-job" style="margin-bottom: 0.5rem;">Platform Administration</div>
        <h1>EthioBridge Governance Console</h1>
        <p>National ID verification, trust & safety moderation, escrow dispute mediation, skill taxonomy, and audit logs.</p>
      </div>

      <!-- Tab Navigation -->
      <div class="admin-tabs">
        <button
          type="button"
          class="tab-btn"
          [class.active]="currentTab === 'monetization'"
          (click)="switchTab('monetization')">
          💰 Financial & Monetization
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="currentTab === 'users'"
          (click)="switchTab('users')">
          👥 User Accounts ({{ users.length }})
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="currentTab === 'verifications'"
          (click)="switchTab('verifications')">
          🪪 ID Verifications
          <span *ngIf="pendingVerificationsCount > 0" class="badge-count">{{ pendingVerificationsCount }}</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="currentTab === 'reports'"
          (click)="switchTab('reports')">
          🚩 Trust & Reports
          <span *ngIf="pendingReportsCount > 0" class="badge-count">{{ pendingReportsCount }}</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="currentTab === 'disputes'"
          (click)="switchTab('disputes')">
          ⚖️ Escrow Disputes
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="currentTab === 'skills'"
          (click)="switchTab('skills')">
          🏷️ Taxonomy
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="currentTab === 'audit'"
          (click)="switchTab('audit')">
          📜 Audit Stream
        </button>
      </div>

      <!-- TAB 0: FINANCIAL & MONETIZATION DASHBOARD (Upwork Revenue Model) -->
      <div class="card admin-section" *ngIf="currentTab === 'monetization'">
        <div class="section-top">
          <div>
            <h3>Platform Revenue & Financial Performance</h3>
            <p class="section-desc">Real-time ledger tracking 10% escrow take rates, proposal connects, featured listings, and pro subscriptions.</p>
          </div>
          <button (click)="loadMonetizationStats()" class="btn btn-secondary btn-sm">🔄 Refresh Financials</button>
        </div>

        <!-- Metric Cards Grid -->
        <div class="monetization-metrics-grid">
          <div class="metric-card metric-primary">
            <span class="m-label">Total Platform Revenue</span>
            <span class="m-value">{{ (monetizationStats?.totalRevenue || 0) | number:'1.2-2' }} ETB</span>
            <span class="m-sub">100% Platform Net Take</span>
          </div>

          <div class="metric-card">
            <span class="m-label">10% Escrow Commissions</span>
            <span class="m-value text-green">{{ (monetizationStats?.escrowCommissionRevenue || 0) | number:'1.2-2' }} ETB</span>
            <span class="m-sub">Completed Contract Take Rate</span>
          </div>

          <div class="metric-card">
            <span class="m-label">Connects Token Sales</span>
            <span class="m-value text-cyan">{{ (monetizationStats?.connectsRevenue || 0) | number:'1.2-2' }} ETB</span>
            <span class="m-sub">Telebirr Proposal Tokens</span>
          </div>

          <div class="metric-card">
            <span class="m-label">Featured Listing Fees</span>
            <span class="m-value text-orange">{{ (monetizationStats?.featuredListingRevenue || 0) | number:'1.2-2' }} ETB</span>
            <span class="m-sub">500 ETB / 14-Day Pins</span>
          </div>

          <div class="metric-card">
            <span class="m-label">Pro Subscriptions</span>
            <span class="m-value text-purple">{{ (monetizationStats?.proSubscriptionRevenue || 0) | number:'1.2-2' }} ETB</span>
            <span class="m-sub">299 ETB / Month Memberships</span>
          </div>
        </div>

        <!-- Revenue Transaction Ledger -->
        <div style="margin-top: 2rem;">
          <h4 style="margin-bottom: 0.75rem;">Revenue Transaction Ledger</h4>
          <table class="data-table" *ngIf="monetizationStats?.recentTransactions?.length">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Revenue Stream</th>
                <th>Fee Amount (ETB)</th>
                <th>Payment Rail</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of monetizationStats?.recentTransactions">
                <td class="font-mono">{{ tx.referenceId }}</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-job': tx.sourceType === 'ESCROW_COMMISSION',
                    'badge-freelance': tx.sourceType === 'CONNECTS_TOPUP',
                    'badge-local': tx.sourceType === 'FEATURED_LISTING',
                    'badge-status-open': tx.sourceType === 'PRO_SUBSCRIPTION'
                  }">{{ tx.sourceType }}</span>
                </td>
                <td><strong>{{ tx.feeAmount | number:'1.2-2' }} ETB</strong></td>
                <td><span class="ip-tag">{{ tx.paymentMethod }}</span></td>
                <td><small>{{ tx.description }}</small></td>
                <td class="text-slate">{{ tx.createdAt | date:'short' }}</td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="!monetizationStats?.recentTransactions?.length" class="empty-msg">
            No monetization transactions recorded yet. They will appear automatically as contracts are released, connects purchased, or listings promoted.
          </div>
        </div>
      </div>

      <!-- TAB 1: USERS -->
      <div class="card admin-section" *ngIf="currentTab === 'users'">
        <div class="section-top">
          <div>
            <h3>Registered User Accounts</h3>
            <p class="section-desc">Manage account access, suspend bad actors, and inspect verification status.</p>
          </div>
          <input
            type="text"
            [(ngModel)]="userSearch"
            placeholder="Search by name or email..."
            class="form-input search-box" />
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>User / Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers">
                <td>
                  <strong>{{ u.fullName || 'User' }}</strong>
                </td>
                <td>{{ u.email }}</td>
                <td>
                  <span class="user-role-chip" *ngFor="let r of u.roles">{{ r }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="isUserVerified(u) ? 'badge-status-open' : 'badge-status-closed'">
                    {{ isUserVerified(u) ? '✓ Verified' : 'Unverified' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="u.status === 'ACTIVE' ? 'badge-status-open' : 'badge-status-closed'">
                    {{ u.status }}
                  </span>
                </td>
                <td>
                  <button
                    *ngIf="u.status === 'ACTIVE'"
                    (click)="setUserStatus(u, 'SUSPENDED')"
                    class="btn btn-outline btn-sm text-danger">
                    Suspend
                  </button>
                  <button
                    *ngIf="u.status === 'SUSPENDED'"
                    (click)="setUserStatus(u, 'ACTIVE')"
                    class="btn btn-secondary btn-sm">
                    Activate
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: VERIFICATIONS -->
      <div class="card admin-section" *ngIf="currentTab === 'verifications'">
        <div class="section-top">
          <div>
            <h3>Fayda National ID & Document Verifications</h3>
            <p class="section-desc">Multi-criteria compliance verification with explainable AI analysis and document inspection.</p>
          </div>
          <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
            <select [(ngModel)]="verificationFilter" class="filter-select">
              <option value="ALL">All Applications ({{ verifications.length }})</option>
              <option value="PENDING">Pending Review ({{ pendingVerificationsCount }})</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <input
              type="text"
              [(ngModel)]="verificationSearch"
              placeholder="Search applicant / ID..."
              class="form-input search-box"
              style="max-width: 200px; padding: 0.4rem 0.6rem; font-size: 0.85rem;" />
            <button (click)="loadVerifications()" class="btn btn-outline btn-sm">↻ Refresh</button>
          </div>
        </div>

        <div *ngIf="filteredVerifications.length === 0" class="empty-msg">
          No verification applications in this view.
        </div>

        <div class="table-responsive" *ngIf="filteredVerifications.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Applicant / User</th>
                <th>Document Type</th>
                <th>ID Number</th>
                <th>Phone</th>
                <th>Document Photo</th>
                <th>AI Integrity Assessment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let v of filteredVerifications">
                <td>
                  <div style="display: flex; flex-direction: column;">
                    <strong>{{ v.userName || 'Applicant' }}</strong>
                    <small class="text-slate">{{ v.userEmail }}</small>
                    <div style="margin-top: 0.2rem;" *ngIf="v.userRoles?.length">
                      <span class="user-role-chip" *ngFor="let r of v.userRoles">{{ r }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge badge-job">{{ formatIdType(v.idType) }}</span>
                </td>
                <td><code>{{ v.idNumber }}</code></td>
                <td>{{ v.phoneNumber || '—' }}</td>
                <td>
                  <div *ngIf="v.documentUrl" class="table-doc-thumb-container" (click)="openInspectModal(v)">
                    <img [src]="v.documentUrl" alt="Doc" class="table-doc-thumb" />
                    <span class="thumb-hover-label">🔍 Inspect</span>
                  </div>
                  <span *ngIf="!v.documentUrl" class="text-slate" style="font-size: 0.75rem; font-style: italic;">No Image</span>
                </td>
                <td>
                  <div *ngIf="v.aiScore !== undefined && v.aiScore !== null" class="ai-score-cell">
                    <span class="ai-score-chip" [ngClass]="getAiScoreClass(v.aiScore)">
                      ✦ {{ v.aiScore }}%
                    </span>
                    <small class="ai-verdict-text">{{ v.aiVerdict || 'ANALYZED' }}</small>
                  </div>
                  <button *ngIf="v.aiScore === undefined || v.aiScore === null"
                          (click)="triggerAiAnalysis(v)"
                          class="btn btn-outline btn-xs"
                          [disabled]="aiAnalyzingId === v.id">
                    {{ aiAnalyzingId === v.id ? 'Analyzing...' : '✦ Run AI Check' }}
                  </button>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-status-open': v.status === 'VERIFIED',
                    'badge-candidate-interview': v.status === 'PENDING',
                    'badge-status-closed': v.status === 'REJECTED'
                  }">
                    {{ v.status }}
                  </span>
                </td>
                <td>
                  <div class="action-btn-group">
                    <button (click)="openInspectModal(v)" class="btn btn-secondary btn-sm" title="Detailed Document & AI Inspection">
                      🔍 Inspect
                    </button>
                    <button *ngIf="v.status === 'PENDING'" (click)="approveVerification(v)" class="btn btn-primary btn-sm" title="Approve">
                      ✓
                    </button>
                    <button *ngIf="v.status === 'PENDING'" (click)="rejectVerification(v)" class="btn btn-outline btn-sm text-danger" title="Reject">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: REPORTS & MODERATION -->
      <div class="card admin-section" *ngIf="currentTab === 'reports'">
        <div class="section-top">
          <div>
            <h3>User Reports & Content Moderation Queue</h3>
            <p class="section-desc">Review grievances filed by marketplace participants for scam, fraud, or policy violations.</p>
          </div>
          <button (click)="loadReports()" class="btn btn-outline btn-sm">↻ Refresh</button>
        </div>

        <div *ngIf="reports.length === 0" class="empty-msg">
          Queue is clear. No reports filed.
        </div>

        <div class="table-responsive" *ngIf="reports.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Reason</th>
                <th>Details</th>
                <th>Reporter ID</th>
                <th>Target (User/Listing)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of reports">
                <td><strong>{{ r.reason }}</strong></td>
                <td style="max-width: 250px;">{{ r.details || 'No additional details.' }}</td>
                <td><code>{{ r.reporterUserId }}</code></td>
                <td>
                  <span *ngIf="r.reportedUserId">User: <code>{{ r.reportedUserId }}</code></span>
                  <span *ngIf="r.listingId">Listing: <code>{{ r.listingId }}</code></span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-status-closed': r.status === 'RESOLVED',
                    'badge-candidate-interview': r.status === 'PENDING' || r.status === 'INVESTIGATING',
                    'badge-status-draft': r.status === 'DISMISSED'
                  }">
                    {{ r.status }}
                  </span>
                </td>
                <td>
                  <div class="action-btn-group" *ngIf="r.status === 'PENDING' || r.status === 'INVESTIGATING'">
                    <button (click)="resolveReportItem(r, 'RESOLVED')" class="btn btn-primary btn-sm">
                      Resolve & Action
                    </button>
                    <button (click)="resolveReportItem(r, 'DISMISSED')" class="btn btn-outline btn-sm">
                      Dismiss
                    </button>
                  </div>
                  <span *ngIf="r.status === 'RESOLVED' || r.status === 'DISMISSED'" class="text-muted small">
                    {{ r.adminNotes || 'Completed' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: DISPUTES -->
      <div class="card admin-section" *ngIf="currentTab === 'disputes'">
        <div class="section-top">
          <div>
            <h3>Escrow & Milestone Dispute Mediation</h3>
            <p class="section-desc">Arbitrate contested milestone deliverables between seekers and providers.</p>
          </div>
          <button (click)="loadDisputes()" class="btn btn-outline btn-sm">↻ Refresh</button>
        </div>

        <div *ngIf="disputes.length === 0" class="empty-msg">
          No active escrow disputes. All agreements in normal state.
        </div>

        <div class="table-responsive" *ngIf="disputes.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dispute ID</th>
                <th>Contract ID</th>
                <th>Reason</th>
                <th>Claim Details</th>
                <th>Status</th>
                <th>Mediation Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of disputes">
                <td><code>{{ d.id }}</code></td>
                <td><code>{{ d.contractId }}</code></td>
                <td><strong>{{ d.reason }}</strong></td>
                <td style="max-width: 250px;">{{ d.details || '—' }}</td>
                <td>
                  <span class="badge" [ngClass]="d.status === 'RESOLVED' ? 'badge-status-closed' : 'badge-candidate-interview'">
                    {{ d.status }}
                  </span>
                </td>
                <td>
                  <div class="action-btn-group" *ngIf="d.status !== 'RESOLVED'">
                    <button (click)="resolveDisputeItem(d, 'RELEASE_PROVIDER')" class="btn btn-primary btn-sm">
                      Release to Provider
                    </button>
                    <button (click)="resolveDisputeItem(d, 'REFUND_SEEKER')" class="btn btn-outline btn-sm text-danger">
                      Refund Seeker
                    </button>
                  </div>
                  <span *ngIf="d.status === 'RESOLVED'" class="text-muted small">
                    {{ d.adminResolution || 'Settled' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 5: SKILLS TAXONOMY -->
      <div class="card admin-section" *ngIf="currentTab === 'skills'">
        <h3>Skill Taxonomy Catalog</h3>
        <p class="section-desc">Create new skills or deprecate obsolete skills across tech, trades, and languages.</p>

        <div class="create-skill-form">
          <input type="text" [(ngModel)]="newSkillName" placeholder="Skill Name (e.g. Flutter, Solar PV)" class="form-input flex-1" />
          <select [(ngModel)]="newSkillCategory" class="form-select" style="width: 140px;">
            <option value="TECH">TECH</option>
            <option value="TRADES">TRADES</option>
            <option value="LANGUAGE">LANGUAGE</option>
            <option value="SOFT">SOFT</option>
            <option value="OTHER">OTHER</option>
          </select>
          <button (click)="createSkill()" [disabled]="!newSkillName.trim()" class="btn btn-primary">+ Add Skill</button>
        </div>

        <div class="skills-catalog-list">
          <div *ngFor="let s of skills" class="skill-catalog-item" [class.deprecated]="!s.isActive">
            <div>
              <strong>{{ s.name }}</strong>
              <span class="skill-badge">{{ s.category }}</span>
              <span *ngIf="!s.isActive" class="badge badge-status-closed" style="margin-left: 0.5rem;">Deprecated</span>
            </div>
            <button *ngIf="s.isActive" (click)="deprecateSkill(s)" class="btn-remove-sm" title="Deprecate">✕</button>
          </div>
        </div>
      </div>

      <!-- TAB 6: AUDIT STREAM -->
      <div class="card admin-section" *ngIf="currentTab === 'audit'">
        <div class="section-top">
          <div>
            <h3>System Audit Event Log</h3>
            <p class="section-desc">Immutable event record for security operations, authentication events, and financial releases.</p>
          </div>
          <button (click)="loadAuditLogs()" class="btn btn-outline btn-sm">↻ Refresh Feed</button>
        </div>

        <div *ngIf="auditLogs.length === 0" class="empty-msg">
          No audit logs recorded yet.
        </div>

        <div class="table-responsive" *ngIf="auditLogs.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor User</th>
                <th>Entity / Resource</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of auditLogs">
                <td><code>{{ log.createdAt | date:'short' }}</code></td>
                <td><strong class="log-action">{{ log.action }}</strong></td>
                <td><code>{{ log.actorUserId || 'SYSTEM' }}</code></td>
                <td>{{ log.entityType }}: <code>{{ log.entityId }}</code></td>
                <td><span class="ip-tag">{{ log.ipAddress || '127.0.0.1' }}</span></td>
                <td style="max-width: 280px; font-size: 0.8rem;">{{ log.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL: ID DOCUMENT INSPECTOR & MULTI-CRITERIA VERIFIER -->
      <div class="modal-backdrop" *ngIf="inspectingDocModal && selectedVerif" (click)="closeInspectModal()">
        <div class="modal-inspector" (click)="$event.stopPropagation()">
          <div class="inspector-header">
            <div class="inspector-title">
              <span class="shield-mini">🛡️</span>
              <div>
                <h3>National Identity & AI Compliance Inspector</h3>
                <p>Applicant: <strong>{{ selectedVerif.userName || 'Applicant' }}</strong> (<code>{{ selectedVerif.userEmail }}</code>)</p>
              </div>
            </div>
            <button class="close-btn" (click)="closeInspectModal()">✕</button>
          </div>

          <div class="inspector-body">
            <!-- Left: Document Image Viewer -->
            <div class="inspector-doc-view">
              <div class="doc-view-header">
                <strong>{{ formatIdType(selectedVerif.idType) }} Visual Verification</strong>
                <a *ngIf="selectedVerif.documentUrl" [href]="selectedVerif.documentUrl" target="_blank" class="text-cyan font-bold" style="font-size: 0.8rem;">Open Full Resolution ↗</a>
              </div>
              <div class="doc-img-frame" *ngIf="selectedVerif.documentUrl">
                <img [src]="selectedVerif.documentUrl" alt="ID Document Scan" class="doc-full-preview" />
              </div>
              <div class="doc-img-placeholder" *ngIf="!selectedVerif.documentUrl">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📄</div>
                <strong>No Document Image Attached</strong>
                <p>This verification was submitted without an attached ID photo scan.</p>
              </div>
            </div>

            <!-- Right: Evaluation Details & AI Verdict -->
            <div class="inspector-details">
              <!-- Applicant Profile -->
              <div class="inspector-card">
                <h4>Submission & Account Profile</h4>
                <div class="applicant-info-grid">
                  <div>
                    <span class="info-label">Full Name:</span>
                    <strong>{{ selectedVerif.userName || 'Unknown' }}</strong>
                  </div>
                  <div>
                    <span class="info-label">Account Email:</span>
                    <span>{{ selectedVerif.userEmail || '—' }}</span>
                  </div>
                  <div>
                    <span class="info-label">Document Number:</span>
                    <strong class="font-mono text-cyan">{{ selectedVerif.idNumber }}</strong>
                  </div>
                  <div>
                    <span class="info-label">Mobile Number:</span>
                    <span>{{ selectedVerif.phoneNumber || '—' }}</span>
                  </div>
                  <div>
                    <span class="info-label">Account Roles:</span>
                    <div>
                      <span class="user-role-chip" *ngFor="let r of selectedVerif.userRoles">{{ r }}</span>
                    </div>
                  </div>
                  <div>
                    <span class="info-label">Verification Status:</span>
                    <span class="badge" [ngClass]="{
                      'badge-status-open': selectedVerif.status === 'VERIFIED',
                      'badge-candidate-interview': selectedVerif.status === 'PENDING',
                      'badge-status-closed': selectedVerif.status === 'REJECTED'
                    }">{{ selectedVerif.status }}</span>
                  </div>
                </div>
              </div>

              <!-- AI Analysis Panel -->
              <div class="inspector-card ai-panel">
                <div class="ai-panel-header">
                  <div>
                    <span class="ai-panel-tag">✦ Explainable AI Identity Auditor</span>
                    <h4 style="margin: 0.2rem 0 0;">
                      Trust Score:
                      <span [ngClass]="getAiScoreClass(selectedVerif.aiScore)">
                        {{ selectedVerif.aiScore !== undefined && selectedVerif.aiScore !== null ? selectedVerif.aiScore + '%' : 'Pending Analysis' }}
                      </span>
                    </h4>
                  </div>
                  <button (click)="triggerAiAnalysis(selectedVerif)" class="btn btn-secondary btn-xs" [disabled]="aiAnalyzingId === selectedVerif.id">
                    {{ aiAnalyzingId === selectedVerif.id ? 'Auditing...' : '↻ Re-Run AI Audit' }}
                  </button>
                </div>

                <div class="ai-verdict-banner" [ngClass]="getAiVerdictClass(selectedVerif.aiVerdict)" *ngIf="selectedVerif.aiVerdict">
                  <strong>Verdict: {{ selectedVerif.aiVerdict }}</strong>
                </div>

                <p class="ai-rationale-text" *ngIf="selectedVerif.aiAnalysis">
                  {{ selectedVerif.aiAnalysis }}
                </p>

                <!-- Multi-criteria breakdown list -->
                <div class="criteria-list" *ngIf="getCriteriaList(selectedVerif).length > 0">
                  <div class="criteria-item" *ngFor="let item of getCriteriaList(selectedVerif)">
                    <span class="crit-check">✓</span>
                    <span>{{ item }}</span>
                  </div>
                </div>
              </div>

              <!-- Decision Buttons -->
              <div class="inspector-actions">
                <button (click)="approveSelectedVerification()" class="btn btn-primary" [disabled]="selectedVerif.status === 'VERIFIED'">
                  ✓ Approve & Issue Verified Badge
                </button>
                <button (click)="rejectSelectedVerification()" class="btn btn-outline text-danger" [disabled]="selectedVerif.status === 'REJECTED'">
                  ✕ Reject Application
                </button>
                <button (click)="closeInspectModal()" class="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      padding: 2.5rem 1.5rem 5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header h1 {
      margin-bottom: 0.25rem;
    }
    .page-header p {
      color: var(--color-slate);
    }
    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--color-border);
      padding-bottom: 0.25rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.65rem 1.15rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-slate);
      cursor: pointer;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s ease;
    }
    .tab-btn:hover {
      background: var(--color-surface-subtle);
      color: var(--color-charcoal);
    }
    .tab-btn.active {
      background: var(--color-cyan-subtle);
      color: #0E7F8F;
      font-weight: 700;
    }
    .badge-count {
      background: var(--color-danger);
      color: #FFFFFF;
      font-size: 0.7rem;
      padding: 0.1rem 0.45rem;
      border-radius: 10px;
      font-weight: 800;
    }
    .admin-section {
      background: #FFFFFF;
      padding: 1.75rem;
      border-radius: 10px;
      border: 1px solid var(--color-border);
    }
    .section-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .section-desc {
      font-size: 0.875rem;
      color: var(--color-slate);
      margin: 0.25rem 0 0;
    }
    .search-box {
      max-width: 280px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th, .data-table td {
      padding: 0.75rem 0.5rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    .data-table th {
      color: var(--color-slate);
      font-size: 0.775rem;
      text-transform: uppercase;
      font-weight: 700;
    }
    .user-role-chip {
      background: var(--color-surface-subtle);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-charcoal);
      margin-right: 0.25rem;
    }
    .action-btn-group {
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }
    .create-skill-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .skills-catalog-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      max-height: 450px;
      overflow-y: auto;
    }
    .skill-catalog-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .skill-catalog-item.deprecated {
      opacity: 0.6;
      background: #F0F0F0;
    }
    .skill-badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-slate);
      background: rgba(105, 113, 132, 0.12);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      margin-left: 0.5rem;
    }
    .btn-remove-sm {
      background: none;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      font-weight: 800;
    }
    .text-danger {
      color: var(--color-danger);
      border-color: rgba(211, 47, 47, 0.4);
    }
    .text-danger:hover {
      background: var(--color-danger);
      color: #FFFFFF;
    }
    .log-action {
      color: var(--color-cyan);
      font-size: 0.825rem;
    }
    .ip-tag {
      background: rgba(105, 113, 132, 0.1);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
    }
    .empty-msg {
      padding: 2rem;
      text-align: center;
      color: var(--color-slate);
      font-style: italic;
    }
    .monetization-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .metric-card.metric-primary {
      border: 2px solid #0E7F8F;
      background: linear-gradient(135deg, rgba(28, 184, 205, 0.12) 0%, rgba(28, 184, 205, 0.04) 100%);
    }
    .m-label {
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--color-slate);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .m-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .m-sub {
      font-size: 0.725rem;
      color: var(--color-slate);
    }
    .text-green { color: #2E7D32; }
    .text-cyan { color: #0E7F8F; }
    .text-orange { color: #E65100; }
    .text-purple { color: #7B1FA2; }
    .filter-select {
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 0.4rem 0.65rem;
      font-size: 0.85rem;
      background: #FFFFFF;
      color: var(--color-charcoal);
    }
    .table-doc-thumb-container {
      position: relative;
      width: 54px;
      height: 38px;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--color-border);
      cursor: pointer;
    }
    .table-doc-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s;
    }
    .table-doc-thumb-container:hover .table-doc-thumb {
      transform: scale(1.1);
    }
    .thumb-hover-label {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(14, 127, 143, 0.85);
      color: #FFF;
      font-size: 0.6rem;
      text-align: center;
      padding: 1px 0;
      display: none;
    }
    .table-doc-thumb-container:hover .thumb-hover-label {
      display: block;
    }
    .ai-score-cell {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .ai-score-chip {
      display: inline-block;
      font-weight: 800;
      font-size: 0.78rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      text-align: center;
    }
    .score-high {
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }
    .score-med {
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FDE68A;
    }
    .score-low {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FECACA;
    }
    .ai-verdict-text {
      font-size: 0.68rem;
      color: var(--color-slate);
      font-weight: 600;
    }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.72rem;
      border-radius: 4px;
    }
    /* Inspector Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-inspector {
      background: #FFFFFF;
      border-radius: 14px;
      max-width: 960px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
    }
    .inspector-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--color-surface-subtle);
    }
    .inspector-title {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .shield-mini {
      font-size: 2rem;
    }
    .inspector-title h3 {
      margin: 0;
      font-size: 1.15rem;
      color: var(--color-charcoal);
    }
    .inspector-title p {
      margin: 0.15rem 0 0;
      font-size: 0.8rem;
      color: var(--color-slate);
    }
    .inspector-body {
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      overflow-y: auto;
    }
    @media (max-width: 768px) {
      .inspector-body {
        grid-template-columns: 1fr;
      }
    }
    .inspector-doc-view {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .doc-view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
    }
    .doc-img-frame {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      overflow: hidden;
      background: #111;
      min-height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .doc-full-preview {
      width: 100%;
      max-height: 420px;
      object-fit: contain;
    }
    .doc-img-placeholder {
      border: 2px dashed var(--color-border);
      border-radius: 8px;
      padding: 3rem 1rem;
      text-align: center;
      color: var(--color-slate);
      background: #FAFAFA;
    }
    .inspector-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .inspector-card {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem;
    }
    .inspector-card h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.92rem;
      color: var(--color-charcoal);
    }
    .applicant-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      font-size: 0.82rem;
    }
    .info-label {
      display: block;
      color: var(--color-slate);
      font-size: 0.75rem;
      margin-bottom: 0.15rem;
    }
    .ai-panel {
      border: 1px solid rgba(14, 127, 143, 0.3);
      background: rgba(14, 127, 143, 0.04);
    }
    .ai-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .ai-panel-tag {
      font-size: 0.72rem;
      font-weight: 800;
      color: #0E7F8F;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ai-verdict-banner {
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      margin-bottom: 0.75rem;
    }
    .verdict-high {
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #A7F3D0;
    }
    .verdict-med {
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FDE68A;
    }
    .verdict-low {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FECACA;
    }
    .ai-rationale-text {
      font-size: 0.82rem;
      color: #374151;
      line-height: 1.45;
      margin-bottom: 0.75rem;
    }
    .criteria-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .criteria-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.78rem;
      color: #1F2937;
    }
    .crit-check {
      color: #10B981;
      font-weight: 800;
    }
    .inspector-actions {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
  `]
})
export class AdminComponent implements OnInit {
  currentTab: AdminTab = 'monetization';

  monetizationStats?: MonetizationStats;
  users: User[] = [];
  userSearch = '';
  skills: Skill[] = [];
  verifications: UserVerificationStatus[] = [];
  selectedVerif: UserVerificationStatus | null = null;
  inspectingDocModal = false;
  aiAnalyzingId: string | null = null;
  verificationFilter: 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' = 'ALL';
  verificationSearch = '';
  reports: TrustReport[] = [];
  disputes: any[] = [];
  auditLogs: AuditLogItem[] = [];

  newSkillName = '';
  newSkillCategory: SkillCategory = 'TECH';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMonetizationStats();
    this.loadUsers();
    this.loadSkills();
    this.loadVerifications();
    this.loadReports();
    this.loadDisputes();
    this.loadAuditLogs();
  }

  get filteredUsers(): User[] {
    if (!this.userSearch.trim()) return this.users;
    const q = this.userSearch.toLowerCase();
    return this.users.filter(u =>
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q)
    );
  }

  isUserVerified(u: User): boolean {
    return !!(u.isVerified || (u as any).verified);
  }

  get filteredVerifications(): UserVerificationStatus[] {
    let list = this.verifications;
    if (this.verificationFilter !== 'ALL') {
      list = list.filter(v => v.status === this.verificationFilter);
    }
    if (this.verificationSearch.trim()) {
      const q = this.verificationSearch.toLowerCase();
      list = list.filter(v =>
        (v.userName && v.userName.toLowerCase().includes(q)) ||
        (v.userEmail && v.userEmail.toLowerCase().includes(q)) ||
        (v.idNumber && v.idNumber.toLowerCase().includes(q)) ||
        (v.idType && v.idType.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get pendingVerificationsCount(): number {
    return this.verifications.filter(v => v.status === 'PENDING').length;
  }

  get pendingReportsCount(): number {
    return this.reports.filter(r => r.status === 'PENDING' || r.status === 'INVESTIGATING').length;
  }

  formatIdType(type: string): string {
    switch (type) {
      case 'FAYDA_NATIONAL_ID': return 'Fayda National ID';
      case 'KEBELE_ID': return 'Kebele ID';
      case 'PASSPORT': return 'Ethiopian Passport';
      case 'DRIVERS_LICENSE': return "Driver's License";
      case 'BUSINESS_LICENSE': return 'Business / Trade License';
      default: return type || 'ID Document';
    }
  }

  getAiScoreClass(score?: number): string {
    if (score === undefined || score === null) return 'score-med';
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-med';
    return 'score-low';
  }

  getAiVerdictClass(verdict?: string): string {
    if (!verdict) return 'verdict-med';
    const v = verdict.toUpperCase();
    if (v.includes('HIGH') || v.includes('APPROVED')) return 'verdict-high';
    if (v.includes('SUSPICIOUS') || v.includes('REJECTED') || v.includes('LOW')) return 'verdict-low';
    return 'verdict-med';
  }

  getCriteriaList(v?: UserVerificationStatus | null): string[] {
    if (!v || !v.criteriaBreakdown) return [];
    try {
      const parsed = JSON.parse(v.criteriaBreakdown);
      if (Array.isArray(parsed)) return parsed;
      return Object.entries(parsed).map(([k, val]) => `${k}: ${val}`);
    } catch {
      return v.criteriaBreakdown.split(';').map(s => s.trim()).filter(s => !!s);
    }
  }

  openInspectModal(v: UserVerificationStatus): void {
    this.selectedVerif = v;
    this.inspectingDocModal = true;
  }

  closeInspectModal(): void {
    this.inspectingDocModal = false;
    this.selectedVerif = null;
  }

  triggerAiAnalysis(v: UserVerificationStatus): void {
    this.aiAnalyzingId = v.id;
    this.apiService.analyzeVerificationWithAi(v.id).subscribe({
      next: (res) => {
        v.aiScore = res.aiScore;
        v.aiVerdict = res.aiVerdict;
        v.aiAnalysis = res.aiAnalysis;
        v.criteriaBreakdown = res.criteriaBreakdown;
        if (this.selectedVerif && this.selectedVerif.id === v.id) {
          this.selectedVerif = { ...this.selectedVerif, ...res };
        }
        this.aiAnalyzingId = null;
      },
      error: () => {
        this.aiAnalyzingId = null;
      }
    });
  }

  approveSelectedVerification(): void {
    if (!this.selectedVerif) return;
    this.approveVerification(this.selectedVerif);
    this.closeInspectModal();
  }

  rejectSelectedVerification(): void {
    if (!this.selectedVerif) return;
    this.rejectVerification(this.selectedVerif);
    this.closeInspectModal();
  }

  switchTab(tab: AdminTab): void {
    this.currentTab = tab;
    if (tab === 'monetization') this.loadMonetizationStats();
    if (tab === 'verifications') this.loadVerifications();
    if (tab === 'reports') this.loadReports();
    if (tab === 'disputes') this.loadDisputes();
    if (tab === 'audit') this.loadAuditLogs();
  }

  loadMonetizationStats(): void {
    this.apiService.getMonetizationStats().subscribe({
      next: s => this.monetizationStats = s,
      error: () => {}
    });
  }

  loadUsers(): void {
    this.apiService.getAdminUsers(0, 100).subscribe(res => {
      this.users = res.data || [];
    });
  }

  loadSkills(): void {
    this.apiService.getSkills().subscribe(res => {
      this.skills = res || [];
    });
  }

  loadVerifications(): void {
    this.apiService.getAdminVerifications().subscribe(res => {
      this.verifications = res || [];
    });
  }

  loadReports(): void {
    this.apiService.getAdminReports().subscribe(res => {
      this.reports = res || [];
    });
  }

  loadDisputes(): void {
    this.apiService.getAdminDisputes().subscribe(res => {
      this.disputes = res || [];
    });
  }

  loadAuditLogs(): void {
    this.apiService.getAdminAuditLogs().subscribe(res => {
      this.auditLogs = res || [];
    });
  }

  setUserStatus(user: User, status: string): void {
    this.apiService.setAdminUserStatus(user.userId, status).subscribe(updated => {
      user.status = updated.status;
    });
  }

  approveVerification(v: UserVerificationStatus): void {
    this.apiService.reviewVerification(v.id, true).subscribe(res => {
      v.status = res.status;
      v.verifiedAt = res.verifiedAt;
      this.loadUsers(); // Refresh verified badges in user tab
    });
  }

  rejectVerification(v: UserVerificationStatus): void {
    const reason = prompt('Please enter rejection reason (e.g. Document photo illegible, invalid FAN format):');
    if (!reason) return;
    this.apiService.reviewVerification(v.id, false, reason).subscribe(res => {
      v.status = res.status;
      v.rejectionReason = res.rejectionReason;
    });
  }

  resolveReportItem(r: TrustReport, status: 'RESOLVED' | 'DISMISSED'): void {
    const notes = prompt(`Enter resolution notes for report #${r.id}:`) || 'Moderated by admin';
    this.apiService.resolveReport(r.id, status, notes).subscribe(res => {
      r.status = res.status;
      r.adminNotes = res.adminNotes;
    });
  }

  resolveDisputeItem(d: any, resolution: string): void {
    const notes = prompt(`Enter arbitration notes:`, `Mediation decision: ${resolution}`);
    if (!notes) return;
    this.apiService.resolveDispute(d.id, 'RESOLVED', notes).subscribe(res => {
      d.status = res.status;
      d.adminResolution = res.adminResolution;
    });
  }

  createSkill(): void {
    if (!this.newSkillName.trim()) return;
    this.apiService.createSkill({
      name: this.newSkillName.trim(),
      category: this.newSkillCategory
    }).subscribe(created => {
      this.skills.push(created);
      this.newSkillName = '';
    });
  }

  deprecateSkill(skill: Skill): void {
    this.apiService.deprecateSkill(skill.id).subscribe(() => {
      skill.isActive = false;
    });
  }
}
