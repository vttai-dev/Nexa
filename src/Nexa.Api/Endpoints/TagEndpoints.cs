using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Taxonomy;

namespace Nexa.Api.Endpoints;

public static class TagEndpoints
{
    public static void MapTagEndpoints(this RouteGroupBuilder api)
    {
        var routes = api.MapGroup("/tags").WithTags("Tags");
        routes.MapGet("/", async (int? page, int? pageSize, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TagsAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListTags").Produces<PagedResult<TagDto>>();

        routes.MapGet("/popular", async (int? page, int? pageSize, TaxonomyHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.PopularTagsAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListPopularTags").Produces<PagedResult<TagStatsDto>>();

        routes.MapGet("/trending", async (int? days, int? page, int? pageSize, TaxonomyHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TrendingTagsAsync(days, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken))
                .ToHttpResult(context))
            .WithName("ListTrendingTags").Produces<PagedResult<TagTrendDto>>();

        routes.MapGet("/{id:guid}/stats", async (Guid id, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TagStatsAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("GetTagStats").Produces<TagStatsDto>();

        routes.MapGet("/by-slug/{slug}", async (string slug, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TagStatsBySlugAsync(slug, cancellationToken)).ToHttpResult(context))
            .WithName("GetTagBySlug").Produces<TagStatsDto>();

        routes.MapGet("/slug-availability/{slug}", async (string slug, Guid? exceptId, TaxonomyHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TagSlugAvailabilityAsync(slug, exceptId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin").WithName("CheckTagSlugAvailability").Produces<TaxonomySlugAvailabilityDto>();

        routes.MapPost("/", async (TagInput request, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CreateTagAsync(request, cancellationToken)).ToHttpResult(context, created => Results.Json(created, statusCode: 201)))
            .RequireAuthorization("Authoring").WithName("CreateTag").Produces<CreatedIdDto>(201);

        routes.MapPut("/{id:guid}", async (Guid id, TagInput request, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UpdateTagAsync(id, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin").WithName("UpdateTag").Produces(204);

        routes.MapDelete("/{id:guid}", async (Guid id, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.DeleteTagAsync(id, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin").WithName("DeleteTag").Produces(204);
    }
}
