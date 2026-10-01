using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Api.Endpoints;

public static class ArticleEndpoints
{
    public static void MapArticleEndpoints(this RouteGroupBuilder api)
    {
        var articles = api.MapGroup("/articles").WithTags("Articles");
        articles.MapGet("/", async (int? page, int? pageSize, Guid? categoryId, Guid? tagId, Guid? authorId,
            DateTimeOffset? publishedFromUtc, DateTimeOffset? publishedToUtc,
            ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListAsync(new ArticleFilter(new PageRequest(page ?? 1, pageSize ?? 20), categoryId, tagId, authorId,
                publishedFromUtc, publishedToUtc), cancellationToken)).ToHttpResult(context))
            .WithName("ListArticles").Produces<PagedResult<ArticleSummaryDto>>();

        articles.MapGet("/popular", async (int? page, int? pageSize, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.PopularAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListPopularArticles").Produces<PagedResult<ArticleSummaryDto>>();

        articles.MapGet("/featured", async (int? page, int? pageSize, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FeaturedAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListFeaturedArticles").Produces<PagedResult<ArticleSummaryDto>>();

        articles.MapGet("/trending", async (int? days, int? page, int? pageSize, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TrendingAsync(new PageRequest(page ?? 1, pageSize ?? 20), days, cancellationToken)).ToHttpResult(context))
            .WithName("ListTrendingArticles").Produces<PagedResult<ArticleSummaryDto>>();

        articles.MapGet("/archive-months", async (ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ArchiveMonthsAsync(cancellationToken)).ToHttpResult(context))
            .WithName("ListArticleArchiveMonths").Produces<IReadOnlyList<ArticleArchiveMonthDto>>();

        api.MapGet("/users/{userName}/articles", async (string userName, int? page, int? pageSize,
            ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListByUserNameAsync(userName, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken))
                .ToHttpResult(context))
            .WithTags("Articles").WithName("ListUserArticles").Produces<PagedResult<ArticleSummaryDto>>();

        api.MapGet("/categories/{slug}/articles", async (string slug, int? page, int? pageSize,
            ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListByCategorySlugAsync(slug, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken))
            .ToHttpResult(context))
            .WithTags("Articles", "Categories").WithName("ListCategoryArticlesBySlug").Produces<PagedResult<ArticleSummaryDto>>();

        api.MapGet("/tags/{slug}/articles", async (string slug, int? page, int? pageSize,
            ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListByTagSlugAsync(slug, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken))
            .ToHttpResult(context))
            .WithTags("Articles", "Tags").WithName("ListTagArticlesBySlug").Produces<PagedResult<ArticleSummaryDto>>();

        articles.MapGet("/{slug}", async (string slug, ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.GetAsync(slug, cancellationToken)).ToHttpResult(context)).WithName("GetArticle").Produces<ArticleDto>();

        articles.MapGet("/{slug}/related", async (string slug, int? page, int? pageSize, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RelatedAsync(slug, new PageRequest(page ?? 1, pageSize ?? 10), cancellationToken)).ToHttpResult(context))
            .WithName("ListRelatedArticles").Produces<PagedResult<ArticleSummaryDto>>();

        articles.MapGet("/{slug}/metadata", async (string slug, ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.MetadataAsync(slug, cancellationToken)).ToHttpResult(context))
            .WithName("GetArticleMetadata").Produces<ArticleMetadataDto>();

        articles.MapGet("/slug-availability/{slug}", async (string slug, Guid? exceptArticleId, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.SlugAvailabilityAsync(slug, exceptArticleId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithName("CheckArticleSlugAvailability").Produces<SlugAvailabilityDto>();

        articles.MapPost("/{slug}/views", async (string slug, ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RecordViewAsync(slug, cancellationToken)).ToHttpResult(context))
            .WithName("RecordArticleView").Produces(204);

        articles.MapPost("/{slug}/shares", async (string slug, ArticleHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.RecordShareAsync(slug, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("content-write").WithName("RecordArticleShare").Produces(204);

        articles.MapPost("/", async (ArticleInput request, ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CreateAsync(request, cancellationToken)).ToHttpResult(context,
                article => Results.Created($"/api/v1/me/articles/{article.Id}", article)))
            .RequireAuthorization("Authoring").RequireRateLimiting("content-write").WithName("CreateArticle").Produces<CreatedArticleDto>(201);

        articles.MapPut("/{id:guid}", async (Guid id, UpdateArticleRequest request, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UpdateAsync(id, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").RequireRateLimiting("content-write").WithName("UpdateArticle").Produces(204);

        articles.MapPost("/{id:guid}/publish", async (Guid id, VersionRequest request, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.PublishAsync(id, request.Version, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").RequireRateLimiting("content-write").WithName("PublishArticle").Produces(204);

        articles.MapPost("/{id:guid}/archive", async (Guid id, VersionRequest request, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ArchiveAsync(id, request.Version, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").RequireRateLimiting("content-write").WithName("ArchiveArticle").Produces(204);

        api.MapGet("/me/articles", async (int? page, int? pageSize, ArticleStatus? status, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.MineAsync(new PageRequest(page ?? 1, pageSize ?? 20), status, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Articles").WithName("ListMyArticles").Produces<PagedResult<ArticleSummaryDto>>();

        api.MapGet("/me/recommendations", async (int? page, int? pageSize, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RecommendationsAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Articles").WithName("ListRecommendedArticles")
            .Produces<PagedResult<ArticleSummaryDto>>();

        api.MapGet("/me/articles/{id:guid}", async (Guid id, ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.GetMineAsync(id, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Articles").WithName("GetMyArticle").Produces<ArticleDto>();

        api.MapPut("/me/articles/{id:guid}/autosave", async (Guid id, AutosaveArticleRequest request,
            ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.AutosaveAsync(id, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").WithTags("Articles").WithName("AutosaveMyArticleDraft").Produces<AutosavedArticleDto>();

        api.MapGet("/me/articles/{id:guid}/seo", async (Guid id, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.SeoAsync(id, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Articles").WithName("GetMyArticleSeo").Produces<ArticleSeoDto>();

        api.MapPut("/me/articles/{id:guid}/seo", async (Guid id, ArticleSeoRequest request, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UpdateSeoAsync(id, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").WithTags("Articles").WithName("UpdateMyArticleSeo").Produces<ArticleSeoDto>();

        api.MapGet("/admin/articles", async (int? page, int? pageSize, ArticleStatus? status, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListForModerationAsync(new PageRequest(page ?? 1, pageSize ?? 20), status, cancellationToken))
            .ToHttpResult(context))
            .RequireAuthorization("Moderation").WithTags("Admin", "Articles").WithName("ListAdminArticles")
            .Produces<PagedResult<ArticleSummaryDto>>();

        api.MapGet("/admin/articles/{id:guid}", async (Guid id, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.GetForModerationAsync(id, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Moderation").WithTags("Admin", "Articles").WithName("GetAdminArticle")
            .Produces<ArticleDto>();

        api.MapPut("/admin/articles/{id:guid}/featured", async (Guid id, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.SetFeaturedAsync(id, true, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Moderation").RequireRateLimiting("content-write").WithTags("Admin", "Articles").WithName("FeatureAdminArticle").Produces(204);

        api.MapDelete("/admin/articles/{id:guid}/featured", async (Guid id, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.SetFeaturedAsync(id, false, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Moderation").RequireRateLimiting("content-write").WithTags("Admin", "Articles").WithName("UnfeatureAdminArticle").Produces(204);

        api.MapGet("/me/articles/{id:guid}/revisions", async (Guid id, int? page, int? pageSize, ArticleHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RevisionsAsync(id, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Articles").WithName("ListMyArticleRevisions")
            .Produces<PagedResult<ArticleRevisionSummaryDto>>();

        api.MapGet("/me/articles/{id:guid}/revisions/{revisionId:guid}", async (Guid id, Guid revisionId,
            ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.GetRevisionAsync(id, revisionId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Articles").WithName("GetMyArticleRevision").Produces<ArticleRevisionDto>();

        api.MapGet("/me/articles/{id:guid}/revisions/{fromRevisionId:guid}/compare/{toRevisionId:guid}",
            async (Guid id, Guid fromRevisionId, Guid toRevisionId, ArticleHandler handler,
                HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CompareRevisionsAsync(id, fromRevisionId, toRevisionId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Articles").WithName("CompareMyArticleRevisions")
            .Produces<ArticleRevisionCompareDto>();

        api.MapPost("/me/articles/{id:guid}/revisions/{revisionId:guid}/restore", async (Guid id, Guid revisionId,
            RestoreArticleRevisionRequest request, ArticleHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RestoreRevisionAsync(id, revisionId, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Authoring").WithTags("Articles").WithName("RestoreMyArticleRevision").Produces(204);
    }
}
