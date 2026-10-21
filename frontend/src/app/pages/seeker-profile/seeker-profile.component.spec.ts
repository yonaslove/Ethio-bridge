import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeekerProfileComponent } from './seeker-profile.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('SeekerProfileComponent', () => {
  let component: SeekerProfileComponent;
  let fixture: ComponentFixture<SeekerProfileComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProfile = {
    id: 'seeker-profile-1',
    userId: 'seeker-1',
    headline: 'Lead Recruiter at Addis Systems',
    bio: 'Looking for top Ethiopian engineers'
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getMySeekerProfile',
      'getLocations',
      'updateSeekerProfile'
    ]);
    apiServiceSpy.getMySeekerProfile.and.returnValue(of(mockProfile as any));
    apiServiceSpy.getLocations.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SeekerProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SeekerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create SeekerProfileComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load seeker profile details on initialization', () => {
    expect(component.profile).toBeTruthy();
    expect(component.profile?.headline).toBe('Lead Recruiter at Addis Systems');
  });
});
