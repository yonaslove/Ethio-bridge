import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'selectPersona'], {
      currentUser: of(null)
    });

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create LoginComponent instance', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility flag', () => {
    expect(component.showPassword).toBeFalse();
    component.showPassword = true;
    expect(component.showPassword).toBeTrue();
  });

  it('should display error message on empty credentials submit', () => {
    component.emailOrUsername = '';
    component.password = '';
    component.onSubmit();
    expect(component.errorMessage).toBeTruthy();
  });

  it('should populate credentials when selectPersona is called', () => {
    const persona = {
      label: 'Sara Bekele (Seeker)',
      identifier: 'seeker1',
      role: 'SEEKER',
      description: 'Test Seeker'
    };
    component.selectPersona(persona as any);
    expect(component.emailOrUsername).toBe('seeker1');
    expect(component.password).toBe('password123');
  });
});
