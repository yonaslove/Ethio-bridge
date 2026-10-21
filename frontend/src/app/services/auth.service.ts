import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { User, AuthResponse, LoginPayload, RegisterPayload } from '../models/models';
import { environment } from '../../environments/environment';

export interface PersonaQuickOption {
  id: string;
  name: string;
  email: string;
  roleBadge: string;
  description: string;
}

export const TEST_PERSONAS: PersonaQuickOption[] = [
  { id: 'seeker1', name: 'Sara Bekele', email: 'seeker1@ethiobridge.et', roleBadge: 'Talent Seeker / Client', description: 'Tech recruiter posting jobs & projects' },
  { id: 'provider1', name: 'Dawit Tadesse', email: 'provider1@ethiobridge.et', roleBadge: 'Senior Backend Provider', description: 'Java, Spring Boot & PostgreSQL developer' },
  { id: 'provider2', name: 'Bethlehem Haile', email: 'provider2@ethiobridge.et', roleBadge: 'Full-Stack Provider', description: 'Angular, TypeScript & UI designer' },
  { id: 'dualuser', name: 'Abebe Kebede', email: 'dualuser@ethiobridge.et', roleBadge: 'Dual Role (Client & Electrician)', description: 'Contract client & licensed trade professional' },
  { id: 'admin', name: 'System Administrator', email: 'admin@ethiobridge.et', roleBadge: 'Platform Admin', description: 'Governance, taxonomy & verification' }
];

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
      tap(res => this.persistSession(res))
    );
  }

  public register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/register`, payload);
  }

  public quickLoginAs(personaId: string): Observable<AuthResponse> {
    const persona = TEST_PERSONAS.find(p => p.id === personaId);
    const email = persona ? persona.email : `${personaId}@ethiobridge.et`;
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
  }

  private clearSession(): void {
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    localStorage.removeItem('ethiobridge_token');
    localStorage.removeItem('ethiobridge_user');
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
