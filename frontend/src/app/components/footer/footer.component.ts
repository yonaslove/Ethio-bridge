import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="container footer-content">
        <div class="footer-brand">
          <div class="footer-title">{{ i18n.t('nav.brandTitle') }}</div>
          <p class="footer-desc">
            {{ i18n.t('footer.desc') }}
          </p>
        </div>

        <div class="footer-links">
          <div class="footer-col">
            <h4>{{ i18n.translate('Marketplace', 'የስራ ገበያ') }}</h4>
            <a routerLink="/browse" [queryParams]="{type: 'JOB'}">{{ i18n.translate('Employment', 'መደበኛ ቅጥር') }}</a>
            <a routerLink="/browse" [queryParams]="{type: 'FREELANCE_PROJECT'}">{{ i18n.translate('Freelance Projects', 'የፍሪላንስ ፕሮጀክቶች') }}</a>
            <a routerLink="/browse" [queryParams]="{type: 'LOCAL_SERVICE_REQUEST'}">{{ i18n.translate('Local Services', 'የአካባቢ አገልግሎቶች') }}</a>
            <a routerLink="/contracts">{{ i18n.translate('Escrow & Milestone Contracts', 'የውል እና የክፍያ ዋስትና') }}</a>
          </div>

          <div class="footer-col">
            <h4>{{ i18n.translate('Trust & Legal', 'እምነት እና ህጋዊ') }}</h4>
            <a routerLink="/verification">{{ i18n.translate('National ID (Fayda) Verification', 'የብሔራዊ መታወቂያ (ፋይዳ) ማረጋገጫ') }}</a>
            <a routerLink="/terms">{{ i18n.t('nav.terms') }}</a>
            <a routerLink="/privacy">{{ i18n.t('nav.privacy') }}</a>
          </div>

          <div class="footer-col">
            <h4>{{ i18n.translate('Research & Tech', 'ምርምር እና ቴክኖሎጂ') }}</h4>
            <a routerLink="/evaluation">{{ i18n.translate('Evaluation Plan & Results', 'የምዘና እቅድ እና ውጤቶች') }}</a>
            <a href="http://localhost:8080/api/v1/swagger-ui.html" target="_blank">{{ i18n.translate('OpenAPI Specs', 'የኤፒአይ ሰነድ (OpenAPI)') }}</a>
            <a href="http://localhost:8761" target="_blank">{{ i18n.translate('Eureka Dashboard', 'የዩሬካ ዳሽቦርድ') }}</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container footer-bottom-inner">
          <div>{{ i18n.t('footer.rights') }}</div>
          <div class="footer-tagline">{{ i18n.translate('Built with Spring Boot 3, Angular 18, FastAPI & Keycloak', 'በSpring Boot 3፣ Angular 18፣ FastAPI እና Keycloak የተገነባ') }}</div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: var(--color-charcoal);
      color: var(--color-mist);
      margin-top: auto;
      border-top: 1px solid rgba(216, 207, 208, 0.2);
    }
    .footer-content {
      padding: 3.5rem 1.5rem 2.5rem;
      display: flex;
      justify-content: space-between;
      gap: 3rem;
      flex-wrap: wrap;
    }
    .footer-brand {
      max-width: 380px;
    }
    .footer-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 0.75rem;
    }
    .footer-desc {
      color: var(--color-taupe);
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .footer-links {
      display: flex;
      gap: 3rem;
      flex-wrap: wrap;
    }
    .footer-col h4 {
      color: #FFFFFF;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .footer-col a {
      display: block;
      color: var(--color-taupe);
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .footer-col a:hover {
      color: var(--color-cyan);
    }
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 1.25rem 0;
      font-size: 0.8rem;
      color: var(--color-taupe);
    }
    .footer-bottom-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `]
})
export class FooterComponent {
  constructor(public i18n: I18nService) {}
}
