import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getLocations', 'getSkills']);
    apiServiceSpy.getLocations.and.returnValue(of([]));
    apiServiceSpy.getSkills.and.returnValue(of([]));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create RegisterComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should switch role to PROVIDER or SEEKER', () => {
    component.selectedRole = 'SEEKER';
    expect(component.selectedRole).toBe('SEEKER');
    component.selectedRole = 'PROVIDER';
    expect(component.selectedRole).toBe('PROVIDER');
  });

  it('should validate password policy rules', () => {
    component.password = 'weak';
    expect(component.passwordValid).toBeFalse();

    component.password = 'StrongSecret123';
    expect(component.passwordValid).toBeTrue();
  });
});
