import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandidatesViewComponent } from './candidates-view.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('CandidatesViewComponent', () => {
  let component: CandidatesViewComponent;
  let fixture: ComponentFixture<CandidatesViewComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockListing = {
    id: 'listing-1',
    title: 'Senior Java Backend Specialist',
    listingType: 'FORMAL_JOB',
    status: 'OPEN'
  };

  const mockMatchResponse = {
    listingId: 'listing-1',
    method: 'AI',
    k: 5,
    model: 'sublinear-tfidf-char3gram-v1',
    modelVersion: '1.0.0',
    latencyMs: 15,
    degraded: false,
    results: [
      {
        rank: 1,
        score: 0.92,
        displayName: 'Dawit Tadesse',
        headline: 'Senior Java Developer',
        locationName: 'Addis Ababa',
        explanation: {
          summary: 'Semantic match based on Spring Boot & Microservices experience',
          factors: []
        }
      }
    ]
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getListing',
      'getCandidates',
      'recordMatchFeedback'
    ]);
    apiServiceSpy.getListing.and.returnValue(of(mockListing as any));
    apiServiceSpy.getCandidates.and.returnValue(of(mockMatchResponse as any));

    await TestBed.configureTestingModule({
      imports: [CandidatesViewComponent],
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
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CandidatesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create CandidatesViewComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load listing details and candidates on init', () => {
    expect(component.listing).toBeTruthy();
    expect(component.candidates.length).toBe(1);
    expect(component.candidates[0].displayName).toBe('Dawit Tadesse');
    expect(component.candidates[0].score).toBe(0.92);
  });

  it('should switch between AI semantic and keyword matching method', () => {
    component.setMethod('keyword');
    expect(component.selectedMethod).toBe('keyword');
    expect(apiServiceSpy.getCandidates).toHaveBeenCalledWith('listing-1', 'keyword', 10);

    component.setMethod('ai');
    expect(component.selectedMethod).toBe('ai');
    expect(apiServiceSpy.getCandidates).toHaveBeenCalledWith('listing-1', 'ai', 10);
  });
});
