import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getListings',
      'getServiceCategories',
      'getLocations'
    ]);
    apiServiceSpy.getListings.and.returnValue(of({ data: [], totalElements: 0 } as any));
    apiServiceSpy.getServiceCategories.and.returnValue(of([]));
    apiServiceSpy.getLocations.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy },
        {
          provide: AuthService,
          useValue: {
            userSnapshot: null,
            isLoggedIn: () => false
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create LandingComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should switch between seeker and provider perspectives', () => {
    expect(component.selectedPillar).toBeDefined();
  });
});
