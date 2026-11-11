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
            <div class="type-card" [class.selected]="listingType === 'JOB'" (click)="onPillarChange('JOB')">
              <div class="type-icon">💼</div>
              <div class="type-title">Employment</div>
              <p class="type-desc">Full-time or part-time staff positions for software companies and organizations</p>
            </div>

            <div class="type-card" [class.selected]="listingType === 'FREELANCE_PROJECT'" (click)="onPillarChange('FREELANCE_PROJECT')">
              <div class="type-icon">💻</div>
              <div class="type-title">Freelance Project</div>
              <p class="type-desc">Contract or milestone-based deliverables (Web apps, designs, translation)</p>
            </div>

            <div class="type-card" [class.selected]="listingType === 'LOCAL_SERVICE_REQUEST'" (click)="onPillarChange('LOCAL_SERVICE_REQUEST')">
              <div class="type-icon">🔧</div>
              <div class="type-title">Local Service Request</div>
              <p class="type-desc">On-site specialized trade or technician assistance (Electricians, plumbing, tutoring)</p>
            </div>
          </div>
        </div>

        <!-- Step 2: Basic Details -->
        <div class="form-section">
          <h3>
            2. 
            <span *ngIf="listingType === 'JOB'">Job Opening Details</span>
            <span *ngIf="listingType === 'FREELANCE_PROJECT'">Freelance Project Scope</span>
            <span *ngIf="listingType === 'LOCAL_SERVICE_REQUEST'">Service Request Details</span>
          </h3>

          <div class="form-group">
            <label class="form-label">
              {{ listingType === 'JOB' ? 'Job Title *' : (listingType === 'FREELANCE_PROJECT' ? 'Project Title *' : 'Service Needed *') }}
            </label>
            <input 
              type="text" 
              [(ngModel)]="title" 
              class="form-input" 
              [placeholder]="listingType === 'JOB' ? 'e.g. Senior Java Backend Architect' : (listingType === 'FREELANCE_PROJECT' ? 'e.g. Flutter Mobile E-Commerce App' : 'e.g. House Rewiring & Circuit Breaker Repair')" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              {{ listingType === 'JOB' ? 'Role Description & Requirements *' : (listingType === 'FREELANCE_PROJECT' ? 'Project Deliverables & Milestones *' : 'Issue Description & Work Required *') }}
            </label>
            <textarea 
              [(ngModel)]="description" 
              rows="5" 
              class="form-textarea" 
              [placeholder]="listingType === 'JOB' ? 'Describe responsibilities, day-to-day work, qualifications, and benefits...' : (listingType === 'FREELANCE_PROJECT' ? 'Detail the scope of work, expected deliverables, milestones, and tech stack...' : 'Describe what needs fixing or building, site conditions, and preferred schedule...')"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">
                {{ listingType === 'LOCAL_SERVICE_REQUEST' ? 'Trade Category *' : 'Industry / Domain Category' }}
              </label>
              <select [(ngModel)]="serviceCategoryId" class="form-select">
                <option [ngValue]="null">Select category...</option>
                <option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                {{ listingType === 'LOCAL_SERVICE_REQUEST' ? 'Service Location (Addis Ababa Sub-City / Region) *' : 'Location' }}
              </label>
              <select [(ngModel)]="locationId" class="form-select">
                <option [ngValue]="null">Select location...</option>
                <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }} ({{ loc.region }})</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4" [ngClass]="listingType === 'LOCAL_SERVICE_REQUEST' ? 'grid-cols-2' : 'grid-cols-3'">
            <!-- Remote option: Not relevant for local on-site physical trades -->
            <div class="form-group" *ngIf="listingType !== 'LOCAL_SERVICE_REQUEST'">
              <label class="form-label">Work Arrangement</label>
              <select [(ngModel)]="isRemote" class="form-select">
                <option [ngValue]="false">On-Site Only</option>
                <option [ngValue]="true">Remote / Hybrid Allowed</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                {{ listingType === 'LOCAL_SERVICE_REQUEST' ? 'Service Schedule / Urgency' : 'Availability / Commitment' }}
              </label>
              <select [(ngModel)]="availabilityRequired" class="form-select">
                <ng-container *ngIf="listingType === 'JOB'">
                  <option value="FULL_TIME">Full Time (40 hrs/wk)</option>
                  <option value="PART_TIME">Part Time (20 hrs/wk)</option>
                </ng-container>
                <ng-container *ngIf="listingType === 'FREELANCE_PROJECT'">
                  <option value="ONE_OFF">Fixed Milestone Contract</option>
                  <option value="HOURLY">Hourly Retainer</option>
                  <option value="PART_TIME">Part-Time Ongoing</option>
                </ng-container>
                <ng-container *ngIf="listingType === 'LOCAL_SERVICE_REQUEST'">
                  <option value="ONE_OFF">Emergency / Immediate Dispatch</option>
                  <option value="HOURLY">Scheduled Day Service</option>
                  <option value="PART_TIME">Recurring Maintenance</option>
                </ng-container>
              </select>
            </div>

            <div class="form-group" *ngIf="listingType === 'JOB' || listingType === 'FREELANCE_PROJECT'">
              <label class="form-label">Experience Level Required</label>
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
          <h3>
            3. 
            <span *ngIf="listingType === 'JOB'">Required & Preferred Qualifications</span>
            <span *ngIf="listingType === 'FREELANCE_PROJECT'">Required Technical Stack & Skills</span>
            <span *ngIf="listingType === 'LOCAL_SERVICE_REQUEST'">Required Trade Skills & Certifications</span>
          </h3>
          <p class="section-hint">
            {{ listingType === 'LOCAL_SERVICE_REQUEST' 
                ? 'Specify required trade capabilities (e.g. Electrical wiring, plumbing, HVAC) for local dispatch matching.' 
                : 'Add skills used by the AI semantic engine to rank and match top Ethiopian candidate profiles.' }}
          </p>

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
          <h3>
            4. 
            <span *ngIf="listingType === 'JOB'">Monthly Salary Range (ETB)</span>
            <span *ngIf="listingType === 'FREELANCE_PROJECT'">Escrow Project Budget (ETB)</span>
            <span *ngIf="listingType === 'LOCAL_SERVICE_REQUEST'">Service Fee / Labor Budget (ETB)</span>
          </h3>
          <p class="section-hint" *ngIf="listingType === 'FREELANCE_PROJECT'">
            Secured via Chapa/Telebirr Milestone Escrow. Funds are released upon deliverable approval.
          </p>
          <p class="section-hint" *ngIf="listingType === 'LOCAL_SERVICE_REQUEST'">
            Estimated labor and service cost. Materials can be quoted separately on-site.
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">
                {{ listingType === 'JOB' ? 'Minimum Monthly Salary (ETB)' : 'Minimum Budget (ETB)' }}
              </label>
              <input type="number" [(ngModel)]="budgetMin" class="form-input" [placeholder]="listingType === 'JOB' ? 'e.g. 25000' : (listingType === 'FREELANCE_PROJECT' ? 'e.g. 15000' : 'e.g. 1500')" />
            </div>
            <div class="form-group">
              <label class="form-label">
                {{ listingType === 'JOB' ? 'Maximum Monthly Salary (ETB)' : 'Maximum Budget (ETB)' }}
              </label>
              <input type="number" [(ngModel)]="budgetMax" class="form-input" [placeholder]="listingType === 'JOB' ? 'e.g. 50000' : (listingType === 'FREELANCE_PROJECT' ? 'e.g. 35000' : 'e.g. 3500')" />
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

  onPillarChange(type: ListingType): void {
    this.listingType = type;
    if (type === 'JOB') {
      this.isRemote = false;
      this.availabilityRequired = 'FULL_TIME';
      this.seniority = 'MID';
    } else if (type === 'FREELANCE_PROJECT') {
      this.isRemote = true;
      this.availabilityRequired = 'ONE_OFF';
      this.seniority = 'MID';
    } else if (type === 'LOCAL_SERVICE_REQUEST') {
      this.isRemote = false; // Trades like electricians/plumbers must be on-site
      this.availabilityRequired = 'ONE_OFF';
      this.seniority = 'ANY';
    }
  }

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
