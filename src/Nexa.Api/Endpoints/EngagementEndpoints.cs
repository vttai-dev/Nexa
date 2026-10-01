using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Application.Features.Engagement;
using Nexa.Application.Features.Taxonomy;

namespace Nexa.Api.Endpoints;

public static class EngagementEndpoints
{
    public static void MapEngagementEndpoints(this RouteGroupBuilder api)
    {
        var secured = api.MapGroup("").RequireAuthorization().WithTags("Engagement");
        secured.MapPut("/articles/{id:guid}/like", async (Guid id, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.LikeAsync(id, true, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("LikeArticle").Produces(204);
        secured.MapDelete("/articles/{id:guid}/like", async (Guid id, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.LikeAsync(id, false, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("UnlikeArticle").Produces(204);
        secured.MapPut("/articles/{slug}/like", async (string slug, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.LikeBySlugAsync(slug, true, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("LikeArticleBySlug").Produces(204);
        secured.MapDelete("/articles/{slug}/like", async (string slug, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.LikeBySlugAsync(slug, false, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("UnlikeArticleBySlug").Produces(204);
        secured.MapPut("/articles/{id:guid}/bookmark", async (Guid id, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.BookmarkAsync(id, true, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("BookmarkArticle").Produces(204);
        secured.MapDelete("/articles/{id:guid}/bookmark", async (Guid id, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.BookmarkAsync(id, false, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("RemoveBookmark").Produces(204);
        secured.MapPut("/articles/{slug}/bookmark", async (string slug, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.BookmarkBySlugAsync(slug, true, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("BookmarkArticleBySlug").Produces(204);
        secured.MapDelete("/articles/{slug}/bookmark", async (string slug, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.BookmarkBySlugAsync(slug, false, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("RemoveBookmarkBySlug").Produces(204);
        secured.MapGet("/articles/{id:guid}/engagement", async (Guid id, EngagementHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ArticleStateAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("GetArticleEngagementState").Produces<ArticleEngagementStateDto>();
        secured.MapGet("/articles/{slug}/engagement", async (string slug, EngagementHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ArticleStateBySlugAsync(slug, cancellationToken)).ToHttpResult(context))
            .WithName("GetArticleEngagementStateBySlug").Produces<ArticleEngagementStateDto>();
        secured.MapPut("/users/{id:guid}/follow", async (Guid id, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowAsync(id, true, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("FollowUser").Produces(204);
        secured.MapDelete("/users/{id:guid}/follow", async (Guid id, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowAsync(id, false, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("UnfollowUser").Produces(204);
        secured.MapPut("/users/{userName}/follow", async (string userName, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowByUserNameAsync(userName, true, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("FollowUserByUserName").Produces(204);
        secured.MapDelete("/users/{userName}/follow", async (string userName, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowByUserNameAsync(userName, false, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("UnfollowUserByUserName").Produces(204);
        secured.MapGet("/users/{id:guid}/follow-state", async (Guid id, EngagementHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UserFollowStateAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("GetUserFollowState").Produces<FollowStateDto>();
        secured.MapGet("/users/{userName}/follow-state", async (string userName, EngagementHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UserFollowStateByUserNameAsync(userName, cancellationToken)).ToHttpResult(context))
            .WithName("GetUserFollowStateByUserName").Produces<FollowStateDto>();
        secured.MapPut("/tags/{id:guid}/follow", async (Guid id, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowTagAsync(id, true, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("FollowTag").Produces(204);
        secured.MapDelete("/tags/{id:guid}/follow", async (Guid id, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowTagAsync(id, false, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("UnfollowTag").Produces(204);
        secured.MapPut("/tags/{slug}/follow", async (string slug, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowTagBySlugAsync(slug, true, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("FollowTagBySlug").Produces(204);
        secured.MapDelete("/tags/{slug}/follow", async (string slug, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowTagBySlugAsync(slug, false, cancellationToken)).ToHttpResult(context)).RequireRateLimiting("content-write").WithName("UnfollowTagBySlug").Produces(204);
        secured.MapGet("/tags/{id:guid}/follow-state", async (Guid id, EngagementHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TagFollowStateAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("GetTagFollowState").Produces<FollowStateDto>();
        secured.MapGet("/tags/{slug}/follow-state", async (string slug, EngagementHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TagFollowStateBySlugAsync(slug, cancellationToken)).ToHttpResult(context))
            .WithName("GetTagFollowStateBySlug").Produces<FollowStateDto>();
        secured.MapGet("/me/bookmarks", async (int? page, int? pageSize, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.BookmarksAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListMyBookmarks").Produces<PagedResult<ArticleSummaryDto>>();
        secured.MapGet("/me/likes", async (int? page, int? pageSize, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.LikesAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListMyLikedArticles").Produces<PagedResult<ArticleSummaryDto>>();
        secured.MapGet("/me/feed", async (int? page, int? pageSize, EngagementHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FeedAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListMyFeed").Produces<PagedResult<ArticleSummaryDto>>();
        secured.MapGet("/me/tags/following", async (int? page, int? pageSize, EngagementHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowedTagsAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListMyFollowedTags").Produces<PagedResult<TagStatsDto>>();
    }
}
