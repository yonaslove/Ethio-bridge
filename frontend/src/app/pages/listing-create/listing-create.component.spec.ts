import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListingCreateComponent } from './listing-create.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('ListingCreateComponent', () => {
  let component: ListingCreateComponent;
  let fixture: ComponentFixture<ListingCreateComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getServiceCategories',
      'getLocations',
      'getSkills',
      'createListing',
      'getListing',
      'updateListing'
    ]);
    apiServiceSpy.getServiceCategories.and.returnValue(of([]));
    apiServiceSpy.getLocations.and.returnValue(of([]));
    apiServiceSpy.getSkills.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ListingCreateComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => null } },
            paramMap: of({ get: () => null })
          }
        },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListingCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ListingCreateComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should allow switching between marketplace pillars', () => {
    component.listingType = 'JOB';
    expect(component.listingType).toBe('JOB');

    component.listingType = 'FREELANCE_PROJECT';
    expect(component.listingType).toBe('FREELANCE_PROJECT');

    component.listingType = 'LOCAL_SERVICE_REQUEST';
    expect(component.listingType).toBe('LOCAL_SERVICE_REQUEST');
  });
});
