using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Features.Admin;
using Nexa.Application.Features.Stats;
using Nexa.Domain.Articles;
using Nexa.Domain.Moderation;

namespace Nexa.Infrastructure.Persistence.Queries;

public sealed class StatsQueries(NexaDbContext database) : IStatsQueries
{
    public async Task<AdminStatsDto> AdminAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var totalUsers = await database.Users.CountAsync(cancellationToken);
        var lockedUsers = await database.Users.CountAsync(user => user.LockoutEnd != null && user.LockoutEnd > now, cancellationToken);
        var totalArticles = await database.Articles.CountAsync(cancellationToken);
        var draftArticles = await database.Articles.CountAsync(article => article.Status == ArticleStatus.Draft, cancellationToken);
        var publishedArticles = await database.Articles.CountAsync(article => article.Status == ArticleStatus.Published, cancellationToken);
        var archivedArticles = await database.Articles.CountAsync(article => article.Status == ArticleStatus.Archived, cancellationToken);
        var totalComments = await database.Comments.CountAsync(comment => comment.DeletedAtUtc == null, cancellationToken);
        var pendingReports = await database.Reports.CountAsync(report => report.Status == ReportStatus.Pending, cancellationToken);
        var totalReports = await database.Reports.CountAsync(cancellationToken);
        var totalCategories = await database.Categories.CountAsync(cancellationToken);
        var totalTags = await database.Tags.CountAsync(cancellationToken);
        var totalNotifications = await database.Notifications.CountAsync(cancellationToken);
        var totalViews = await database.Articles.SumAsync(article => article.ViewCount, cancellationToken);
        var totalLikes = await database.Likes.CountAsync(cancellationToken);
        var totalBookmarks = await database.Bookmarks.CountAsync(cancellationToken);
        var totalFollows = await database.Follows.CountAsync(cancellationToken);
        return new AdminStatsDto(totalUsers, lockedUsers, totalArticles, draftArticles, publishedArticles,
            archivedArticles, totalComments, pendingReports, totalReports, totalCategories, totalTags,
            totalNotifications, totalViews, totalLikes, totalBookmarks, totalFollows);
    }

    public async Task<AdminRecentActivityDto> AdminRecentActivityAsync(int take, CancellationToken cancellationToken)
    {
        var users = await database.Users.AsNoTracking().OrderByDescending(user => user.CreatedAtUtc).ThenByDescending(user => user.Id)
            .Take(take).Select(user => new AdminRecentUserDto(user.Id, user.UserName!, user.Email!, user.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        var articles = await database.Articles.AsNoTracking().OrderByDescending(article => article.UpdatedAtUtc)
            .ThenByDescending(article => article.Id).Take(take)
            .Select(article => new AdminRecentArticleDto(article.Id, article.Title, article.Slug, article.Status.ToString(), article.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
        var comments = await database.Comments.AsNoTracking().Where(comment => comment.DeletedAtUtc == null)
            .OrderByDescending(comment => comment.CreatedAtUtc).ThenByDescending(comment => comment.Id).Take(take)
            .Select(comment => new AdminRecentCommentDto(comment.Id, comment.ArticleId, comment.AuthorId,
                database.Profiles.Where(profile => profile.UserId == comment.AuthorId).Select(profile => profile.DisplayName).First(),
                comment.Body, comment.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        var reports = await database.Reports.AsNoTracking().OrderByDescending(report => report.CreatedAtUtc)
            .ThenByDescending(report => report.Id).Take(take)
            .Select(report => new AdminRecentReportDto(report.Id, report.TargetType.ToString(), report.TargetId,
                report.Reason.ToString(), report.Status.ToString(), report.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        return new AdminRecentActivityDto(users, articles, comments, reports);
    }

    public async Task<MyStatsDto> MineAsync(Guid userId, CancellationToken cancellationToken)
    {
        var myArticles = database.Articles.AsNoTracking().Where(article => article.AuthorId == userId);
        var totalArticles = await myArticles.CountAsync(cancellationToken);
        var draftArticles = await myArticles.CountAsync(article => article.Status == ArticleStatus.Draft, cancellationToken);
        var publishedArticles = await myArticles.CountAsync(article => article.Status == ArticleStatus.Published, cancellationToken);
        var archivedArticles = await myArticles.CountAsync(article => article.Status == ArticleStatus.Archived, cancellationToken);
        var totalViews = await myArticles.SumAsync(article => article.ViewCount, cancellationToken);
        var totalLikesReceived = await database.Likes.CountAsync(like => database.Articles.Any(article =>
            article.Id == like.ArticleId && article.AuthorId == userId), cancellationToken);
        var totalCommentsReceived = await database.Comments.CountAsync(comment => comment.DeletedAtUtc == null
            && database.Articles.Any(article => article.Id == comment.ArticleId && article.AuthorId == userId), cancellationToken);
        var totalBookmarksReceived = await database.Bookmarks.CountAsync(bookmark => database.Articles.Any(article =>
            article.Id == bookmark.ArticleId && article.AuthorId == userId), cancellationToken);
        var bookmarkedArticles = await database.Bookmarks.CountAsync(bookmark => bookmark.UserId == userId, cancellationToken);
        var followingUsers = await database.Follows.CountAsync(follow => follow.FollowerId == userId, cancellationToken);
        var followers = await database.Follows.CountAsync(follow => follow.FolloweeId == userId, cancellationToken);
        var followingTags = await database.TagFollows.CountAsync(follow => follow.UserId == userId, cancellationToken);
        var unreadNotifications = await database.Notifications.CountAsync(notification =>
            notification.RecipientId == userId && notification.ReadAtUtc == null, cancellationToken);
        return new MyStatsDto(totalArticles, draftArticles, publishedArticles, archivedArticles, totalViews,
            totalLikesReceived, totalCommentsReceived, totalBookmarksReceived, bookmarkedArticles, followingUsers,
            followers, followingTags, unreadNotifications);
    }

    public async Task<PublicReputationDto?> PublicReputationAsync(string userName, CancellationToken cancellationToken)
    {
        var normalizedUserName = userName.Trim().ToUpperInvariant();
        var row = await (
            from profile in database.Profiles.AsNoTracking()
            join user in database.Users.AsNoTracking() on profile.UserId equals user.Id
            where user.NormalizedUserName == normalizedUserName
            select new ContributorRow(user.Id, user.UserName!, profile.DisplayName,
                database.Articles.Count(article => article.AuthorId == user.Id && article.Status == ArticleStatus.Published),
                database.Likes.Count(like => database.Articles.Any(article => article.Id == like.ArticleId
                    && article.AuthorId == user.Id && article.Status == ArticleStatus.Published)),
                database.Comments.Count(comment => comment.DeletedAtUtc == null && database.Articles.Any(article =>
                    article.Id == comment.ArticleId && article.AuthorId == user.Id && article.Status == ArticleStatus.Published))))
            .SingleOrDefaultAsync(cancellationToken);
        return row is null ? null : ToReputation(row);
    }

    public async Task<IReadOnlyList<PublicReputationDto>> TopContributorsAsync(int take,
        CancellationToken cancellationToken)
    {
        var rows = await (
            from profile in database.Profiles.AsNoTracking()
            join user in database.Users.AsNoTracking() on profile.UserId equals user.Id
            let publishedArticles = database.Articles.Count(article => article.AuthorId == user.Id
                && article.Status == ArticleStatus.Published)
            let likesReceived = database.Likes.Count(like => database.Articles.Any(article => article.Id == like.ArticleId
                && article.AuthorId == user.Id && article.Status == ArticleStatus.Published))
            let commentsReceived = database.Comments.Count(comment => comment.DeletedAtUtc == null
                && database.Articles.Any(article => article.Id == comment.ArticleId && article.AuthorId == user.Id
                    && article.Status == ArticleStatus.Published))
            where publishedArticles > 0
            orderby publishedArticles * 10L + likesReceived + commentsReceived * 2L descending,
                profile.DisplayName, user.Id
            select new ContributorRow(user.Id, user.UserName!, profile.DisplayName, publishedArticles,
                likesReceived, commentsReceived))
            .Take(take).ToListAsync(cancellationToken);
        return rows.Select(ToReputation).ToList();
    }

    private static PublicReputationDto ToReputation(ContributorRow row)
    {
        var score = row.PublishedArticles * 10L + row.LikesReceived + row.CommentsReceived * 2L;
        var level = score >= 250 ? "Expert" : score >= 50 ? "Contributor" : "Newbie";
        return new PublicReputationDto(row.UserId, row.UserName, row.DisplayName, row.PublishedArticles,
            row.LikesReceived, row.CommentsReceived, score, level);
    }

    private sealed record ContributorRow(Guid UserId, string UserName, string DisplayName,
        int PublishedArticles, int LikesReceived, int CommentsReceived);

    public async Task<AdminUserActivityStatsDto?> UserActivityAsync(Guid userId, CancellationToken cancellationToken)
    {
        if (!await database.Users.AnyAsync(user => user.Id == userId, cancellationToken))
            return null;
        var articles = await database.Articles.CountAsync(article => article.AuthorId == userId, cancellationToken);
        var publishedArticles = await database.Articles.CountAsync(article => article.AuthorId == userId
            && article.Status == ArticleStatus.Published, cancellationToken);
        var comments = await database.Comments.CountAsync(comment => comment.AuthorId == userId && comment.DeletedAtUtc == null,
            cancellationToken);
        var likesGiven = await database.Likes.CountAsync(like => like.UserId == userId, cancellationToken);
        var bookmarks = await database.Bookmarks.CountAsync(bookmark => bookmark.UserId == userId, cancellationToken);
        var followers = await database.Follows.CountAsync(follow => follow.FolloweeId == userId, cancellationToken);
        var followingUsers = await database.Follows.CountAsync(follow => follow.FollowerId == userId, cancellationToken);
        var followingTags = await database.TagFollows.CountAsync(follow => follow.UserId == userId, cancellationToken);
        var reportsCreated = await database.Reports.CountAsync(report => report.ReporterId == userId, cancellationToken);
        var reportsAgainstUser = await database.Reports.CountAsync(report => report.TargetId == userId
            && report.TargetType == ReportTargetType.User, cancellationToken);
        return new AdminUserActivityStatsDto(userId, articles, publishedArticles, comments, likesGiven, bookmarks,
            followers, followingUsers, followingTags, reportsCreated, reportsAgainstUser);
    }
}
