import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyListingsComponent } from './my-listings.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { of } from 'rxjs';

describe('MyListingsComponent', () => {
  let component: MyListingsComponent;
  let fixture: ComponentFixture<MyListingsComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockListing = {
    id: 'listing-1',
    title: 'Senior Java Backend Specialist',
    status: 'OPEN',
    listingType: 'FORMAL_JOB',
    budgetMin: 15000,
    budgetMax: 25000,
    currency: 'ETB'
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getMyListings',
      'publishListing',
      'closeListing',
      'deleteListing'
    ]);
    apiServiceSpy.getMyListings.and.returnValue(of([mockListing as any]));

    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [MyListingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MyListingsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load my listings on initialization', () => {
    expect(component.listings.length).toBe(1);
    expect(component.listings[0].title).toBe('Senior Java Backend Specialist');
  });
});
