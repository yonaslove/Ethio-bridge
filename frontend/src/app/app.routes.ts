import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ListingsBrowseComponent } from './pages/listings-browse/listings-browse.component';
import { ListingDetailComponent } from './pages/listing-detail/listing-detail.component';
import { ListingCreateComponent } from './pages/listing-create/listing-create.component';
import { CandidatesViewComponent } from './pages/candidates-view/candidates-view.component';
import { ApplicationsReceivedComponent } from './pages/applications-received/applications-received.component';
import { ProviderProfileComponent } from './pages/provider-profile/provider-profile.component';
import { SeekerProfileComponent } from './pages/seeker-profile/seeker-profile.component';
import { RecommendedListingsComponent } from './pages/recommended-listings/recommended-listings.component';
import { MyApplicationsComponent } from './pages/my-applications/my-applications.component';
import { MyListingsComponent } from './pages/my-listings/my-listings.component';
import { ProviderDetailComponent } from './pages/provider-detail/provider-detail.component';
import { AdminComponent } from './pages/admin/admin.component';
import { EvaluationComponent } from './pages/evaluation/evaluation.component';
import { MessagesComponent } from './pages/messages/messages.component';
import { ContractsComponent } from './pages/contracts/contracts.component';
import { VerificationComponent } from './pages/verification/verification.component';
import { TermsComponent } from './pages/terms/terms.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { authGuard, seekerGuard, providerGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'browse', component: ListingsBrowseComponent },
  { path: 'listings/new', component: ListingCreateComponent, canActivate: [seekerGuard] },
  { path: 'listings/my', component: MyListingsComponent, canActivate: [seekerGuard] },
  { path: 'listings/:id', component: ListingDetailComponent },
  { path: 'listings/:id/edit', component: ListingCreateComponent, canActivate: [seekerGuard] },
  { path: 'listings/:id/candidates', component: CandidatesViewComponent, canActivate: [seekerGuard] },
  { path: 'listings/:id/applications', component: ApplicationsReceivedComponent, canActivate: [seekerGuard] },
  { path: 'profile/provider', component: ProviderProfileComponent, canActivate: [providerGuard] },
  { path: 'profile/seeker', component: SeekerProfileComponent, canActivate: [seekerGuard] },
  { path: 'recommended', component: RecommendedListingsComponent, canActivate: [providerGuard] },
  { path: 'my-applications', component: MyApplicationsComponent, canActivate: [providerGuard] },
  { path: 'providers/:id', component: ProviderDetailComponent },
  { path: 'messages', component: MessagesComponent, canActivate: [authGuard] },
  { path: 'contracts', component: ContractsComponent, canActivate: [authGuard] },
  { path: 'verification', component: VerificationComponent, canActivate: [authGuard] },
  { path: 'terms', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
  { path: 'evaluation', component: EvaluationComponent },
  { path: '**', redirectTo: '' }
];
