import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ServiceCategory, Location, Skill, ListingType, Seniority, RequirementType } from '../../models/models';

@Component({
  selector: 'app-listing-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container create-page">
      <div class="create-header">
        <h1>Post a New Listing</h1>
        <p>Connect with vetted Ethiopian professionals, freelancers, and trade specialists</p>
      </div>

      <div class="card create-card">
        <!-- Step 1: Category Pillar Selection -->
        <div class="form-section">
          <h3>1. Select Marketplace Pillar</h3>
          <div class="type-selector-grid">
            <div class="type-card" [class.selected]="listingType === 'JOB'" (click)="listingType = 'JOB'">
              <div class="type-icon">💼</div>
              <div class="type-title">Employment</div>
              <p class="type-desc">Full-time or part-time staff positions for software companies and organizations</p>
            </div>

            <div class="type-card" [class.selected]="listingType === 'FREELANCE_PROJECT'" (click)="listingType = 'FREELANCE_PROJECT'">
              <div class="type-icon">💻</div>
              <div class="type-title">Freelance Project</div>
              <p class="type-desc">Contract or milestone-based deliverables (Web apps, designs, translation)</p>
            </div>

            <div class="type-card" [class.selected]="listingType === 'LOCAL_SERVICE_REQUEST'" (click)="listingType = 'LOCAL_SERVICE_REQUEST'">
              <div class="type-icon">🔧</div>
              <div class="type-title">Local Service Request</div>
              <p class="type-desc">On-site specialized trade or technician assistance (Electricians, plumbing, tutoring)</p>
            </div>
          </div>
        </div>

        <!-- Step 2: Basic Details -->
        <div class="form-section">
          <h3>2. Listing Details</h3>

          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" [(ngModel)]="title" class="form-input" placeholder="e.g. Senior Java Backend Architect" />
          </div>

          <div class="form-group">
            <label class="form-label">Description & Deliverables *</label>
            <textarea [(ngModel)]="description" rows="5" class="form-textarea" placeholder="Describe the responsibilities, expected outcomes, or service details..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Service Category</label>
              <select [(ngModel)]="serviceCategoryId" class="form-select">
                <option [ngValue]="null">Select category...</option>
                <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Location</label>
              <select [(ngModel)]="locationId" class="form-select">
                <option [ngValue]="null">Select location...</option>
                <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }} ({{ loc.region }})</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="form-group">
              <label class="form-label">Remote Work Allowed</label>
              <select [(ngModel)]="isRemote" class="form-select">
                <option [ngValue]="false">No (On-Site Required)</option>
                <option [ngValue]="true">Yes (Remote Allowed)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Availability Required</label>
              <select [(ngModel)]="availabilityRequired" class="form-select">
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="HOURLY">Hourly</option>
                <option value="ONE_OFF">One-Off Job</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Seniority Level</label>
              <select [(ngModel)]="seniority" class="form-select">
                <option value="ANY">Any / Flexible</option>
                <option value="JUNIOR">Junior (1-2 yrs)</option>
                <option value="MID">Mid-Level (3-4 yrs)</option>
                <option value="SENIOR">Senior (5+ yrs)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 3: Required & Preferred Skills -->
        <div class="form-section">
          <h3>3. Key Skills & Qualifications</h3>
          <p class="section-hint">Add skills used by the AI semantic engine to rank candidate profiles.</p>

          <div class="add-skill-box">
            <select [(ngModel)]="newSkillId" class="form-select flex-1">
              <option [ngValue]="null">Choose a skill to add...</option>
              <option *ngFor="let sk of availableSkills" [ngValue]="sk.id">{{ sk.name }} ({{ sk.category }})</option>
            </select>
            <select [(ngModel)]="newSkillRequirement" class="form-select" style="width: 160px;">
              <option value="REQUIRED">Required</option>
              <option value="PREFERRED">Preferred</option>
            </select>
            <button (click)="addSkill()" [disabled]="!newSkillId" class="btn btn-secondary">+ Add Skill</button>
          </div>

          <div class="selected-skills-list" *ngIf="selectedSkills.length > 0">
            <div *ngFor="let s of selectedSkills; let i = index" class="selected-skill-card">
              <div>
                <strong>{{ s.skillName }}</strong>
                <span class="badge" [ngClass]="s.requirement === 'REQUIRED' ? 'badge-job' : 'badge-local'" style="margin-left: 0.5rem;">
                  {{ s.requirement }}
                </span>
              </div>
              <div class="skill-weight-control">
                <label>Weight: {{ s.weight }}</label>
                <input type="range" min="0.1" max="1.0" step="0.1" [(ngModel)]="s.weight" />
                <button (click)="removeSkill(i)" class="btn-remove">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Budget -->
        <div class="form-section">
          <h3>4. Budget & Compensation (ETB)</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Minimum Budget (ETB)</label>
              <input type="number" [(ngModel)]="budgetMin" class="form-input" placeholder="e.g. 15000" />
            </div>
            <div class="form-group">
              <label class="form-label">Maximum Budget (ETB)</label>
              <input type="number" [(ngModel)]="budgetMax" class="form-input" placeholder="e.g. 30000" />
            </div>
          </div>
        </div>

        <div *ngIf="errorMessage" class="alert-danger" style="margin-bottom: 1rem;">
          {{ errorMessage }}
        </div>

        <div class="create-actions">
          <button (click)="submitListing(false)" [disabled]="submitting" class="btn btn-secondary">
            Save as Draft
          </button>
          <button (click)="submitListing(true)" [disabled]="submitting" class="btn btn-primary">
            {{ submitting ? 'Publishing...' : 'Publish Listing Now' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .create-page {
      padding: 2.5rem 1.5rem 5rem;
      max-width: 900px;
    }
    .create-header {
      margin-bottom: 2rem;
    }
    .create-card {
      background: #FFFFFF;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }
    .form-section {
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 2rem;
    }
    .form-section:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
    }
    .form-section h3 {
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    .section-hint {
      font-size: 0.875rem;
      color: var(--color-slate);
      margin-bottom: 1rem;
    }
    .type-selector-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .type-card {
      border: 2px solid var(--color-border);
      border-radius: 10px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--color-surface-subtle);
    }
    .type-card:hover {
      border-color: var(--color-taupe);
    }
    .type-card.selected {
      border-color: var(--color-cyan);
      background: #FFFFFF;
      box-shadow: 0 4px 12px rgba(28, 184, 205, 0.15);
    }
    .type-icon {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }
    .type-title {
      font-weight: 700;
      color: var(--color-charcoal);
      margin-bottom: 0.25rem;
    }
    .type-desc {
      font-size: 0.775rem;
      color: #666;
      line-height: 1.4;
    }
    .add-skill-box {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .selected-skills-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .selected-skill-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--color-surface-subtle);
      border: 1px solid var(--color-border);
      padding: 0.6rem 1rem;
      border-radius: 6px;
    }
    .skill-weight-control {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.8rem;
    }
    .btn-remove {
      background: none;
      border: none;
      color: var(--color-slate);
      cursor: pointer;
      font-weight: 700;
    }
    .create-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1.5rem;
    }
    .alert-danger {
      background-color: rgba(211, 47, 47, 0.12);
      color: var(--color-danger);
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    @media (max-width: 768px) {
      .type-selector-grid, .grid-cols-2, .grid-cols-3 {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ListingCreateComponent implements OnInit {
  listingType: ListingType = 'JOB';
  title = '';
  description = '';
  serviceCategoryId: number | null = null;
  locationId: number | null = null;
  isRemote = false;
  availabilityRequired = 'FULL_TIME';
  seniority: Seniority = 'MID';
  budgetMin?: number;
  budgetMax?: number;

  categories: ServiceCategory[] = [];
  locations: Location[] = [];
  availableSkills: Skill[] = [];

  selectedSkills: { skillId: number; skillName: string; requirement: RequirementType; weight: number }[] = [];
  newSkillId: number | null = null;
  newSkillRequirement: RequirementType = 'REQUIRED';

  submitting = false;
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiService.getCategories().subscribe(res => this.categories = res || []);
    this.apiService.getLocations().subscribe(res => this.locations = res || []);
    this.apiService.getSkills().subscribe(res => this.availableSkills = res || []);
  }

  addSkill(): void {
    if (!this.newSkillId) return;
    const found = this.availableSkills.find(s => s.id === this.newSkillId);
    if (found && !this.selectedSkills.some(s => s.skillId === found.id)) {
      this.selectedSkills.push({
        skillId: found.id,
        skillName: found.name,
        requirement: this.newSkillRequirement,
        weight: 1.0
      });
      this.newSkillId = null;
    }
  }

  removeSkill(index: number): void {
    this.selectedSkills.splice(index, 1);
  }

  submitListing(publish: boolean): void {
    if (!this.title.trim()) {
      this.errorMessage = 'Please enter a title for the listing.';
      return;
    }
    if (!this.description.trim()) {
      this.errorMessage = 'Please enter a description.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const payload = {
      listingType: this.listingType,
      title: this.title,
      description: this.description,
      serviceCategoryId: this.serviceCategoryId,
      locationId: this.locationId,
      isRemote: this.isRemote,
      availabilityRequired: this.availabilityRequired,
      seniority: this.seniority,
      budgetMin: this.budgetMin,
      budgetMax: this.budgetMax,
      currency: 'ETB',
      skills: this.selectedSkills.map(s => ({
        skillId: s.skillId,
        requirement: s.requirement,
        weight: s.weight
      }))
    };

    this.apiService.createListing(payload).subscribe({
      next: (created) => {
        if (publish) {
          this.apiService.publishListing(created.id).subscribe({
            next: () => {
              this.submitting = false;
              this.router.navigate(['/listings', created.id]);
            },
            error: () => {
              this.submitting = false;
              this.router.navigate(['/listings', created.id]);
            }
          });
        } else {
          this.submitting = false;
          this.router.navigate(['/listings', created.id]);
        }
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to create listing. Please check required fields.';
      }
    });
  }
}
