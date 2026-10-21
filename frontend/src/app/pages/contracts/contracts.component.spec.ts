import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContractsComponent } from './contracts.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { of } from 'rxjs';

describe('ContractsComponent', () => {
  let component: ContractsComponent;
  let fixture: ComponentFixture<ContractsComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockContract = {
    id: 'contract-1',
    title: 'Fintech Mobile Integration',
    seekerUserId: 'seeker-1',
    providerUserId: 'provider-1',
    status: 'ACTIVE',
    totalAmount: 6000,
    currency: 'ETB',
    milestones: [
      {
        id: 'milestone-1',
        contractId: 'contract-1',
        title: 'Phase 1: Backend API',
        amount: 3000,
        status: 'PENDING'
      }
    ]
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getContracts',
      'initializeChapaPayment',
      'verifyChapaPayment',
      'submitDeliverable',
      'releaseMilestone',
      'raiseDispute'
    ]);
    apiServiceSpy.getContracts.and.returnValue(of([mockContract as any]));

    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [ContractsComponent],
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
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        {
          provide: AuthService,
          useValue: {
            userSnapshot: { userId: 'seeker-1', email: 'seeker@ethiobridge.et', roles: ['SEEKER'] }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ContractsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load contracts on initialization', () => {
    expect(component.contracts.length).toBe(1);
    expect(component.contracts[0].title).toBe('Fintech Mobile Integration');
  });

  it('should trigger Chapa checkout initialization on payMilestoneDirectWithChapa', () => {
    apiServiceSpy.initializeChapaPayment.and.returnValue(of({
      checkoutUrl: 'https://checkout.chapa.co/test/pay',
      txRef: 'CHP-12345'
    }));

    component.payMilestoneDirectWithChapa(mockContract as any, mockContract.milestones[0] as any);

    expect(apiServiceSpy.initializeChapaPayment).toHaveBeenCalledWith(
      'contract-1',
      'milestone-1',
      3000,
      jasmine.stringMatching(/Milestone Escrow Funding/)
    );
  });

  it('should open and close deliverable review modal', () => {
    component.openReviewModal(mockContract as any, mockContract.milestones[0] as any);
    expect(component.selectedContract).toEqual(mockContract as any);
    expect(component.selectedMilestone).toEqual(mockContract.milestones[0] as any);

    component.closeModals();
    expect(component.selectedContract).toBeNull();
    expect(component.selectedMilestone).toBeNull();
  });
});
