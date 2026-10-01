using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Infrastructure.Persistence.Queries;

public sealed partial class ArticleQueries(NexaDbContext database) : IArticleQueries
{
    public Task<PagedResult<ArticleSummaryDto>> ListPublishedAsync(ArticleFilter filter, CancellationToken cancellationToken)
    {
        var query = Published();
        if (filter.CategoryId.HasValue)
            query = query.Where(article => article.CategoryId == filter.CategoryId);
        if (filter.AuthorId.HasValue)
            query = query.Where(article => article.AuthorId == filter.AuthorId);
        if (filter.TagId.HasValue)
            query = query.Where(article => article.Tags.Any(tag => tag.TagId == filter.TagId.Value));
        if (filter.PublishedFromUtc.HasValue)
            query = query.Where(article => article.PublishedAtUtc >= filter.PublishedFromUtc.Value);
        if (filter.PublishedToUtc.HasValue)
            query = query.Where(article => article.PublishedAtUtc <= filter.PublishedToUtc.Value);
        return PageAsync(query.OrderByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id),
            filter.Pagination, cancellationToken);
    }

    public async Task<IReadOnlyList<ArticleArchiveMonthDto>> ArchiveMonthsAsync(CancellationToken cancellationToken) =>
        await Published().Where(article => article.PublishedAtUtc != null)
            .GroupBy(article => new { article.PublishedAtUtc!.Value.Year, article.PublishedAtUtc.Value.Month })
            .Select(group => new ArticleArchiveMonthDto(group.Key.Year, group.Key.Month, group.Count()))
            .OrderByDescending(month => month.Year).ThenByDescending(month => month.Month)
            .ToListAsync(cancellationToken);

    public Task<PagedResult<ArticleSummaryDto>> ListForModerationAsync(PageRequest page, ArticleStatus? status,
        CancellationToken cancellationToken)
    {
        var query = database.Articles.AsNoTracking();
        if (status.HasValue)
            query = query.Where(article => article.Status == status.Value);
        return PageAsync(query.OrderByDescending(article => article.UpdatedAtUtc).ThenByDescending(article => article.Id), page, cancellationToken);
    }

    public Task<PagedResult<ArticleSummaryDto>> PopularAsync(PageRequest page, CancellationToken cancellationToken) =>
        PageAsync(Published()
            .OrderByDescending(article => article.ViewCount
                + database.Likes.Count(like => like.ArticleId == article.Id) * 3
                + database.Comments.Count(comment => comment.ArticleId == article.Id && comment.DeletedAtUtc == null) * 2
                + database.Bookmarks.Count(bookmark => bookmark.ArticleId == article.Id) * 2)
            .ThenByDescending(article => article.PublishedAtUtc)
            .ThenByDescending(article => article.Id), page, cancellationToken);

    public Task<PagedResult<ArticleSummaryDto>> FeaturedAsync(PageRequest page, CancellationToken cancellationToken) =>
        PageAsync(Published().Where(article => article.IsFeatured)
            .OrderByDescending(article => article.FeaturedAtUtc).ThenByDescending(article => article.PublishedAtUtc)
            .ThenByDescending(article => article.Id), page, cancellationToken);

    public Task<PagedResult<ArticleSummaryDto>> TrendingAsync(PageRequest page, int days, CancellationToken cancellationToken)
    {
        var since = DateTimeOffset.UtcNow.AddDays(-days);
        var query = Published().Where(article => article.PublishedAtUtc >= since ||
                database.Likes.Any(like => like.ArticleId == article.Id && like.CreatedAtUtc >= since) ||
                database.Comments.Any(comment => comment.ArticleId == article.Id && comment.DeletedAtUtc == null && comment.CreatedAtUtc >= since) ||
                database.Bookmarks.Any(bookmark => bookmark.ArticleId == article.Id && bookmark.CreatedAtUtc >= since))
            .OrderByDescending(article => article.ViewCount +
                database.Likes.Count(like => like.ArticleId == article.Id && like.CreatedAtUtc >= since) * 3 +
                database.Comments.Count(comment => comment.ArticleId == article.Id && comment.DeletedAtUtc == null && comment.CreatedAtUtc >= since) * 2 +
                database.Bookmarks.Count(bookmark => bookmark.ArticleId == article.Id && bookmark.CreatedAtUtc >= since))
            .ThenByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id);
        return PageAsync(query, page, cancellationToken);
    }

    public Task<PagedResult<ArticleSummaryDto>> RecommendationsAsync(Guid userId, PageRequest page,
        CancellationToken cancellationToken)
    {
        var query = Published().Where(article => article.AuthorId != userId &&
                !database.Likes.Any(like => like.ArticleId == article.Id && like.UserId == userId) &&
                !database.Bookmarks.Any(bookmark => bookmark.ArticleId == article.Id && bookmark.UserId == userId))
            .OrderByDescending(article =>
                (database.Follows.Any(follow => follow.FollowerId == userId && follow.FolloweeId == article.AuthorId) ? 1000 : 0) +
                article.Tags.Count(tag => database.TagFollows.Any(follow => follow.UserId == userId && follow.TagId == tag.TagId)) * 100 +
                article.ViewCount + database.Likes.Count(like => like.ArticleId == article.Id) * 3 +
                database.Comments.Count(comment => comment.ArticleId == article.Id && comment.DeletedAtUtc == null) * 2)
            .ThenByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id);
        return PageAsync(query, page, cancellationToken);
    }

    public Task<PagedResult<ArticleSummaryDto>> ListPublishedByUserNameAsync(string userName, PageRequest page,
        CancellationToken cancellationToken)
    {
        var normalized = userName.Trim().ToUpperInvariant();
        return PageAsync(Published()
            .Where(article => database.Users.Any(user => user.Id == article.AuthorId && user.NormalizedUserName == normalized))
            .OrderByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id), page, cancellationToken);
    }

    public async Task<PagedResult<ArticleSummaryDto>?> ListPublishedByCategorySlugAsync(string slug, PageRequest page,
        CancellationToken cancellationToken)
    {
        var categoryId = await database.Categories.AsNoTracking().Where(category => category.Slug == slug)
            .Select(category => (Guid?)category.Id).SingleOrDefaultAsync(cancellationToken);
        return categoryId is null ? null : await PageAsync(Published().Where(article => article.CategoryId == categoryId.Value)
            .OrderByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id), page, cancellationToken);
    }

    public async Task<PagedResult<ArticleSummaryDto>?> ListPublishedByTagSlugAsync(string slug, PageRequest page,
        CancellationToken cancellationToken)
    {
        var tagId = await database.Tags.AsNoTracking().Where(tag => tag.Slug == slug)
            .Select(tag => (Guid?)tag.Id).SingleOrDefaultAsync(cancellationToken);
        return tagId is null ? null : await PageAsync(Published().Where(article => article.Tags.Any(tag => tag.TagId == tagId.Value))
            .OrderByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id), page, cancellationToken);
    }

    public Task<ArticleDto?> GetPublishedAsync(string slug, CancellationToken cancellationToken) =>
        Details(Published().Where(article => article.Slug == slug)).SingleOrDefaultAsync(cancellationToken);

    public Task<ArticleDto?> GetForModerationAsync(Guid id, CancellationToken cancellationToken) =>
        Details(database.Articles.AsNoTracking().Where(article => article.Id == id)).SingleOrDefaultAsync(cancellationToken);

    public async Task<PagedResult<ArticleSummaryDto>> RelatedAsync(string slug, PageRequest page, CancellationToken cancellationToken)
    {
        var source = await Published().Where(article => article.Slug == slug).Select(article => new
        {
            article.Id,
            article.CategoryId,
            TagIds = article.Tags.Select(tag => tag.TagId).ToList()
        }).SingleOrDefaultAsync(cancellationToken);
        if (source is null)
            return new PagedResult<ArticleSummaryDto>([], page.Page, page.PageSize, 0);
        var query = Published().Where(article => article.Id != source.Id &&
                (article.CategoryId == source.CategoryId || article.Tags.Any(tag => source.TagIds.Contains(tag.TagId))))
            .OrderByDescending(article => article.Tags.Count(tag => source.TagIds.Contains(tag.TagId)))
            .ThenByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id);
        return await PageAsync(query, page, cancellationToken);
    }

    public async Task<ArticleMetadataDto?> MetadataAsync(string slug, CancellationToken cancellationToken)
    {
        var metadata = await Published().Where(article => article.Slug == slug).Select(article => new
        {
            article.Id,
            article.Title,
            article.Slug,
            article.BodyMarkdown,
            article.MetaTitle,
            article.MetaDescription,
            article.Keywords,
            article.CanonicalUrl,
            article.ViewCount,
            article.ShareCount,
            article.UpdatedAtUtc,
            article.PublishedAtUtc,
            LikeCount = database.Likes.Count(like => like.ArticleId == article.Id),
            CommentCount = database.Comments.Count(comment => comment.ArticleId == article.Id && comment.DeletedAtUtc == null),
            BookmarkCount = database.Bookmarks.Count(bookmark => bookmark.ArticleId == article.Id)
        }).SingleOrDefaultAsync(cancellationToken);
        return metadata is null ? null : new ArticleMetadataDto(metadata.Id, metadata.Title, metadata.Slug,
            metadata.ViewCount, metadata.LikeCount, metadata.CommentCount, metadata.BookmarkCount,
            CountWords(metadata.BodyMarkdown), ReadingMinutes(metadata.BodyMarkdown), metadata.UpdatedAtUtc,
            metadata.PublishedAtUtc, metadata.MetaTitle, metadata.MetaDescription, metadata.Keywords, metadata.CanonicalUrl,
            metadata.ShareCount);
    }

    public Task<PagedResult<ArticleSummaryDto>> ListOwnedAsync(Guid userId, PageRequest page, ArticleStatus? status,
        CancellationToken cancellationToken)
    {
        var query = database.Articles.AsNoTracking().Where(article => article.AuthorId == userId);
        if (status.HasValue)
            query = query.Where(article => article.Status == status.Value);
        return PageAsync(query.OrderByDescending(article => article.CreatedAtUtc).ThenByDescending(article => article.Id), page,
            cancellationToken);
    }

    public Task<PagedResult<ArticleSummaryDto>> FeedAsync(Guid userId, PageRequest page, CancellationToken cancellationToken) =>
        PageAsync(Published()
            .Where(article => article.AuthorId != userId &&
                (database.Follows.Any(follow => follow.FollowerId == userId && follow.FolloweeId == article.AuthorId) ||
                 article.Tags.Any(tag => database.TagFollows.Any(follow => follow.UserId == userId && follow.TagId == tag.TagId))))
            .OrderByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id), page, cancellationToken);

    public Task<ArticleDto?> GetOwnedAsync(Guid id, Guid userId, CancellationToken cancellationToken) =>
        Details(database.Articles.AsNoTracking().Where(article => article.Id == id && article.AuthorId == userId))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<PagedResult<ArticleRevisionSummaryDto>> ListRevisionsAsync(Guid articleId, PageRequest page,
        CancellationToken cancellationToken)
    {
        var query = database.ArticleRevisions.AsNoTracking().Where(revision => revision.ArticleId == articleId)
            .OrderByDescending(revision => revision.CreatedAtUtc).ThenByDescending(revision => revision.Id);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(page.Offset).Take(page.PageSize).Select(revision => new ArticleRevisionSummaryDto(
            revision.Id, revision.ArticleId, revision.Action, revision.EditorId, revision.Status, revision.Title,
            revision.Slug, revision.ArticleVersion, revision.CreatedAtUtc)).ToListAsync(cancellationToken);
        return new PagedResult<ArticleRevisionSummaryDto>(items, page.Page, page.PageSize, total);
    }

    public Task<ArticleRevisionDto?> GetRevisionAsync(Guid articleId, Guid revisionId, CancellationToken cancellationToken) =>
        database.ArticleRevisions.AsNoTracking()
            .Where(revision => revision.ArticleId == articleId && revision.Id == revisionId)
            .Select(revision => new ArticleRevisionDto(revision.Id, revision.ArticleId, revision.Action, revision.EditorId,
                revision.Status, revision.Title, revision.Slug, revision.Summary, revision.BodyMarkdown, revision.CategoryId,
                revision.TagIds, revision.ArticleVersion, revision.CreatedAtUtc))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<PagedResult<ArticleSummaryDto>> BookmarksAsync(Guid userId, PageRequest page, CancellationToken cancellationToken) =>
        PageAsync(Published().Where(article => database.Bookmarks.Any(bookmark => bookmark.UserId == userId && bookmark.ArticleId == article.Id))
            .OrderByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id), page, cancellationToken);

    public Task<PagedResult<ArticleSummaryDto>> LikesAsync(Guid userId, PageRequest page, CancellationToken cancellationToken) =>
        PageAsync(Published().Where(article => database.Likes.Any(like => like.UserId == userId && like.ArticleId == article.Id))
            .OrderByDescending(article => article.PublishedAtUtc).ThenByDescending(article => article.Id), page, cancellationToken);

    private IQueryable<Article> Published() => database.Articles.AsNoTracking().Where(article => article.Status == ArticleStatus.Published);

    private async Task<PagedResult<ArticleSummaryDto>> PageAsync(IQueryable<Article> query, PageRequest page, CancellationToken cancellationToken)
    {
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(page.Offset).Take(page.PageSize).Select(article =>
            new ArticleSummaryDto(article.Id, article.Title, article.Slug, article.Summary, article.AuthorId,
                database.Profiles.Where(profile => profile.UserId == article.AuthorId).Select(profile => profile.DisplayName).First(),
                article.Status, article.PublishedAtUtc, article.Version, article.IsFeatured,
                article.ViewCount,
                database.Likes.Count(like => like.ArticleId == article.Id),
                database.Comments.Count(comment => comment.ArticleId == article.Id && comment.DeletedAtUtc == null),
                article.ShareCount)).ToListAsync(cancellationToken);
        return new PagedResult<ArticleSummaryDto>(items, page.Page, page.PageSize, total);
    }

    private IQueryable<ArticleDto> Details(IQueryable<Article> query) => query.Select(article =>
        new ArticleDto(article.Id, article.Title, article.Slug, article.Summary, article.BodyMarkdown, article.AuthorId,
            database.Profiles.Where(profile => profile.UserId == article.AuthorId).Select(profile => profile.DisplayName).First(),
            article.CategoryId, article.Tags.Select(tag => tag.TagId).ToList(), article.Status,
            article.CreatedAtUtc, article.UpdatedAtUtc, article.PublishedAtUtc, article.Version,
            database.Likes.Count(like => like.ArticleId == article.Id),
            database.Comments.Count(comment => comment.ArticleId == article.Id),
            article.ViewCount, article.IsFeatured, article.ShareCount));

    private static int CountWords(string markdown) => WordRegex().Count(markdown);

    private static int ReadingMinutes(string markdown)
    {
        var words = CountWords(markdown);
        return Math.Max(1, (int)Math.Ceiling(words / 200.0));
    }

    [GeneratedRegex("[\\p{L}\\p{N}]+", RegexOptions.CultureInvariant)]
    private static partial Regex WordRegex();
}
