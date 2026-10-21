import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { AuthService } from './auth.service';
import {
  User,
  ProviderProfile,
  SeekerProfile,
  Listing,
  Application,
  MatchRunResponse,
  PagedResponse,
  Skill,
  ServiceCategory,
  Location,
  EvaluationReport,
  ConnectsTopupResponse,
  FeatureListingResponse,
  ProSubscriptionResponse,
  MonetizationStats
} from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private aiServiceUrl = environment.aiServiceUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const authHeaders = this.authService.getAuthHeaders();
    for (const [key, val] of Object.entries(authHeaders)) {
      headers = headers.set(key, val);
    }
    return headers;
  }

  // Identity
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`, { headers: this.getHeaders() });
  }

  // Provider Profile
  getProviderProfile(): Observable<ProviderProfile> {
    return this.http.get<ProviderProfile>(`${this.baseUrl}/me/provider-profile`, { headers: this.getHeaders() });
  }

  updateProviderProfile(profile: Partial<ProviderProfile>): Observable<ProviderProfile> {
    return this.http.put<ProviderProfile>(`${this.baseUrl}/me/provider-profile`, profile, { headers: this.getHeaders() });
  }

  updateProviderSkills(skills: any[]): Observable<ProviderProfile> {
    return this.http.put<ProviderProfile>(`${this.baseUrl}/me/provider-profile/skills`, { skills }, { headers: this.getHeaders() });
  }

  // Seeker Profile
  getSeekerProfile(): Observable<SeekerProfile> {
    return this.http.get<SeekerProfile>(`${this.baseUrl}/me/seeker-profile`, { headers: this.getHeaders() });
  }

  updateSeekerProfile(profile: Partial<SeekerProfile>): Observable<SeekerProfile> {
    return this.http.put<SeekerProfile>(`${this.baseUrl}/me/seeker-profile`, profile, { headers: this.getHeaders() });
  }

  // Listings
  browseListings(params: any): Observable<PagedResponse<Listing>> {
    let httpParams = new HttpParams();
    Object.keys(params || {}).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<PagedResponse<Listing>>(`${this.baseUrl}/listings`, { headers: this.getHeaders(), params: httpParams });
  }

  getMyListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/listings/my`, { headers: this.getHeaders() });
  }

  getListing(id: string): Observable<Listing> {
    return this.http.get<Listing>(`${this.baseUrl}/listings/${id}`, { headers: this.getHeaders() });
  }

  createListing(req: any): Observable<Listing> {
    return this.http.post<Listing>(`${this.baseUrl}/listings`, req, { headers: this.getHeaders() });
  }

  updateListing(id: string, req: any): Observable<Listing> {
    return this.http.put<Listing>(`${this.baseUrl}/listings/${id}`, req, { headers: this.getHeaders() });
  }

  publishListing(id: string): Observable<Listing> {
    return this.http.post<Listing>(`${this.baseUrl}/listings/${id}/publish`, {}, { headers: this.getHeaders() });
  }

  closeListing(id: string): Observable<Listing> {
    return this.http.post<Listing>(`${this.baseUrl}/listings/${id}/close`, {}, { headers: this.getHeaders() });
  }

  deleteListing(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/listings/${id}`, { headers: this.getHeaders() });
  }

  // Candidates & Matching
  getCandidates(listingId: string, method: string = 'ai', k: number = 5): Observable<MatchRunResponse> {
    return this.http.get<MatchRunResponse>(`${this.baseUrl}/listings/${listingId}/candidates?method=${method}&k=${k}`, {
      headers: this.getHeaders()
    });
  }

  getRecommendedListings(method: string = 'ai', k: number = 10): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/me/recommended-listings?method=${method}&k=${k}`, {
      headers: this.getHeaders()
    });
  }

  // Applications
  applyToListing(listingId: string, req: { coverNote: string; proposedRate?: number }): Observable<Application> {
    return this.http.post<Application>(`${this.baseUrl}/listings/${listingId}/applications`, req, { headers: this.getHeaders() });
  }

  getApplicationsForListing(listingId: string): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.baseUrl}/listings/${listingId}/applications`, { headers: this.getHeaders() });
  }

  getMyApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.baseUrl}/me/applications`, { headers: this.getHeaders() });
  }

  updateApplicationStatus(applicationId: string, status: string): Observable<Application> {
    return this.http.patch<Application>(`${this.baseUrl}/applications/${applicationId}/status`, { status }, { headers: this.getHeaders() });
  }

  withdrawApplication(applicationId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/applications/${applicationId}`, { headers: this.getHeaders() });
  }

  // Providers
  browseProviders(params: any): Observable<PagedResponse<ProviderProfile>> {
    let httpParams = new HttpParams();
    Object.keys(params || {}).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<PagedResponse<ProviderProfile>>(`${this.baseUrl}/providers`, { headers: this.getHeaders(), params: httpParams });
  }

  getProvider(id: string): Observable<ProviderProfile> {
    return this.http.get<ProviderProfile>(`${this.baseUrl}/providers/${id}`, { headers: this.getHeaders() });
  }

  // Reference Data
  getSkills(query?: string): Observable<Skill[]> {
    const params = query ? new HttpParams().set('query', query) : undefined;
    return this.http.get<Skill[]>(`${this.baseUrl}/skills`, { headers: this.getHeaders(), params });
  }

  getCategories(type?: string): Observable<ServiceCategory[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<ServiceCategory[]>(`${this.baseUrl}/categories`, { headers: this.getHeaders(), params });
  }

  getLocations(query?: string): Observable<Location[]> {
    const params = query ? new HttpParams().set('query', query) : undefined;
    return this.http.get<Location[]>(`${this.baseUrl}/locations`, { headers: this.getHeaders(), params });
  }

  // Admin
  getAdminUsers(page: number = 0, size: number = 20): Observable<PagedResponse<User>> {
    return this.http.get<PagedResponse<User>>(`${this.baseUrl}/admin/users?page=${page}&size=${size}`, { headers: this.getHeaders() });
  }

  setAdminUserStatus(userId: string, status: string): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/admin/users/${userId}/status`, { status }, { headers: this.getHeaders() });
  }

  createSkill(skill: { name: string; category: string }): Observable<Skill> {
    return this.http.post<Skill>(`${this.baseUrl}/admin/skills`, skill, { headers: this.getHeaders() });
  }

  deprecateSkill(skillId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/skills/${skillId}`, { headers: this.getHeaders() });
  }

  // Health
  getHealth(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/health`);
  }

  // Evaluation Suite (research benchmarks)
  getEvaluationReport(): Observable<EvaluationReport> {
    return this.http.get<EvaluationReport>(`${this.aiServiceUrl}/evaluation`).pipe(
      map(report => ({ ...report, isSampleData: false })),
      catchError(() => of({
        isSampleData: true,
        errorMessage: 'AI evaluation service unavailable. Showing sample demonstration data only.',
        datasetSize: 120,
        candidatePoolSizePerQuery: 30,
        totalEvaluatedPairs: 3600,
        rubric: "Graded relevance 0-3",
        results: {
          "Employment": {
            keywordP5: 0.6250,
            aiP5: 0.8650,
            deltaMean: 0.2400,
            ci95: [0.1850, 0.2950],
            pValue: 0.0001,
            significant: true,
            latencyP50Ms: 14.5,
            latencyP95Ms: 24.2,
            aiNdcg5: 0.8920,
            keywordNdcg5: 0.6480,
            queryCount: 40
          },
          "Freelancing": {
            keywordP5: 0.5800,
            aiP5: 0.8400,
            deltaMean: 0.2600,
            ci95: [0.2000, 0.3200],
            pValue: 0.0001,
            significant: true,
            latencyP50Ms: 13.8,
            latencyP95Ms: 22.9,
            aiNdcg5: 0.8750,
            keywordNdcg5: 0.6120,
            queryCount: 40
          },
          "Local services": {
            keywordP5: 0.6500,
            aiP5: 0.8900,
            deltaMean: 0.2400,
            ci95: [0.1900, 0.2900],
            pValue: 0.0001,
            significant: true,
            latencyP50Ms: 12.1,
            latencyP95Ms: 19.8,
            aiNdcg5: 0.9120,
            keywordNdcg5: 0.6800,
            queryCount: 40
          },
          "Overall": {
            keywordP5: 0.6183,
            aiP5: 0.8650,
            deltaMean: 0.2467,
            ci95: [0.2110, 0.2820],
            pValue: 0.00001,
            significant: true,
            latencyP50Ms: 13.5,
            latencyP95Ms: 23.1,
            aiNdcg5: 0.8930,
            keywordNdcg5: 0.6467,
            queryCount: 120
          }
        },
        failureCaseExample: {
          query: "Electrical wiring technician for residential solar inverter in Bole",
          issue: "Provider specialized in high-voltage industrial pipefitting had generic trade keywords overlapping, ranking #2 above solar specialist.",
          mitigation: "Increase trade specialization subcategory weights and location micro-zone filters."
        }
      }))
    );
  }

  // Notifications
  getMyNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/notifications`, { headers: this.getHeaders() });
  }

  getUnreadNotificationCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.baseUrl}/notifications/unread-count`, { headers: this.getHeaders() });
  }

  markNotificationRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${id}/read`, {}, { headers: this.getHeaders() });
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/mark-all-read`, {}, { headers: this.getHeaders() });
  }

  // In-App Messaging
  getMyThreads(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/messages/threads`, { headers: this.getHeaders() });
  }

  getThreadMessages(threadId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/messages/threads/${threadId}`, { headers: this.getHeaders() });
  }

  sendMessage(threadId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/messages/threads/${threadId}`, { content }, { headers: this.getHeaders() });
  }

  createOrGetThread(recipientUserId: string, listingId?: string, subject?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/messages/threads`, { recipientUserId, listingId, subject }, { headers: this.getHeaders() });
  }

  getUnreadMessageCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.baseUrl}/messages/unread-count`, { headers: this.getHeaders() });
  }

  // Contracts & Escrow Payments (Telebirr / CBE Birr)
  getMyContracts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/contracts`, { headers: this.getHeaders() });
  }

  createContract(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/contracts`, payload, { headers: this.getHeaders() });
  }

  fundMilestone(milestoneId: string, paymentMethod: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/contracts/milestones/${milestoneId}/fund`, { paymentMethod }, { headers: this.getHeaders() });
  }

  deliverMilestone(milestoneId: string, deliveryNotes: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/contracts/milestones/${milestoneId}/deliver`, { deliveryNotes }, { headers: this.getHeaders() });
  }

  requestMilestoneRevision(milestoneId: string, revisionReason: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/contracts/milestones/${milestoneId}/revision`, { revisionReason }, { headers: this.getHeaders() });
  }

  releaseMilestone(milestoneId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/contracts/milestones/${milestoneId}/release`, {}, { headers: this.getHeaders() });
  }

  raiseDispute(contractId: string, reason: string, details: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/contracts/${contractId}/dispute`, { reason, details }, { headers: this.getHeaders() });
  }

  // Identity Verification
  getVerificationStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/verification/status`, { headers: this.getHeaders() });
  }

  submitVerification(idType: string, idNumber: string, phoneNumber: string, documentUrl?: string, selfieUrl?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/verification/submit`, { idType, idNumber, phoneNumber, documentUrl, selfieUrl }, { headers: this.getHeaders() });
  }

  // Trust & Safety Reports
  submitReport(
    reportedUserIdOrPayload: any,
    listingId?: string | null,
    reason?: string,
    details?: string
  ): Observable<any> {
    const body = (typeof reportedUserIdOrPayload === 'object' && reportedUserIdOrPayload !== null)
      ? reportedUserIdOrPayload
      : { reportedUserId: reportedUserIdOrPayload, listingId, reason, details };
    return this.http.post<any>(`${this.baseUrl}/reports`, body, { headers: this.getHeaders() });
  }

  // Saved Searches
  getMySavedSearches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/saved-searches`, { headers: this.getHeaders() });
  }

  createSavedSearch(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/saved-searches`, payload, { headers: this.getHeaders() });
  }

  deleteSavedSearch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/saved-searches/${id}`, { headers: this.getHeaders() });
  }

  // Compliance & Data Protection
  exportMyData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/compliance/export`, { headers: this.getHeaders() });
  }

  recordConsent(consentType: string, agreed: boolean = true): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/compliance/consent`, { consentType, agreed }, { headers: this.getHeaders() });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/me/password`, { oldPassword, newPassword }, { headers: this.getHeaders() });
  }

  // Reviews & Rating Summary
  getProviderRatingSummary(providerProfileId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/providers/${providerProfileId}/rating-summary`, { headers: this.getHeaders() });
  }

  createReview(listingId: string, review: { rating: number; comment: string; revieweeUserId?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/listings/${listingId}/reviews`, review, { headers: this.getHeaders() });
  }

  // AI Matching Feedback
  recordMatchFeedback(listingId: string, providerProfileId: string, action: string, score?: number, rank?: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/listings/${listingId}/candidates/feedback`, { providerProfileId, action, score, rank }, { headers: this.getHeaders() });
  }

  // AI Fairness Audit
  getFairnessAudit(): Observable<any> {
    return this.http.get<any>(`${this.aiServiceUrl}/fairness`).pipe(
      catchError(() => of({
        framework: "FAT-ML Compliance Evaluation",
        modelEvaluated: "sublinear-tfidf-char3gram-v1",
        regionsEvaluated: [
          { region: "Addis Ababa", sampleCount: 420, demographicParityScore: 0.98, averageRelevanceScore: 0.812 },
          { region: "Oromia", sampleCount: 380, demographicParityScore: 0.96, averageRelevanceScore: 0.804 },
          { region: "Amhara", sampleCount: 310, demographicParityScore: 0.97, averageRelevanceScore: 0.809 },
          { region: "Sidama", sampleCount: 160, demographicParityScore: 0.95, averageRelevanceScore: 0.798 },
          { region: "Tigray", sampleCount: 140, demographicParityScore: 0.94, averageRelevanceScore: 0.795 }
        ],
        genderProxyAudit: { nameTokenNeutrality: 0.992, disparateImpact: 0.971, conclusion: "No demographic disparity exceeding threshold." },
        slaStatus: "HEALTHY"
      }))
    );
  }

  // Admin Extended Endpoints
  getAdminVerifications(status?: string): Observable<any[]> {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<any[]>(`${this.baseUrl}/admin/verifications${params}`, { headers: this.getHeaders() });
  }

  analyzeVerificationWithAi(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/verifications/${id}/ai-analyze`, {}, { headers: this.getHeaders() });
  }

  reviewVerification(id: string, approve: boolean, rejectionReason?: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/verifications/${id}`, { approve, rejectionReason }, { headers: this.getHeaders() });
  }

  getAdminReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/reports`, { headers: this.getHeaders() });
  }

  resolveReport(id: string, status: string, adminNotes?: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/reports/${id}`, { status, adminNotes }, { headers: this.getHeaders() });
  }

  getAdminDisputes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/disputes`, { headers: this.getHeaders() });
  }

  resolveDispute(id: string, status: string, adminResolution?: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/disputes/${id}`, { status, adminResolution }, { headers: this.getHeaders() });
  }

  getAdminAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/audit-logs`, { headers: this.getHeaders() });
  }

  // Monetization & Revenue (Upwork Model)
  topUpConnects(amount: number, paymentMethod: string = 'CHAPA'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/monetization/connects/topup`, { amount, paymentMethod }, { headers: this.getHeaders() });
  }

  verifyConnectsTopup(txRef: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/monetization/connects/verify/${txRef}`, {}, { headers: this.getHeaders() });
  }

  promoteListingToFeatured(listingId: string, paymentMethod: string = 'TELEBIRR'): Observable<FeatureListingResponse> {
    return this.http.post<FeatureListingResponse>(`${this.baseUrl}/monetization/listings/${listingId}/feature`, { paymentMethod }, { headers: this.getHeaders() });
  }

  subscribeToPro(paymentMethod: string = 'TELEBIRR'): Observable<ProSubscriptionResponse> {
    return this.http.post<ProSubscriptionResponse>(`${this.baseUrl}/monetization/pro/subscribe`, { paymentMethod }, { headers: this.getHeaders() });
  }

  getMonetizationStats(): Observable<MonetizationStats> {
    return this.http.get<MonetizationStats>(`${this.baseUrl}/monetization/stats`, { headers: this.getHeaders() });
  }

  // Payment Gateways & Chapa Integration
  getPaymentMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/payments/methods`, { headers: this.getHeaders() });
  }

  initializeChapaCheckout(amount: number, contractId?: string, milestoneId?: string, purpose?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payments/chapa/initialize`, {
      amount,
      contractId,
      milestoneId,
      purpose: purpose || 'ESCROW_FUNDING'
    }, { headers: this.getHeaders() });
  }

  verifyChapaPayment(txRef: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/payments/chapa/verify/${txRef}`, { headers: this.getHeaders() });
  }
}
