using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Api.Endpoints;

public static class ArticleReviewEndpoints
{
    public static void MapArticleReviewEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/me/articles/{articleId:guid}/reviews", async (Guid articleId,
            SubmitArticleReviewRequest request, ArticleReviewHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.SubmitAsync(articleId, request, cancellationToken)).ToHttpResult(context,
                review => Results.Json(review, statusCode: StatusCodes.Status201Created)))
            .RequireAuthorization("Authoring").RequireRateLimiting("content-write").WithTags("Article Reviews").WithName("SubmitArticleReview")
            .Produces<ArticleReviewDto>(201);

        api.MapGet("/me/articles/{articleId:guid}/reviews", async (Guid articleId, int? page, int? pageSize,
            ArticleReviewHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.HistoryAsync(articleId, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken))
            .ToHttpResult(context))
            .RequireAuthorization().WithTags("Article Reviews").WithName("ListMyArticleReviews")
            .Produces<PagedResult<ArticleReviewDto>>();

        api.MapDelete("/me/article-reviews/{reviewId:guid}", async (Guid reviewId,
            ArticleReviewHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.WithdrawAsync(reviewId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").RequireRateLimiting("content-write").WithTags("Article Reviews").WithName("WithdrawArticleReview").Produces(204);

        var moderation = api.MapGroup("/moderation/article-reviews").RequireAuthorization("Moderation").WithTags("Moderation");
        moderation.MapGet("/", async (ArticleReviewStatus? status, int? page, int? pageSize,
            ArticleReviewHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.QueueAsync(status, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken))
            .ToHttpResult(context))
            .WithName("ListArticleReviewQueue").Produces<PagedResult<ArticleReviewQueueItemDto>>();

        moderation.MapGet("/{reviewId:guid}", async (Guid reviewId, ArticleReviewHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.GetQueueItemAsync(reviewId, cancellationToken)).ToHttpResult(context))
            .WithName("GetArticleReview").Produces<ArticleReviewQueueItemDto>();

        moderation.MapPut("/{reviewId:guid}/decision", async (Guid reviewId,
            DecideArticleReviewRequest request, ArticleReviewHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.DecideAsync(reviewId, request, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("content-write").WithName("DecideArticleReview").Produces(204);
    }
}
