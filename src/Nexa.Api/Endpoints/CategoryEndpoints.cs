using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Taxonomy;

namespace Nexa.Api.Endpoints;

public static class CategoryEndpoints
{
    public static void MapCategoryEndpoints(this RouteGroupBuilder api)
    {
        var routes = api.MapGroup("/categories").WithTags("Categories");
        routes.MapGet("/", async (int? page, int? pageSize, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CategoriesAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListCategories").Produces<PagedResult<CategoryDto>>();

        routes.MapGet("/popular", async (int? page, int? pageSize, TaxonomyHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.PopularCategoriesAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListPopularCategories").Produces<PagedResult<CategoryStatsDto>>();

        routes.MapGet("/{id:guid}/stats", async (Guid id, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CategoryStatsAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("GetCategoryStats").Produces<CategoryStatsDto>();

        routes.MapGet("/by-slug/{slug}", async (string slug, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CategoryStatsBySlugAsync(slug, cancellationToken)).ToHttpResult(context))
            .WithName("GetCategoryBySlug").Produces<CategoryStatsDto>();

        routes.MapGet("/slug-availability/{slug}", async (string slug, Guid? exceptId, TaxonomyHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CategorySlugAvailabilityAsync(slug, exceptId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin").WithName("CheckCategorySlugAvailability").Produces<TaxonomySlugAvailabilityDto>();

        routes.MapPost("/", async (CategoryInput request, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CreateCategoryAsync(request, cancellationToken)).ToHttpResult(context, created => Results.Json(created, statusCode: 201)))
            .RequireAuthorization("Authoring").WithName("CreateCategory").Produces<CreatedIdDto>(201);

        routes.MapPut("/{id:guid}", async (Guid id, CategoryInput request, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UpdateCategoryAsync(id, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin").WithName("UpdateCategory").Produces(204);

        routes.MapDelete("/{id:guid}", async (Guid id, TaxonomyHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.DeleteCategoryAsync(id, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin").WithName("DeleteCategory").Produces(204);
    }
}
