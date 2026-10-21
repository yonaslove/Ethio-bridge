import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Hidden on landing ('/'), login ('/login'), register ('/register'), and for all guests
  readonly isAllowedOnCurrentRoute = signal<boolean>(false);
  readonly isOpen = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  constructor() {
    this.updateRouteState(this.getEffectiveUrl());

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.updateRouteState(e.urlAfterRedirects || e.url);
    });

    // When auth state changes (login/logout), immediately re-evaluate
    this.authService.currentUser$.subscribe(() => {
      this.updateRouteState(this.getEffectiveUrl());
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        // If transitioning to mobile, automatically close
        if (window.innerWidth < 1024 && this.isOpen()) {
          this.isOpen.set(false);
        }
      });
    }
  }

  private getEffectiveUrl(): string {
    if (this.router.url && this.router.url !== '/' && this.router.url !== '') {
      return this.router.url;
    }
    if (typeof window !== 'undefined' && window.location) {
      return window.location.pathname || '/';
    }
    return this.router.url || '/';
  }

  public updateRouteState(url: string): void {
    const raw = (url || this.getEffectiveUrl() || '').split('?')[0].split('#')[0].toLowerCase().trim();
    const cleanUrl = raw.length > 1 && raw.endsWith('/') ? raw.slice(0, -1) : raw;

    // 1. Strict blacklist: NEVER render on landing, login, register, browse, terms, privacy, or public provider pages
    if (
      cleanUrl === '' ||
      cleanUrl === '/' ||
      cleanUrl === '/index.html' ||
      cleanUrl === '/login' ||
      cleanUrl.startsWith('/login') ||
      cleanUrl === '/register' ||
      cleanUrl.startsWith('/register') ||
      cleanUrl === '/browse' ||
      cleanUrl.startsWith('/browse') ||
      cleanUrl === '/terms' ||
      cleanUrl === '/privacy' ||
      cleanUrl.startsWith('/providers/') ||
      this.isListingDetailRoute(cleanUrl)
    ) {
      this.isAllowedOnCurrentRoute.set(false);
      return;
    }

    // 2. Unauthenticated visitors / guests NEVER get workspace sidebar
    if (!this.authService.isAuthenticated()) {
      this.isAllowedOnCurrentRoute.set(false);
      return;
    }

    // 3. Whitelist: Only active on authenticated employer, provider, or admin portal pages
    const isWorkspaceRoute =
      cleanUrl === '/contracts' || cleanUrl.startsWith('/contracts') ||
      cleanUrl === '/messages' || cleanUrl.startsWith('/messages') ||
      cleanUrl === '/listings/new' ||
      cleanUrl === '/listings/my' ||
      cleanUrl.includes('/candidates') ||
      cleanUrl.includes('/applications') ||
      cleanUrl.includes('/edit') ||
      cleanUrl === '/profile/provider' ||
      cleanUrl === '/profile/seeker' ||
      cleanUrl === '/recommended' ||
      cleanUrl === '/my-applications' ||
      cleanUrl === '/admin' || cleanUrl.startsWith('/admin') ||
      cleanUrl === '/evaluation' ||
      cleanUrl === '/verification';

    this.isAllowedOnCurrentRoute.set(isWorkspaceRoute);
  }

  private isListingDetailRoute(url: string): boolean {
    if (!url.startsWith('/listings/')) return false;
    const sub = url.substring('/listings/'.length);
    if (!sub || sub === 'new' || sub === 'my') return false;
    if (sub.includes('/candidates') || sub.includes('/applications') || sub.includes('/edit')) return false;
    return true;
  }

  toggle(): void {
    if (this.isAllowedOnCurrentRoute()) {
      this.isOpen.update(v => !v);
    }
  }

  open(): void {
    if (this.isAllowedOnCurrentRoute()) {
      this.isOpen.set(true);
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  closeIfMobile(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.close();
    }
  }
}
