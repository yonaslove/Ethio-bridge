import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ProviderProfile } from '../../models/models';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container provider-detail-page" *ngIf="profile">
      <div class="page-top-nav">
        <a routerLink="/browse">← Back to Marketplace</a>
      </div>

      <div class="card detail-card">
        <div class="provider-header-row">
          <div class="avatar-circle">
            {{ getInitials(profile.fullName || 'Provider') }}
          </div>
          <div class="header-info">
            <div class="name-badge-row">
              <h1>{{ profile.fullName || 'Professional Provider' }}</h1>
              <span class="verified-badge">✓ Fayda ID Verified</span>
            </div>
            <div class="headline-text">{{ profile.headline }}</div>
            <div class="meta-row">
              <span>📍 {{ profile.locationName || 'Addis Ababa, Ethiopia' }}</span>
              <span>•</span>
              <span>🕒 {{ profile.availability }}</span>
              <span>•</span>
              <span>💼 {{ profile.yearsExperience }} yrs experience</span>
              <span>•</span>
              <span class="rating-highlight">★ 4.9 (18 completed projects)</span>
            </div>
          </div>
          <div class="right-action-col">
            <div class="rate-badge-box">
              <div class="rate-val">{{ profile.hourlyRate }} ETB</div>
              <div class="rate-label">Hourly Rate</div>
            </div>
            <button
              *ngIf="authService.currentUser$ | async"
              (click)="startConversation()"
              class="btn btn-primary btn-sm btn-message">
              💬 Send Message
            </button>
          </div>
        </div>

        <div class="content-section">
          <h3>About & Professional Background</h3>
          <p class="bio-text">{{ profile.bio }}</p>
        </div>

        <div class="content-section" *ngIf="profile.skills && profile.skills.length > 0">
          <h3>Verified Skills & Competencies</h3>
          <div class="skills-grid">
            <div *ngFor="let s of profile.skills" class="skill-card">
              <div class="skill-name">{{ s.skillName }}</div>
              <div class="skill-prof">
                Proficiency: {{ s.proficiency }}/5 • {{ s.yearsExperience }} yrs
              </div>
            </div>
          </div>
        </div>

        <!-- Trust & Reviews Section -->
        <div class="content-section">
          <div class="section-title-row">
            <h3>Verified Reviews & Ratings</h3>
            <span class="verified-sub">From Completed EthioBridge Contracts</span>
          </div>

          <div class="reviews-list">
            <div class="review-item">
              <div class="review-top">
                <div class="reviewer-meta">
                  <strong>Abebe K.</strong>
                  <span class="review-role">• Employer (Tech Project)</span>
                </div>
                <div class="review-stars">★★★★★ 5.0</div>
              </div>
              <p class="review-comment">"Exceptional delivery quality and proactive communication. Finished 2 days ahead of milestone schedule. Highly recommended!"</p>
              <div class="review-date">Completed under Telebirr Escrow • 2 weeks ago</div>
            </div>

            <div class="review-item">
              <div class="review-top">
                <div class="reviewer-meta">
                  <strong>Bethlehem T.</strong>
                  <span class="review-role">• Client (Mobile App)</span>
                </div>
                <div class="review-stars">★★★★★ 5.0</div>
              </div>
              <p class="review-comment">"Very reliable and skilled developer. Code clean and tested. Milestone released with pleasure."</p>
              <div class="review-date">Completed under Telebirr Escrow • 1 month ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .provider-detail-page {
      padding: 2.5rem 1.5rem 5rem;
      max-width: 900px;
    }
    .page-top-nav {
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .page-top-nav a {
      color: var(--color-slate);
      text-decoration: none;
    }
    .detail-card {
      background: #FFFFFF;
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      border: 1px solid var(--color-border);
      border-radius: 12px;
    }
    .provider-header-row {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1.75rem;
      flex-wrap: wrap;
    }
    .avatar-circle {
      width: 76px;
      height: 76px;
      background: linear-gradient(135deg, var(--color-charcoal) 0%, var(--color-slate) 100%);
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.75rem;
      flex-shrink: 0;
    }
    .header-info {
      flex: 1 1 0%;
    }
    .name-badge-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .name-badge-row h1 {
      font-size: 1.75rem;
      margin: 0;
      color: var(--color-charcoal);
    }
    .verified-badge {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
    }
    .headline-text {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--color-slate);
      margin-top: 0.25rem;
    }
    .meta-row {
      display: flex;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: #777;
      margin-top: 0.4rem;
      flex-wrap: wrap;
    }
    .rating-highlight {
      color: #D97706;
      font-weight: 700;
    }
    .right-action-col {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-end;
    }
    .rate-badge-box {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      text-align: right;
    }
    .rate-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-charcoal);
    }
    .rate-label {
      font-size: 0.75rem;
      color: var(--color-slate);
      text-transform: uppercase;
      font-weight: 700;
    }
    .btn-message {
      width: 100%;
    }
    .content-section h3 {
      font-size: 1.2rem;
      margin-bottom: 0.75rem;
      color: var(--color-charcoal);
    }
    .section-title-row {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .section-title-row h3 {
      margin-bottom: 0;
    }
    .verified-sub {
      font-size: 0.8rem;
      color: var(--color-slate);
    }
    .bio-text {
      font-size: 0.95rem;
      line-height: 1.7;
      color: #444;
      white-space: pre-line;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .skill-card {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.85rem 1rem;
      border-radius: 8px;
    }
    .skill-name {
      font-weight: 700;
      color: var(--color-charcoal);
      font-size: 0.95rem;
    }
    .skill-prof {
      font-size: 0.775rem;
      color: var(--color-slate);
      margin-top: 0.2rem;
    }
    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .review-item {
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.25rem;
    }
    .review-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .reviewer-meta {
      font-size: 0.9rem;
    }
    .review-role {
      color: var(--color-slate);
      font-size: 0.8rem;
    }
    .review-stars {
      color: #F59E0B;
      font-size: 0.9rem;
    }
    .review-comment {
      font-size: 0.9rem;
      color: #333;
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
    .review-date {
      font-size: 0.75rem;
      color: var(--color-taupe);
    }
  `]
})
export class ProviderDetailComponent implements OnInit {
  profile?: ProviderProfile;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiService.getProvider(id).subscribe(p => this.profile = p);
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w.charAt(0)).slice(0, 2).join('');
  }

  startConversation(): void {
    if (!this.profile) return;
    this.apiService.createOrGetThread(
      this.profile.userId,
      undefined,
      `Project Inquiry with ${this.profile.fullName}`
    ).subscribe({
      next: (thread) => {
        this.router.navigate(['/messages'], { queryParams: { threadId: thread.id } });
      },
      error: () => {
        this.router.navigate(['/messages']);
      }
    });
  }
}
