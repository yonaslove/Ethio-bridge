export type ListingType = 'JOB' | 'FREELANCE_PROJECT' | 'LOCAL_SERVICE_REQUEST';
export type ListingStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'FILLED';
export type Seniority = 'JUNIOR' | 'MID' | 'SENIOR' | 'ANY';
export type ApplicationStatus = 'SUBMITTED' | 'SHORTLISTED' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type SkillCategory = 'TECH' | 'TRADES' | 'LANGUAGE' | 'SOFT' | 'OTHER';
export type RequirementType = 'REQUIRED' | 'PREFERRED';

export interface User {
  userId: string;
  keycloakSubject: string;
  email: string;
  fullName: string;
  roles: string[];
  status: string;
  phoneNumber?: string;
  isVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}

export interface Skill {
  id: number;
  slug: string;
  name: string;
  category: SkillCategory;
  isActive: boolean;
}

export interface ServiceCategory {
  id: number;
  slug: string;
  name: string;
  applicableType: string;
  parentId?: number;
}

export interface Location {
  id: number;
  name: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface ProviderSkill {
  skillId: number;
  skillName?: string;
  skillSlug?: string;
  category?: string;
  proficiency: number;
  yearsExperience: number;
}

export interface ProviderProfile {
  id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  headline: string;
  bio: string;
  yearsExperience: number;
  locationId?: number;
  locationName?: string;
  availability: string;
  hourlyRate: number;
  categoryFocus: string;
  profileText?: string;
  avatarUrl?: string;
  portfolioUrl?: string;
  education?: string;
  languages?: string;
  connectsBalance?: number;
  isPro?: boolean;
  proExpiresAt?: string;
  skills: ProviderSkill[];
}

export interface SeekerProfile {
  id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  headline: string;
  bio: string;
  locationId?: number;
  locationName?: string;
}

export interface ListingSkill {
  skillId: number;
  skillName?: string;
  skillSlug?: string;
  requirement: RequirementType;
  weight: number;
}

export interface Listing {
  id: string;
  ownerUserId: string;
  ownerName?: string;
  listingType: ListingType;
  title: string;
  description: string;
  serviceCategoryId?: number;
  serviceCategoryName?: string;
  locationId?: number;
  locationName?: string;
  isRemote: boolean;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  availabilityRequired: string;
  seniority: Seniority;
  status: ListingStatus;
  skills: ListingSkill[];
  isFeatured?: boolean;
  featuredUntil?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  listingId: string;
  listingTitle: string;
  listingType?: string;
  applicantUserId: string;
  applicantName?: string;
  applicantEmail?: string;
  providerProfileId: string;
  headline?: string;
  coverNote?: string;
  proposedRate?: number;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Factor {
  name: string;
  value: any;
  weight: number;
  contribution: number;
  detail: string;
}

export interface Explanation {
  summary: string;
  factors: Factor[];
}

export interface CandidateMatchResult {
  rank: number;
  score: number;
  providerProfileId: string;
  displayName: string;
  headline?: string;
  bio?: string;
  locationName?: string;
  explanation: Explanation;
}

export interface MatchRunResponse {
  listingId: string;
  method: string;
  k: number;
  model: string;
  modelVersion: string;
  latencyMs: number;
  degraded: boolean;
  results: CandidateMatchResult[];
}

export interface PagedResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface EvaluationCategoryResult {
  keywordP5: number;
  aiP5: number;
  deltaMean: number;
  ci95: number[];
  pValue: number;
  significant: boolean;
  latencyP50Ms: number;
  latencyP95Ms: number;
  aiNdcg5: number;
  keywordNdcg5: number;
  queryCount: number;
}

export interface EvaluationReport {
  isSampleData?: boolean;
  errorMessage?: string;
  datasetSize: number;
  candidatePoolSizePerQuery: number;
  totalEvaluatedPairs: number;
  rubric: string;
  results: { [key: string]: EvaluationCategoryResult };
  failureCaseExample: {
    query: string;
    issue: string;
    mitigation: string;
  };
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
  roles: string[];
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: 'SEEKER' | 'PROVIDER' | 'DUAL';
  locationId?: number;
  customLocation?: string;
  headline?: string;
  bio?: string;
  initialSkillIds?: number[];
  phoneNumber?: string;
  avatarUrl?: string;
  portfolioUrl?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  availability?: string;
  education?: string;
  languages?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPLICATION' | 'MESSAGE' | 'OFFER' | 'CONTRACT' | 'SYSTEM';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageThreadItem {
  id: string;
  listingId?: string;
  subject: string;
  lastMessageAt: string;
  otherUserId: string;
  otherUserName: string;
  otherUserEmail: string;
  otherUserVerified: boolean;
  lastMessageContent?: string;
  lastMessageSenderId?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderUserId: string;
  recipientUserId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContractMilestoneItem {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  amount: number;
  status: 'PENDING' | 'FUNDED' | 'RELEASED' | 'DISPUTED';
  dueDate?: string;
  fundedAt?: string;
  releasedAt?: string;
  platformFeePercent?: number;
  platformFeeAmount?: number;
  netPayoutAmount?: number;
}

export interface ContractItem {
  id: string;
  listingId: string;
  applicationId: string;
  seekerUserId: string;
  providerUserId: string;
  title: string;
  terms?: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
  seekerName: string;
  providerName: string;
  providerVerified: boolean;
  milestones: ContractMilestoneItem[];
}

export interface UserVerificationStatus {
  id: string;
  userId: string;
  idType: string;
  idNumber: string;
  phoneNumber: string;
  documentUrl?: string;
  selfieUrl?: string;
  aiScore?: number;
  aiVerdict?: string;
  aiAnalysis?: string;
  criteriaBreakdown?: string;
  userName?: string;
  userEmail?: string;
  userRoles?: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface TrustReport {
  id: string;
  reporterUserId: string;
  reportedUserId?: string;
  listingId?: string;
  reason: string;
  details?: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SavedSearchItem {
  id: string;
  userId: string;
  title: string;
  queryText?: string;
  serviceCategoryId?: number;
  locationId?: number;
  minBudget?: number;
  maxBudget?: number;
  listingType?: string;
  notifyEmail: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: number;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PlatformRevenueItem {
  id: string;
  sourceType: string;
  sourceId?: string;
  payerUserId?: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  paymentMethod: string;
  referenceId: string;
  description?: string;
  createdAt: string;
}

export interface MonetizationStats {
  totalRevenue: number;
  escrowCommissionRevenue: number;
  connectsRevenue: number;
  featuredListingRevenue: number;
  proSubscriptionRevenue: number;
  recentTransactions: PlatformRevenueItem[];
}

export interface ConnectsTopupResponse {
  success: boolean;
  addedConnects: number;
  newBalance: number;
  amountPaid: number;
  paymentMethod: string;
  referenceId: string;
}

export interface FeatureListingResponse {
  success: boolean;
  listingId: string;
  isFeatured: boolean;
  featuredUntil: string;
  amountPaid: number;
  referenceId: string;
}

export interface ProSubscriptionResponse {
  success: boolean;
  isPro: boolean;
  proExpiresAt: string;
  newConnectsBalance: number;
  amountPaid: number;
  referenceId: string;
}

