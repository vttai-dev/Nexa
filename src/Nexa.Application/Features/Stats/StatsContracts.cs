namespace Nexa.Application.Features.Stats;

public sealed record AdminStatsDto(
    int TotalUsers,
    int LockedUsers,
    int TotalArticles,
    int DraftArticles,
    int PublishedArticles,
    int ArchivedArticles,
    int TotalComments,
    int PendingReports,
    int TotalReports,
    int TotalCategories,
    int TotalTags,
    int TotalNotifications,
    int TotalViews,
    int TotalLikes,
    int TotalBookmarks,
    int TotalFollows);

public sealed record MyStatsDto(
    int TotalArticles,
    int DraftArticles,
    int PublishedArticles,
    int ArchivedArticles,
    int TotalViews,
    int TotalLikesReceived,
    int TotalCommentsReceived,
    int TotalBookmarksReceived,
    int BookmarkedArticles,
    int FollowingUsers,
    int Followers,
    int FollowingTags,
    int UnreadNotifications);

public sealed record PublicReputationDto(Guid UserId, string UserName, string DisplayName,
    int PublishedArticles, int LikesReceived, int CommentsReceived, long ContributionScore, string Level);

public sealed record AdminRecentUserDto(Guid Id, string UserName, string Email, DateTimeOffset CreatedAtUtc);
public sealed record AdminRecentArticleDto(Guid Id, string Title, string Slug, string Status, DateTimeOffset UpdatedAtUtc);
public sealed record AdminRecentCommentDto(Guid Id, Guid ArticleId, Guid AuthorId, string AuthorName, string Body, DateTimeOffset CreatedAtUtc);
public sealed record AdminRecentReportDto(Guid Id, string TargetType, Guid TargetId, string Reason, string Status, DateTimeOffset CreatedAtUtc);
public sealed record AdminRecentActivityDto(
    IReadOnlyList<AdminRecentUserDto> Users,
    IReadOnlyList<AdminRecentArticleDto> Articles,
    IReadOnlyList<AdminRecentCommentDto> Comments,
    IReadOnlyList<AdminRecentReportDto> Reports);
