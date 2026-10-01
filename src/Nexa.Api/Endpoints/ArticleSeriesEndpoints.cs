using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;

namespace Nexa.Api.Endpoints;

public static class ArticleSeriesEndpoints
{
    public static void MapArticleSeriesEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/series/{slug}", async (string slug, ArticleSeriesHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.PublicAsync(slug, cancellationToken)).ToHttpResult(context))
            .WithTags("Article series").WithName("GetPublicArticleSeries").Produces<ArticleSeriesDto>();

        api.MapGet("/users/{userName}/series", async (string userName, int? page, int? pageSize,
            ArticleSeriesHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ByUserNameAsync(userName, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken))
                .ToHttpResult(context))
            .WithTags("Article series").WithName("ListUserArticleSeries").Produces<PagedResult<ArticleSeriesSummaryDto>>();

        api.MapGet("/me/series", async (int? page, int? pageSize, ArticleSeriesHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.MineAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Article series").WithName("ListMyArticleSeries")
            .Produces<PagedResult<ArticleSeriesSummaryDto>>();

        api.MapPost("/me/series", async (ArticleSeriesInput request, ArticleSeriesHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CreateAsync(request, cancellationToken)).ToHttpResult(context,
                series => Results.Created($"/api/v1/series/{series.Slug}", series)))
            .RequireAuthorization("Authoring").WithTags("Article series").WithName("CreateArticleSeries")
            .Produces<ArticleSeriesSummaryDto>(201);

        api.MapPut("/me/series/{id:guid}", async (Guid id, ArticleSeriesInput request, ArticleSeriesHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UpdateAsync(id, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").WithTags("Article series").WithName("UpdateArticleSeries").Produces(204);

        api.MapDelete("/me/series/{id:guid}", async (Guid id, ArticleSeriesHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.DeleteAsync(id, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").WithTags("Article series").WithName("DeleteArticleSeries").Produces(204);

        api.MapPut("/me/series/{id:guid}/articles/{articleId:guid}", async (Guid id, Guid articleId,
            ArticleSeriesHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.AddArticleAsync(id, articleId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").WithTags("Article series").WithName("AddArticleToSeries").Produces(204);

        api.MapDelete("/me/series/{id:guid}/articles/{articleId:guid}", async (Guid id, Guid articleId,
            ArticleSeriesHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RemoveArticleAsync(id, articleId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").WithTags("Article series").WithName("RemoveArticleFromSeries").Produces(204);

        api.MapPut("/me/series/{id:guid}/articles/order", async (Guid id, ReorderSeriesArticlesRequest request,
            ArticleSeriesHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ReorderAsync(id, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").WithTags("Article series").WithName("ReorderSeriesArticles").Produces(204);
    }
}
