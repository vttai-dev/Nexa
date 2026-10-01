// ============================================================
// TypeScript types — mirrors Nexa.Platform backend DTOs exactly
// Synced with: Nexa.Api-antigravity-frontend-contract.txt
// ============================================================

// ── Pagination ───────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface PageRequest {
  page?: number;
  pageSize?: number;
}

// ── Error (ProblemDetails) ────────────────────────────────────
export interface ApiError {
  type?: string;
  title: string;
  status: number;
  code?: string;
  traceId?: string;
  extensions?: {
    code?: string;
    traceId?: string;
  };
}

// ── Auth ─────────────────────────────────────────────────────
export interface CsrfResponse {
  requestToken: string;
  headerName: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string | null;
}

export interface AccountAvailabilityDto {
  field: 'userName' | 'email';
  value: string;
  available: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisteredDto {
  userId: string;
}

// ── Account / Profile ────────────────────────────────────────
// GET /me → account confirmation state is included
export interface AccountDto {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  roles: string[];
}

export interface ProfileDto {
  userId: string;
  userName: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  websiteUrl: string | null;
  coverImageUrl: string | null;
  gitHubUrl: string | null;
  linkedInUrl: string | null;
  company: string;
  skills: string[];
}

export interface MeDto {
  account: AccountDto;
  profile: ProfileDto;
}

export interface UpdateProfileRequest {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  websiteUrl?: string;
  coverImageUrl?: string;
  gitHubUrl?: string;
  linkedInUrl?: string;
  company?: string;
  skills?: string[];
}

export interface DevelopmentMessageDto {
  channel: 'email' | 'phone';
  recipient: string;
  subject: string;
  body: string;
  createdAtUtc: string;
}

// Public profile from GET /users/{userName}
export interface PublicProfileDto {
  userId: string;
  userName: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  websiteUrl: string | null;
  coverImageUrl: string | null;
  gitHubUrl: string | null;
  linkedInUrl: string | null;
  company: string;
  skills: string[];
}

export interface PublicProfileStatsDto {
  userId: string;
  userName: string;
  publishedArticles: number;
  followers: number;
  followingUsers: number;
  followingTags: number;
}

// ── Enums ────────────────────────────────────────────────────
export type ArticleStatus = 'Draft' | 'Published' | 'Archived';
export type ArticleRevisionAction = 'Created' | 'Updated' | 'Published' | 'Archived' | 'Restored';
export type NotificationType = 'ArticleLiked' | 'ArticleCommented' | 'UserFollowed' | 'Mentioned' | 'TagPublished' | 'CommentReplied' | 'ArticlePublished' | 'ArticleShared' | 'ArticleReviewApproved' | 'ArticleReviewRejected';
export type ReportTargetType = 'Article' | 'Comment' | 'User';
export type ReportReason = 'Spam' | 'Inappropriate' | 'Plagiarism' | 'PolicyViolation' | 'Other';
export type ReportStatus = 'Pending' | 'Accepted' | 'Rejected';
export type ArticleReviewStatus = 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';

export interface ArticleReviewQueueItemDto {
  id: string;
  articleId: string;
  title: string;
  slug: string;
  authorId: string;
  authorName: string;
  authorUserName: string;
  articleVersion: string;
  status: ArticleReviewStatus;
  submissionNote: string | null;
  submittedAtUtc: string;
}

export interface ArticleReviewFilter extends PageRequest {
  status?: ArticleReviewStatus;
}

export interface AdminStatsDto {
  totalUsers: number;
  lockedUsers: number;
  totalArticles: number;
  draftArticles: number;
  publishedArticles: number;
  archivedArticles: number;
  totalComments: number;
  pendingReports: number;
  totalReports: number;
  totalCategories: number;
  totalTags: number;
  totalNotifications: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  totalFollows: number;
}

export interface AdminRecentActivityDto {
  users: { id: string; userName: string; email: string; createdAtUtc: string }[];
  articles: { id: string; title: string; slug: string; status: string; updatedAtUtc: string }[];
  comments: { id: string; articleId: string; authorId: string; authorName: string; body: string; createdAtUtc: string }[];
  reports: { id: string; targetType: string; targetId: string; reason: string; status: string; createdAtUtc: string }[];
}

// ── Articles ─────────────────────────────────────────────────
export interface ArticleSummaryDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  authorId: string;
  authorName: string;
  status: ArticleStatus;
  publishedAtUtc: string | null;
  version: string;
  isFeatured: boolean;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

export interface ArticleDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  authorId: string;
  authorName: string;
  categoryId: string | null;
  tagIds: string[];
  status: ArticleStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc: string | null;
  version: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isFeatured: boolean;
  shareCount: number;
}

// GET /articles/{slug}/metadata
export interface ArticleMetadataDto {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  wordCount: number;
  readingTimeMinutes: number;
  updatedAtUtc: string;
  publishedAtUtc: string | null;
  shareCount: number;
}

export interface ArticleInput {
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  categoryId?: string | null;
  tagIds: string[];
}

export interface UpdateArticleRequest {
  version: string;
  article: ArticleInput;
}

export interface VersionRequest {
  version: string;
}

export interface CreatedArticleDto {
  id: string;
  slug: string;
  version: string;
}

export interface ArticleFilter extends PageRequest {
  categoryId?: string;
  tagId?: string;
  authorId?: string;
}

// ── Article Revisions ────────────────────────────────────────
export interface ArticleRevisionSummaryDto {
  id: string;
  articleId: string;
  action: ArticleRevisionAction;
  editorId: string;
  status: ArticleStatus;
  title: string;
  slug: string;
  articleVersion: string;
  createdAtUtc: string;
}

export interface ArticleRevisionDto {
  id: string;
  articleId: string;
  action: ArticleRevisionAction;
  editorId: string;
  status: ArticleStatus;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  categoryId: string | null;
  tagIds: string[];
  articleVersion: string;
  createdAtUtc: string;
}

// ── Taxonomy ─────────────────────────────────────────────────
export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface TagDto {
  id: string;
  name: string;
  slug: string;
}

export interface TagStatsDto {
  id: string;
  name: string;
  slug: string;
  publishedArticleCount: number;
  followerCount: number;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description: string;
}

export interface TagInput {
  name: string;
  slug: string;
}

export interface CreatedIdDto {
  id: string;
}

// ── Comments ──────────────────────────────────────────────────
export interface CommentDto {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentCommentId?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  version: string;
}

export interface CommentInput {
  body: string;
  parentCommentId?: string | null;
}

export interface UpdateCommentRequest {
  version: string;
  body: string;
}

export interface CreatedCommentDto {
  id: string;
  version: string;
}

// ── Notifications ─────────────────────────────────────────────
export interface NotificationDto {
  id: string;
  type: NotificationType;
  message: string;
  actorId: string;
  actorUserName: string;
  articleId: string | null;
  articleSlug: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAtUtc: string;
  readAtUtc: string | null;
}

export interface UnreadCountDto {
  count: number;
}

export interface NotificationFilter extends PageRequest {
  unreadOnly?: boolean;
}

// ── Search ────────────────────────────────────────────────────
export interface SearchArticleResultDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  authorId: string;
  authorName: string;
  publishedAtUtc: string;
}

export interface SearchUserResultDto {
  userId: string;
  userName: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}

export interface SearchTagResultDto {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
}

export interface SearchResultDto {
  articles: PagedResult<SearchArticleResultDto>;
  users: PagedResult<SearchUserResultDto>;
  tags: PagedResult<SearchTagResultDto>;
}

export interface SearchFilter extends PageRequest {
  query?: string;
}

// ── Reports / Moderation ──────────────────────────────────────
export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string;
}

export interface ReportDto {
  id: string;
  reporterId: string;
  reporterUserName: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAtUtc: string;
  resolvedAtUtc: string | null;
  resolvedById: string | null;
  resolutionNote: string;
}

export interface ReportDecisionRequest {
  status: 'Accepted' | 'Rejected';
  resolutionNote: string;
}

export interface ReportFilter extends PageRequest {
  status?: ReportStatus;
}

// ── Admin Users ───────────────────────────────────────────────
export interface AdminUserDto {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  isLocked: boolean;
  lockoutEndUtc: string | null;
  createdAtUtc: string;
}

export interface AdminUserDetailDto {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  isLocked: boolean;
  lockoutEndUtc: string | null;
  createdAtUtc: string;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
}

export interface UpdateRolesRequest {
  roles: string[];
}

export interface LockUserRequest {
  days: number;
}

export interface AdminUserFilter extends PageRequest {
  search?: string;
}

// ── Admin Audit Logs ──────────────────────────────────────────
export interface AuditLogDto {
  id: string;
  actorId: string;
  actorUserName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress: string;
  createdAtUtc: string;
}

export interface AuditLogFilter extends PageRequest {
  action?: string;
  targetType?: string;
  actorId?: string;
}

// ── User Roles ────────────────────────────────────────────────
export const ROLES = {
  Member: 'Member',
  Author: 'Author',
  Moderator: 'Moderator',
  Admin: 'Admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function hasRole(roles: string[], role: Role): boolean {
  return roles.includes(role);
}

export function isAdmin(roles: string[]): boolean {
  return hasRole(roles, ROLES.Admin);
}

export function canModerate(roles: string[]): boolean {
  return hasRole(roles, ROLES.Moderator) || hasRole(roles, ROLES.Admin);
}

export function canAuthor(roles: string[]): boolean {
  return hasRole(roles, ROLES.Author) || hasRole(roles, ROLES.Admin);
}

// ── Extended DTOs (Section 15) ───────────────────────────────
export interface MeStatsDto {
  articles: number;
  publishedArticles: number;
  draftArticles: number;
  bookmarks: number;
  notifications: number;
  unreadNotifications: number;
  views: number;
  likes: number;
  comments: number;
  followingUsers: number;
  followers: number;
  followingTags: number;
}

export interface CategoryStatsDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  publishedArticleCount: number;
}

export interface PublicFollowDto {
  userId: string;
  userName: string;
  displayName: string;
  avatarUrl: string | null;
  followedAtUtc: string;
}

export interface ArticleEngagementDto {
  articleId: string;
  liked: boolean;
  bookmarked: boolean;
}

export interface FollowStateDto {
  targetId: string;
  following: boolean;
}

export interface MediaAssetDto {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAtUtc: string;
}

export interface ModerationReportsSummaryDto {
  pending: number;
  accepted: number;
  rejected: number;
  total: number;
}

export interface SearchSuggestionItemDto {
  type: 'article' | 'user' | 'tag';
  label: string;
  value: string;
  url: string;
}

export interface SearchSuggestionsDto {
  items: SearchSuggestionItemDto[];
}

export interface SlugAvailabilityDto {
  slug?: string;
  field?: string;
  value?: string;
  available: boolean;
}

export interface ArchiveMonthDto {
  year: number;
  month: number;
  count: number;
}

export interface AdminUserActivityDto {
  userId: string;
  articles: number;
  publishedArticles: number;
  comments: number;
  likesGiven: number;
  bookmarks: number;
  followers: number;
  followingUsers: number;
  followingTags: number;
  reportsCreated: number;
  reportsAgainstUser: number;
}

export interface ArticleRevisionCompareDto {
  from: ArticleRevisionDto;
  to: ArticleRevisionDto;
  titleChanged: boolean;
  slugChanged: boolean;
  summaryChanged: boolean;
  bodyChanged: boolean;
  categoryChanged: boolean;
  tagsChanged: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ArticleAutosaveResponse {
  id: string;
  version: string;
  savedAtUtc: string;
}

export interface ArticleSeriesSummaryDto {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  slug: string;
  description: string;
  articleCount: number;
  createdAtUtc: string;
}

export interface ArticleSeriesDto {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  slug: string;
  description: string;
  createdAtUtc: string;
  articles: ArticleSummaryDto[];
}

export interface ArticleSeriesInput {
  title: string;
  slug: string;
  description: string;
}

export interface ArticleSeoDto {
  version: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
}

export interface PublicReputationDto {
  userId: string;
  userName: string;
  displayName: string;
  avatarUrl: string | null;
  publishedArticles: number;
  likesReceived: number;
  commentsReceived: number;
  contributionScore: number;
  level: 'Newbie' | 'Contributor' | 'Expert';
}

export interface TagTrendDto {
  id: string;
  name: string;
  slug: string;
  publishedArticleCount: number;
  followerCount: number;
}

export interface ArticleReviewDto {
  id: string;
  articleId: string;
  articleVersion: string;
  status: ArticleReviewStatus;
  submissionNote: string | null;
  decisionNote: string | null;
  submittedAtUtc: string;
  decidedAtUtc: string | null;
  decidedById: string | null;
}

export interface SubmitArticleReviewRequest {
  version: string;
  note?: string | null;
}

export interface ArticleReviewDecisionRequest {
  status: 'Approved' | 'Rejected';
  note?: string | null;
}
