import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SeekerProfile, Location } from '../../models/models';

@Component({
  selector: 'app-seeker-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container seeker-profile-page">
      <div class="header-section">
        <h1>Seeker Profile</h1>
        <p>Information presented to applicants when reviewing your published listings</p>
      </div>

      <div *ngIf="savedSuccess" class="alert-success" style="margin-bottom: 1.5rem;">
        Seeker profile updated successfully!
      </div>

      <div class="card form-card" *ngIf="profile">
        <div class="form-group">
          <label class="form-label">Company / Organization / Headline</label>
          <input type="text" [(ngModel)]="profile.headline" class="form-input" placeholder="e.g. Lead Recruiter at Addis Systems" />
        </div>

        <div class="form-group">
          <label class="form-label">About You or Your Organization</label>
          <textarea [(ngModel)]="profile.bio" rows="4" class="form-textarea" placeholder="Describe your hiring needs, mission, or company culture..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Headquarters / Location</label>
          <select [(ngModel)]="profile.locationId" class="form-select">
            <option [ngValue]="null">Select location...</option>
            <option *ngFor="let loc of locations" [ngValue]="loc.id">{{ loc.name }}</option>
          </select>
        </div>

        <div style="margin-top: 1.5rem;">
          <button (click)="saveProfile()" [disabled]="saving" class="btn btn-primary">
            {{ saving ? 'Saving...' : 'Save Seeker Profile' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .seeker-profile-page {
      padding: 2.5rem 1.5rem 5rem;
      max-width: 750px;
    }
    .header-section {
      margin-bottom: 2rem;
    }
    .form-card {
      background: #FFFFFF;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .alert-success {
      background-color: rgba(46, 125, 50, 0.12);
      color: var(--color-success);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-weight: 600;
    }
  `]
})
export class SeekerProfileComponent implements OnInit {
  profile?: SeekerProfile;
  locations: Location[] = [];
  saving = false;
  savedSuccess = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getLocations().subscribe(l => this.locations = l || []);
    this.apiService.getSeekerProfile().subscribe(p => this.profile = p);
  }

  saveProfile(): void {
    if (!this.profile) return;
    this.saving = true;
    this.savedSuccess = false;

    this.apiService.updateSeekerProfile({
      headline: this.profile.headline,
      bio: this.profile.bio,
      locationId: this.profile.locationId
    }).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.saving = false;
        this.savedSuccess = true;
        setTimeout(() => this.savedSuccess = false, 4000);
      },
      error: () => this.saving = false
    });
  }
}
