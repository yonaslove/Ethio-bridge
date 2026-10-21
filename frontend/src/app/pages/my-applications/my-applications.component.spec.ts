import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyApplicationsComponent } from './my-applications.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('MyApplicationsComponent', () => {
  let component: MyApplicationsComponent;
  let fixture: ComponentFixture<MyApplicationsComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockApp = {
    id: 'app-1',
    listingId: 'listing-1',
    status: 'SUBMITTED',
    proposedRate: 12000,
    coverLetter: 'Experienced full stack developer'
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getMyApplications', 'withdrawApplication']);
    apiServiceSpy.getMyApplications.and.returnValue(of([mockApp as any]));

    await TestBed.configureTestingModule({
      imports: [MyApplicationsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MyApplicationsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load my applications on initialization', () => {
    expect(component.applications.length).toBe(1);
    expect(component.applications[0].status).toBe('SUBMITTED');
  });

  it('should return correct badge class for application status', () => {
    expect(component.getStatusBadgeClass('SUBMITTED')).toBe('badge-status-submitted');
    expect(component.getStatusBadgeClass('ACCEPTED')).toBe('badge-status-accepted');
    expect(component.getStatusBadgeClass('REJECTED')).toBe('badge-status-rejected');
  });
});
