import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, FooterComponent, ToastContainerComponent],
  template: `
    <div class="app-shell">
      <app-toast-container></app-toast-container>
      <app-navbar></app-navbar>
      <div class="app-body">
        <!-- Sidebar strictly disabled on landing, login, register, and browse -->
        <app-sidebar *ngIf="sidebarService.isAllowedOnCurrentRoute()"></app-sidebar>

        <div
          class="main-viewport"
          [class.sidebar-docked]="sidebarService.isAllowedOnCurrentRoute() && sidebarService.isOpen()">
          <main class="main-content">
            <router-outlet></router-outlet>
          </main>
          <!-- Footer ONLY rendered on landing page ('/') and removed from all other pages -->
          <app-footer *ngIf="isLandingPage()"></app-footer>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--color-bg);
    }
    .app-body {
      display: flex;
      flex: 1 0 auto;
      position: relative;
      padding-top: 72px; /* Fixed static navbar height offset */
    }
    .main-viewport {
      display: flex;
      flex-direction: column;
      flex: 1 1 0%;
      min-width: 0;
      transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .main-content {
      flex: 1 0 auto;
      min-height: calc(100vh - 72px);
    }
    @media (min-width: 1024px) {
      .main-viewport.sidebar-docked {
        margin-left: 260px;
      }
    }
  `]
})
export class AppComponent {
  private router = inject(Router);
  readonly isLandingPage = signal<boolean>(true);

  constructor(public sidebarService: SidebarService) {
    const initialUrl = this.getEffectiveUrl();
    this.updateRouteState(initialUrl);
    this.sidebarService.updateRouteState(initialUrl);

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      const url = e.urlAfterRedirects || e.url;
      this.updateRouteState(url);
      this.sidebarService.updateRouteState(url);
    });
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

  private updateRouteState(url: string): void {
    const raw = (url || this.getEffectiveUrl() || '').split('?')[0].split('#')[0].toLowerCase().trim();
    const cleanUrl = raw.length > 1 && raw.endsWith('/') ? raw.slice(0, -1) : raw;
    this.isLandingPage.set(cleanUrl === '' || cleanUrl === '/' || cleanUrl === '/index.html');
  }
}
