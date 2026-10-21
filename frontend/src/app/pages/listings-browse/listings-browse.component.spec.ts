import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListingsBrowseComponent } from './listings-browse.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('ListingsBrowseComponent', () => {
  let component: ListingsBrowseComponent;
  let fixture: ComponentFixture<ListingsBrowseComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getListings',
      'getServiceCategories',
      'getLocations',
      'searchProviders'
    ]);

    apiServiceSpy.getListings.and.returnValue(of({
      data: [
        {
          id: 'listing-1',
          title: 'Senior Java Backend Specialist',
          description: 'Build enterprise microservices',
          budgetMin: 15000,
          budgetMax: 25000,
          currency: 'ETB',
          status: 'OPEN',
          listingType: 'FORMAL_JOB'
        }
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1
    } as any));

    apiServiceSpy.getServiceCategories.and.returnValue(of([]));
    apiServiceSpy.getLocations.and.returnValue(of([]));
    apiServiceSpy.searchProviders.and.returnValue(of({
      data: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0
    } as any));

    await TestBed.configureTestingModule({
      imports: [ListingsBrowseComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListingsBrowseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ListingsBrowseComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load listings on initialization', () => {
    expect(component.listings.length).toBe(1);
    expect(component.listings[0].title).toBe('Senior Java Backend Specialist');
  });

  it('should switch between Opportunities and Talent tabs', () => {
    expect(component.activeTab).toBe('listings');

    component.switchTab('talent');
    expect(component.activeTab).toBe('talent');
    expect(apiServiceSpy.searchProviders).toHaveBeenCalled();

    component.switchTab('listings');
    expect(component.activeTab).toBe('listings');
  });
});
