using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;

namespace Nexa.Application.Features.Search;

public sealed class SearchHandler(ISearchQueries queries)
{
    public async Task<Result<SearchResultsDto>> AllAsync(string? query, int? page, int? pageSize, CancellationToken cancellationToken)
    {
        var request = CreateRequest(query, page, pageSize);
        if (!request.IsSuccess)
            return Result<SearchResultsDto>.Failure(request.Error!);
        var articles = await queries.ArticlesAsync(request.Value!, cancellationToken);
        var users = await queries.UsersAsync(request.Value!, cancellationToken);
        var tags = await queries.TagsAsync(request.Value!, cancellationToken);
        return Result<SearchResultsDto>.Success(new SearchResultsDto(articles, users, tags));
    }

    public async Task<Result<PagedResult<SearchArticleResultDto>>> ArticlesAsync(string? query, int? page, int? pageSize,
        CancellationToken cancellationToken)
    {
        var request = CreateRequest(query, page, pageSize);
        return request.IsSuccess
            ? Result<PagedResult<SearchArticleResultDto>>.Success(await queries.ArticlesAsync(request.Value!, cancellationToken))
            : Result<PagedResult<SearchArticleResultDto>>.Failure(request.Error!);
    }

    public async Task<Result<PagedResult<SearchUserResultDto>>> UsersAsync(string? query, int? page, int? pageSize,
        CancellationToken cancellationToken)
    {
        var request = CreateRequest(query, page, pageSize);
        return request.IsSuccess
            ? Result<PagedResult<SearchUserResultDto>>.Success(await queries.UsersAsync(request.Value!, cancellationToken))
            : Result<PagedResult<SearchUserResultDto>>.Failure(request.Error!);
    }

    public async Task<Result<PagedResult<SearchTagResultDto>>> TagsAsync(string? query, int? page, int? pageSize,
        CancellationToken cancellationToken)
    {
        var request = CreateRequest(query, page, pageSize);
        return request.IsSuccess
            ? Result<PagedResult<SearchTagResultDto>>.Success(await queries.TagsAsync(request.Value!, cancellationToken))
            : Result<PagedResult<SearchTagResultDto>>.Failure(request.Error!);
    }

    public async Task<Result<SearchSuggestionsDto>> SuggestionsAsync(string? query, CancellationToken cancellationToken)
    {
        var request = CreateRequest(query, 1, 5);
        if (!request.IsSuccess)
            return Result<SearchSuggestionsDto>.Failure(request.Error!);
        var articles = await queries.ArticlesAsync(request.Value!, cancellationToken);
        var users = await queries.UsersAsync(request.Value!, cancellationToken);
        var tags = await queries.TagsAsync(request.Value!, cancellationToken);
        var items = articles.Items.Select(article => new SearchSuggestionItemDto("article", article.Title, article.Slug,
                $"/articles/{article.Slug}"))
            .Concat(users.Items.Select(user => new SearchSuggestionItemDto("user", user.DisplayName, user.UserName,
                $"/users/{user.UserName}")))
            .Concat(tags.Items.Select(tag => new SearchSuggestionItemDto("tag", tag.Name, tag.Slug, $"/tags/{tag.Slug}")))
            .Take(10)
            .ToList();
        return Result<SearchSuggestionsDto>.Success(new SearchSuggestionsDto(items));
    }

    private static Result<SearchRequest> CreateRequest(string? query, int? page, int? pageSize)
    {
        var pageRequest = new PageRequest(page ?? 1, pageSize ?? 20);
        if (!pageRequest.IsValid)
            return Result<SearchRequest>.Failure(PageRequest.Invalid);
        var normalized = query?.Trim();
        return normalized is { Length: >= 2 and <= 100 }
            ? Result<SearchRequest>.Success(new SearchRequest(normalized, pageRequest))
            : Result<SearchRequest>.Failure(InvalidQuery);
    }

    private static readonly Error InvalidQuery = new(ErrorType.Validation, "invalid_search_query",
        "Search query must be between 2 and 100 characters.");
}
