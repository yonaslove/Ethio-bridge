import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommendedListingsComponent } from './recommended-listings.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('RecommendedListingsComponent', () => {
  let component: RecommendedListingsComponent;
  let fixture: ComponentFixture<RecommendedListingsComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockListing = {
    id: 'listing-1',
    title: 'Senior Java Backend Specialist',
    listingType: 'FORMAL_JOB',
    budgetMin: 15000,
    budgetMax: 25000,
    currency: 'ETB'
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getRecommendedListings']);
    apiServiceSpy.getRecommendedListings.and.returnValue(of([mockListing as any]));

    await TestBed.configureTestingModule({
      imports: [RecommendedListingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendedListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create RecommendedListingsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load AI recommended listings on initialization', () => {
    expect(component.listings.length).toBe(1);
    expect(component.listings[0].title).toBe('Senior Java Backend Specialist');
  });
});
