using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Application.Features.Taxonomy;
using Nexa.Domain.Engagement;
using Nexa.Domain.Notifications;

namespace Nexa.Application.Features.Engagement;

public sealed class EngagementHandler(IEngagementRepository repository, IArticleRepository articles,
    IArticleQueries queries, ITaxonomyRepository taxonomy, IIdentityService identity, IProfileRepository profiles,
    INotificationRepository notifications,
    IUnitOfWork unitOfWork, ICurrentUser currentUser, TimeProvider clock)
{
    public async Task<Result<Unit>> LikeAsync(Guid articleId, bool enabled, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        if (!await articles.IsPublishedAsync(articleId, cancellationToken))
            return Result<Unit>.Failure(Error.Missing("Article"));
        var changed = await repository.SetLikeAsync(userId, articleId, enabled, clock.GetUtcNow(), cancellationToken);
        if (enabled && changed && await articles.NotificationTargetAsync(articleId, cancellationToken) is { } article
            && article.AuthorId != userId)
        {
            notifications.Add(new Notification(article.AuthorId, NotificationType.ArticleLiked,
                $"Your article '{article.Title}' was liked.", clock.GetUtcNow(), userId, article.Id));
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> LikeBySlugAsync(string slug, bool enabled, CancellationToken cancellationToken)
    {
        var article = await articles.FindPublishedAsync(slug, cancellationToken);
        return article is null ? Result<Unit>.Failure(Error.Missing("Article")) : await LikeAsync(article.Id, enabled, cancellationToken);
    }

    public async Task<Result<Unit>> BookmarkAsync(Guid articleId, bool enabled, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        if (!await articles.IsPublishedAsync(articleId, cancellationToken))
            return Result<Unit>.Failure(Error.Missing("Article"));
        await repository.SetBookmarkAsync(userId, articleId, enabled, clock.GetUtcNow(), cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> BookmarkBySlugAsync(string slug, bool enabled, CancellationToken cancellationToken)
    {
        var article = await articles.FindPublishedAsync(slug, cancellationToken);
        return article is null ? Result<Unit>.Failure(Error.Missing("Article")) : await BookmarkAsync(article.Id, enabled, cancellationToken);
    }

    public async Task<Result<ArticleEngagementStateDto>> ArticleStateAsync(Guid articleId, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<ArticleEngagementStateDto>.Failure(Error.Unauthorized);
        if (!await articles.IsPublishedAsync(articleId, cancellationToken))
            return Result<ArticleEngagementStateDto>.Failure(Error.Missing("Article"));
        return Result<ArticleEngagementStateDto>.Success(await repository.ArticleStateAsync(userId, articleId, cancellationToken));
    }

    public async Task<Result<ArticleEngagementStateDto>> ArticleStateBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var article = await articles.FindPublishedAsync(slug, cancellationToken);
        return article is null ? Result<ArticleEngagementStateDto>.Failure(Error.Missing("Article"))
            : await ArticleStateAsync(article.Id, cancellationToken);
    }

    public async Task<Result<Unit>> FollowAsync(Guid followeeId, bool enabled, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var follow = new Follow(userId, followeeId, clock.GetUtcNow());
        if (!await identity.ExistsAsync(followeeId, cancellationToken))
            return Result<Unit>.Failure(Error.Missing("User"));
        var changed = await repository.SetFollowAsync(follow.FollowerId, follow.FolloweeId, enabled, follow.CreatedAtUtc, cancellationToken);
        if (enabled && changed)
        {
            notifications.Add(new Notification(follow.FolloweeId, NotificationType.UserFollowed,
                "You have a new follower.", clock.GetUtcNow(), follow.FollowerId));
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> FollowByUserNameAsync(string userName, bool enabled, CancellationToken cancellationToken)
    {
        var profile = await profiles.GetByUserNameAsync(userName, cancellationToken);
        return profile is null ? Result<Unit>.Failure(Error.Missing("User")) : await FollowAsync(profile.UserId, enabled, cancellationToken);
    }

    public async Task<Result<FollowStateDto>> UserFollowStateAsync(Guid followeeId, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<FollowStateDto>.Failure(Error.Unauthorized);
        if (!await identity.ExistsAsync(followeeId, cancellationToken))
            return Result<FollowStateDto>.Failure(Error.Missing("User"));
        return Result<FollowStateDto>.Success(await repository.UserFollowStateAsync(userId, followeeId, cancellationToken));
    }

    public async Task<Result<FollowStateDto>> UserFollowStateByUserNameAsync(string userName, CancellationToken cancellationToken)
    {
        var profile = await profiles.GetByUserNameAsync(userName, cancellationToken);
        return profile is null ? Result<FollowStateDto>.Failure(Error.Missing("User"))
            : await UserFollowStateAsync(profile.UserId, cancellationToken);
    }

    public async Task<Result<Unit>> FollowTagAsync(Guid tagId, bool enabled, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var follow = new TagFollow(userId, tagId, clock.GetUtcNow());
        if (await taxonomy.FindTagAsync(follow.TagId, cancellationToken) is null)
            return Result<Unit>.Failure(Error.Missing("Tag"));
        await repository.SetTagFollowAsync(follow.UserId, follow.TagId, enabled, follow.CreatedAtUtc, cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> FollowTagBySlugAsync(string slug, bool enabled, CancellationToken cancellationToken)
    {
        var tag = await taxonomy.FindTagBySlugAsync(slug, cancellationToken);
        return tag is null ? Result<Unit>.Failure(Error.Missing("Tag")) : await FollowTagAsync(tag.Id, enabled, cancellationToken);
    }

    public async Task<Result<FollowStateDto>> TagFollowStateAsync(Guid tagId, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<FollowStateDto>.Failure(Error.Unauthorized);
        if (await taxonomy.FindTagAsync(tagId, cancellationToken) is null)
            return Result<FollowStateDto>.Failure(Error.Missing("Tag"));
        return Result<FollowStateDto>.Success(await repository.TagFollowStateAsync(userId, tagId, cancellationToken));
    }

    public async Task<Result<FollowStateDto>> TagFollowStateBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var tag = await taxonomy.FindTagBySlugAsync(slug, cancellationToken);
        return tag is null ? Result<FollowStateDto>.Failure(Error.Missing("Tag")) : await TagFollowStateAsync(tag.Id, cancellationToken);
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> BookmarksAsync(PageRequest page, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.BookmarksAsync(userId, page, cancellationToken));
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> LikesAsync(PageRequest page, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.LikesAsync(userId, page, cancellationToken));
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> FeedAsync(PageRequest page, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.FeedAsync(userId, page, cancellationToken));
    }

    public async Task<Result<PagedResult<TagStatsDto>>> FollowedTagsAsync(PageRequest page, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<TagStatsDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<TagStatsDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<TagStatsDto>>.Success(await repository.FollowedTagsAsync(userId, page, cancellationToken));
    }
}
