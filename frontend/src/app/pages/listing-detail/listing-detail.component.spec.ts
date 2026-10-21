import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListingDetailComponent } from './listing-detail.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { of } from 'rxjs';

describe('ListingDetailComponent', () => {
  let component: ListingDetailComponent;
  let fixture: ComponentFixture<ListingDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockListing = {
    id: 'listing-1',
    title: 'Senior Flutter Specialist',
    description: 'Build Ethiopian mobile apps',
    budgetMin: 20000,
    budgetMax: 30000,
    currency: 'ETB',
    status: 'OPEN',
    listingType: 'FREELANCE_PROJECT',
    ownerUserId: 'seeker-1'
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getListing',
      'getListingReviews',
      'getMyProviderProfile',
      'applyToListing',
      'topUpConnects',
      'createOrGetThread'
    ]);

    apiServiceSpy.getListing.and.returnValue(of(mockListing as any));
    apiServiceSpy.getListingReviews.and.returnValue(of([]));
    apiServiceSpy.getMyProviderProfile.and.returnValue(of({
      connectsBalance: 25
    } as any));

    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [ListingDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'listing-1' } },
            paramMap: of({ get: () => 'listing-1' })
          }
        },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        {
          provide: AuthService,
          useValue: {
            userSnapshot: { userId: 'provider-1', roles: ['PROVIDER'] },
            isProvider: () => true,
            isSeeker: () => false
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ListingDetailComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load listing details and provider connects balance', () => {
    expect(component.listing).toBeTruthy();
    expect(component.listing?.title).toBe('Senior Flutter Specialist');
    expect(component.myConnectsBalance).toBe(25);
  });

  it('should toggle application modal visibility', () => {
    expect(component.showApplyModal).toBeFalse();
    component.openApplyModal();
    expect(component.showApplyModal).toBeTrue();
    component.closeApplyModal();
    expect(component.showApplyModal).toBeFalse();
  });
});
