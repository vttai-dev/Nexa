using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Engagement;
using Nexa.Application.Features.Taxonomy;
using Nexa.Domain.Articles;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class EngagementRepository(NexaDbContext database) : IEngagementRepository
{
    public async Task<bool> SetLikeAsync(Guid userId, Guid articleId, bool enabled, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (enabled)
            return await database.Database.ExecuteSqlInterpolatedAsync(
                $"""INSERT INTO social.likes (user_id, article_id, created_at_utc) SELECT {userId}, {articleId}, {now} FROM content.articles WHERE id = {articleId} AND status = 'Published' ON CONFLICT (user_id, article_id) DO NOTHING""", cancellationToken) > 0;
        return await database.Likes.Where(like => like.UserId == userId && like.ArticleId == articleId).ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<bool> SetBookmarkAsync(Guid userId, Guid articleId, bool enabled, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (enabled)
            return await database.Database.ExecuteSqlInterpolatedAsync(
                $"""INSERT INTO social.bookmarks (user_id, article_id, created_at_utc) SELECT {userId}, {articleId}, {now} FROM content.articles WHERE id = {articleId} AND status = 'Published' ON CONFLICT (user_id, article_id) DO NOTHING""", cancellationToken) > 0;
        return await database.Bookmarks.Where(bookmark => bookmark.UserId == userId && bookmark.ArticleId == articleId).ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<bool> SetFollowAsync(Guid followerId, Guid followeeId, bool enabled, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (enabled)
            return await database.Database.ExecuteSqlInterpolatedAsync(
                $"""INSERT INTO social.follows (follower_id, followee_id, created_at_utc) VALUES ({followerId}, {followeeId}, {now}) ON CONFLICT (follower_id, followee_id) DO NOTHING""", cancellationToken) > 0;
        return await database.Follows.Where(follow => follow.FollowerId == followerId && follow.FolloweeId == followeeId).ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<bool> SetTagFollowAsync(Guid userId, Guid tagId, bool enabled, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (enabled)
            return await database.Database.ExecuteSqlInterpolatedAsync(
                $"""INSERT INTO social.tag_follows (user_id, tag_id, created_at_utc) VALUES ({userId}, {tagId}, {now}) ON CONFLICT (user_id, tag_id) DO NOTHING""", cancellationToken) > 0;
        return await database.TagFollows.Where(follow => follow.UserId == userId && follow.TagId == tagId).ExecuteDeleteAsync(cancellationToken) > 0;
    }

    public async Task<ArticleEngagementStateDto> ArticleStateAsync(Guid userId, Guid articleId, CancellationToken cancellationToken)
    {
        var liked = await database.Likes.AnyAsync(like => like.UserId == userId && like.ArticleId == articleId, cancellationToken);
        var bookmarked = await database.Bookmarks.AnyAsync(bookmark => bookmark.UserId == userId && bookmark.ArticleId == articleId,
            cancellationToken);
        return new ArticleEngagementStateDto(articleId, liked, bookmarked);
    }

    public async Task<FollowStateDto> UserFollowStateAsync(Guid followerId, Guid followeeId, CancellationToken cancellationToken)
    {
        var following = await database.Follows.AnyAsync(follow => follow.FollowerId == followerId && follow.FolloweeId == followeeId,
            cancellationToken);
        return new FollowStateDto(followeeId, following);
    }

    public async Task<FollowStateDto> TagFollowStateAsync(Guid userId, Guid tagId, CancellationToken cancellationToken)
    {
        var following = await database.TagFollows.AnyAsync(follow => follow.UserId == userId && follow.TagId == tagId, cancellationToken);
        return new FollowStateDto(tagId, following);
    }

    public async Task<PagedResult<TagStatsDto>> FollowedTagsAsync(Guid userId, PageRequest page, CancellationToken cancellationToken)
    {
        var followedTags = database.Tags.AsNoTracking()
            .Where(tag => database.TagFollows.Any(follow => follow.UserId == userId && follow.TagId == tag.Id));
        var total = await followedTags.CountAsync(cancellationToken);
        var items = await followedTags
            .OrderBy(tag => tag.Name)
            .ThenBy(tag => tag.Id)
            .Skip(page.Offset)
            .Take(page.PageSize)
            .Select(tag => new TagStatsDto(
                tag.Id,
                tag.Name,
                tag.Slug,
                database.Articles.Count(article => article.Status == ArticleStatus.Published
                    && article.Tags.Any(link => link.TagId == tag.Id)),
                database.TagFollows.Count(follow => follow.TagId == tag.Id)))
            .ToListAsync(cancellationToken);
        return new PagedResult<TagStatsDto>(items, page.Page, page.PageSize, total);
    }
}
