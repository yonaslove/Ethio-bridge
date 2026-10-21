import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificationComponent } from './verification.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('VerificationComponent', () => {
  let component: VerificationComponent;
  let fixture: ComponentFixture<VerificationComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getVerificationStatus',
      'submitVerification',
      'uploadFile'
    ]);
    apiServiceSpy.getVerificationStatus.and.returnValue(of({
      status: 'VERIFIED',
      idType: 'FAYDA_NATIONAL_ID',
      idNumber: 'FAN-1234-5678-ET',
      phoneNumber: '+251911223344',
      aiScore: 100,
      aiVerdict: 'RECOMMENDED_APPROVE'
    } as any));

    await TestBed.configureTestingModule({
      imports: [VerificationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create VerificationComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load verification status on initialization', () => {
    expect(component.verifStatus).toBeTruthy();
    expect(component.verifStatus?.status).toBe('VERIFIED');
    expect(component.verifStatus?.aiScore).toBe(100);
  });
});
