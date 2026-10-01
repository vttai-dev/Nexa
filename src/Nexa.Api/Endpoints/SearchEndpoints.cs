using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Search;

namespace Nexa.Api.Endpoints;

public static class SearchEndpoints
{
    public static void MapSearchEndpoints(this RouteGroupBuilder api)
    {
        var search = api.MapGroup("/search").RequireRateLimiting("search").WithTags("Search");

        search.MapGet("/", async (string? query, int? page, int? pageSize, SearchHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.AllAsync(query, page, pageSize, cancellationToken)).ToHttpResult(context))
            .WithName("SearchAll").Produces<SearchResultsDto>();

        search.MapGet("/articles", async (string? query, int? page, int? pageSize, SearchHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ArticlesAsync(query, page, pageSize, cancellationToken)).ToHttpResult(context))
            .WithName("SearchArticles").Produces<PagedResult<SearchArticleResultDto>>();

        search.MapGet("/users", async (string? query, int? page, int? pageSize, SearchHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UsersAsync(query, page, pageSize, cancellationToken)).ToHttpResult(context))
            .WithName("SearchUsers").Produces<PagedResult<SearchUserResultDto>>();

        search.MapGet("/tags", async (string? query, int? page, int? pageSize, SearchHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.TagsAsync(query, page, pageSize, cancellationToken)).ToHttpResult(context))
            .WithName("SearchTags").Produces<PagedResult<SearchTagResultDto>>();

        search.MapGet("/suggestions", async (string? query, SearchHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.SuggestionsAsync(query, cancellationToken)).ToHttpResult(context))
            .WithName("SearchSuggestions").Produces<SearchSuggestionsDto>();
    }
}
