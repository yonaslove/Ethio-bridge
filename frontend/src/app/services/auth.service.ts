import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, timeout, retry } from 'rxjs';
import { User, AuthResponse, LoginPayload, RegisterPayload } from '../models/models';
import { environment } from '../../environments/environment';

export interface PersonaQuickOption {
  id: string;
  userId?: string;
  name: string;
  email: string;
  roleBadge: string;
  description: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiBaseUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  public isLoggedIn$ = this.currentUser$.pipe(map(user => user !== null));

  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.restoreSession();
    this.pingWarmup();
  }

  public getDemoPersonas(): Observable<PersonaQuickOption[]> {
    return this.http.get<PersonaQuickOption[]>(`${this.apiBaseUrl}/auth/demo-personas`);
  }

  public pingWarmup(): void {
    // Fire-and-forget lightweight ping to wake backend container from sleep mode
    const healthUrl = this.apiBaseUrl.replace(/\/api\/v1\/?$/, '/actuator/health');
    this.http.get(healthUrl).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  private restoreSession(): void {
    const token = localStorage.getItem('ethiobridge_token');
    const userJson = localStorage.getItem('ethiobridge_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return this.tokenSubject.value;
  }

  public isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null && !!this.tokenSubject.value;
  }

  public login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, payload).pipe(
      timeout(45000), // Render free tier container spin-up can take up to 35-40s on dormant start
      tap(res => this.persistSession(res))
    );
  }

  public register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/register`, payload);
  }

  public quickLoginAs(personaOrId: string | PersonaQuickOption): Observable<AuthResponse> {
    const email = typeof personaOrId === 'object'
      ? personaOrId.email
      : (personaOrId.includes('@') ? personaOrId : `${personaOrId}@ethiobridge.et`);
    return this.login({ emailOrUsername: email, password: 'password123' });
  }

  public logout(): void {
    const t = this.token;
    if (t) {
      this.http.post(`${this.apiBaseUrl}/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${t}` }
      }).subscribe({ next: () => {}, error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/']);
  }

  private persistSession(res: AuthResponse): void {
    const token = res.token;
    const user = res.user;

    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);

    localStorage.setItem('ethiobridge_token', token);
    localStorage.setItem('ethiobridge_user', JSON.stringify(user));
    if ((res as any).refreshToken) {
      localStorage.setItem('ethiobridge_refresh_token', (res as any).refreshToken);
    }
  }

  private clearSession(): void {
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    localStorage.removeItem('ethiobridge_token');
    localStorage.removeItem('ethiobridge_user');
    localStorage.removeItem('ethiobridge_refresh_token');
  }

  public forgotPassword(identifier: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBaseUrl}/auth/forgot-password`, { identifier });
  }

  public resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBaseUrl}/auth/reset-password`, { token, newPassword });
  }

  public sendPhoneOtp(phoneNumber?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiBaseUrl}/auth/send-phone-otp`, { phoneNumber }, { headers: this.getAuthHeaders() });
  }

  public verifyPhoneOtp(code: string, phoneNumber?: string): Observable<{ verified: boolean; message: string }> {
    return this.http.post<{ verified: boolean; message: string }>(`${this.apiBaseUrl}/auth/verify-phone-otp`, { code, phoneNumber }, { headers: this.getAuthHeaders() });
  }

  public refreshToken(): Observable<AuthResponse> {
    const rf = localStorage.getItem('ethiobridge_refresh_token');
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/refresh`, { refreshToken: rf }).pipe(
      tap(res => this.persistSession(res))
    );
  }

  public isSeeker(): boolean {
    const u = this.currentUserSubject.value;
    return !!u && u.roles.includes('SEEKER');
  }

  public isProvider(): boolean {
    const u = this.currentUserSubject.value;
    return !!u && u.roles.includes('PROVIDER');
  }

  public isAdmin(): boolean {
    const u = this.currentUserSubject.value;
    return !!u && u.roles.includes('ADMIN');
  }

  public hasRole(role: string): boolean {
    const u = this.currentUserSubject.value;
    return !!u && u.roles.includes(role);
  }

  public getAuthHeaders(): { [key: string]: string } {
    const t = this.token;
    if (t) {
      return { 'Authorization': `Bearer ${t}` };
    }
    return {};
  }
}
