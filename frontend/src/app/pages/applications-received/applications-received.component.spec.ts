import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationsReceivedComponent } from './applications-received.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('ApplicationsReceivedComponent', () => {
  let component: ApplicationsReceivedComponent;
  let fixture: ComponentFixture<ApplicationsReceivedComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockListing = {
    id: 'listing-1',
    title: 'Senior Java Backend Specialist'
  };

  const mockApplication = {
    id: 'app-1',
    listingId: 'listing-1',
    applicantUserId: 'provider-1',
    applicantName: 'Dawit Tadesse',
    applicantEmail: 'dawit@ethiobridge.et',
    status: 'SUBMITTED',
    proposedRate: 15000,
    coverLetter: 'I have 5 years experience.'
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getListing',
      'getApplicationsForListing',
      'updateApplicationStatus',
      'createOrGetThread',
      'initializeChapaPayment'
    ]);
    apiServiceSpy.getListing.and.returnValue(of(mockListing as any));
    apiServiceSpy.getApplicationsForListing.and.returnValue(of([mockApplication as any]));

    await TestBed.configureTestingModule({
      imports: [ApplicationsReceivedComponent],
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

    fixture = TestBed.createComponent(ApplicationsReceivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ApplicationsReceivedComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load received applications on initialization', () => {
    expect(component.applications.length).toBe(1);
    expect(component.applications[0].applicantName).toBe('Dawit Tadesse');
    expect(component.applications[0].status).toBe('SUBMITTED');
  });

  it('should trigger status update on application', () => {
    apiServiceSpy.updateApplicationStatus.and.returnValue(of({
      ...mockApplication,
      status: 'SHORTLISTED'
    } as any));

    component.updateStatus(mockApplication as any, 'SHORTLISTED');
    expect(apiServiceSpy.updateApplicationStatus).toHaveBeenCalledWith('listing-1', 'app-1', 'SHORTLISTED');
  });
});
