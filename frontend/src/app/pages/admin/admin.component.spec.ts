import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getAdminUsers',
      'getAdminVerifications',
      'getAdminReports',
      'getAdminDisputes',
      'getAdminAuditLogs',
      'getMonetizationStats',
      'getSkills',
      'getSkillCategories'
    ]);

    apiServiceSpy.getAdminUsers.and.returnValue(of([]));
    apiServiceSpy.getAdminVerifications.and.returnValue(of([]));
    apiServiceSpy.getAdminReports.and.returnValue(of([]));
    apiServiceSpy.getAdminDisputes.and.returnValue(of([]));
    apiServiceSpy.getAdminAuditLogs.and.returnValue(of([]));
    apiServiceSpy.getMonetizationStats.and.returnValue(of({
      totalRevenue: 5000,
      escrowCommissionRevenue: 2000,
      connectsRevenue: 1000,
      proSubscriptionRevenue: 1000,
      featuredListingRevenue: 1000,
      recentTransactions: []
    } as any));
    apiServiceSpy.getSkills.and.returnValue(of([]));
    apiServiceSpy.getSkillCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create AdminComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should switch admin tabs correctly', () => {
    expect(component.currentTab).toBe('monetization');

    component.switchTab('verifications');
    expect(component.currentTab).toBe('verifications');

    component.switchTab('disputes');
    expect(component.currentTab).toBe('disputes');
  });

  it('should load monetization revenue stats', () => {
    expect(component.monetizationStats).toBeTruthy();
    expect(component.monetizationStats?.totalRevenue).toBe(5000);
  });
});
