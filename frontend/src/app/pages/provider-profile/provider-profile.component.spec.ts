import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProviderProfileComponent } from './provider-profile.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { of } from 'rxjs';

describe('ProviderProfileComponent', () => {
  let component: ProviderProfileComponent;
  let fixture: ComponentFixture<ProviderProfileComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockProfile = {
    id: 'profile-1',
    userId: 'user-1',
    headline: 'Senior Java Backend Specialist',
    bio: 'Professional software developer',
    connectsBalance: 20,
    skills: []
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getMyProviderProfile',
      'getLocations',
      'getSkills',
      'updateProviderProfile',
      'topUpConnects',
      'verifyConnectsTopup',
      'subscribeToPro'
    ]);
    apiServiceSpy.getMyProviderProfile.and.returnValue(of(mockProfile as any));
    apiServiceSpy.getLocations.and.returnValue(of([]));
    apiServiceSpy.getSkills.and.returnValue(of([]));

    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [ProviderProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ProviderProfileComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load provider profile details and connects balance', () => {
    expect(component.profile).toBeTruthy();
    expect(component.profile?.headline).toBe('Senior Java Backend Specialist');
    expect(component.profile?.connectsBalance).toBe(20);
  });

  it('should calculate package price properly', () => {
    component.selectedConnectsPackage = 30;
    expect(component.getPackagePrice(30)).toBe(120);

    component.selectedConnectsPackage = 60;
    expect(component.getPackagePrice(60)).toBe(200);
  });
});
