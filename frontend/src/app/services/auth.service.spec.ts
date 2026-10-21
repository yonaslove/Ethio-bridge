import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '../models/models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const user: User = {
    userId: 'u-1',
    keycloakSubject: 'kc-1',
    email: 'seeker1@ethiobridge.et',
    fullName: 'Sara Bekele',
    roles: ['SEEKER'],
    status: 'ACTIVE'
  };

  const authResponse: AuthResponse = {
    token: 'eb-test-token',
    tokenType: 'Bearer',
    user,
    roles: ['SEEKER']
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated when storage is empty', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token).toBeNull();
    expect(service.currentUser).toBeNull();
  });

  it('login posts credentials and persists the session', () => {
    let result: AuthResponse | undefined;
    service.login({ emailOrUsername: 'seeker1', password: 'password123' }).subscribe(res => (result = res));

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ emailOrUsername: 'seeker1', password: 'password123' });
    req.flush(authResponse);

    expect(result?.token).toBe('eb-test-token');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token).toBe('eb-test-token');
    expect(localStorage.getItem('ethiobridge_token')).toBe('eb-test-token');
    expect(localStorage.getItem('ethiobridge_user')).toContain('seeker1@ethiobridge.et');
  });

  it('restores a previously stored session on construction', () => {
    localStorage.setItem('ethiobridge_token', 'eb-stored');
    localStorage.setItem('ethiobridge_user', JSON.stringify(user));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    const restored = TestBed.inject(AuthService);

    expect(restored.isAuthenticated()).toBeTrue();
    expect(restored.token).toBe('eb-stored');
    expect(restored.currentUser?.fullName).toBe('Sara Bekele');
  });

  it('logout clears the session and stored credentials', () => {
    localStorage.setItem('ethiobridge_token', 'eb-stored');
    localStorage.setItem('ethiobridge_user', JSON.stringify(user));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    const fresh = TestBed.inject(AuthService);

    fresh.logout();

    expect(fresh.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('ethiobridge_token')).toBeNull();
    expect(localStorage.getItem('ethiobridge_user')).toBeNull();
  });

  it('derives role helpers from the current user', () => {
    service.login({ emailOrUsername: 'seeker1', password: 'password123' }).subscribe();
    httpMock.expectOne('http://localhost:8080/api/v1/auth/login').flush(authResponse);

    expect(service.isSeeker()).toBeTrue();
    expect(service.isProvider()).toBeFalse();
    expect(service.isAdmin()).toBeFalse();
    expect(service.hasRole('SEEKER')).toBeTrue();
    expect(service.getAuthHeaders()).toEqual({ Authorization: 'Bearer eb-test-token' });
  });
});
