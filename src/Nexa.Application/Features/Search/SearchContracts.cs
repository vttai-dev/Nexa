using Nexa.Application.Common;

namespace Nexa.Application.Features.Search;

public sealed record SearchRequest(string Query, PageRequest Page);

public sealed record SearchResultsDto(
    PagedResult<SearchArticleResultDto> Articles,
    PagedResult<SearchUserResultDto> Users,
    PagedResult<SearchTagResultDto> Tags);

public sealed record SearchArticleResultDto(
    Guid Id,
    string Title,
    string Slug,
    string Summary,
    Guid AuthorId,
    string AuthorName,
    DateTimeOffset? PublishedAtUtc);

public sealed record SearchUserResultDto(
    Guid UserId,
    string UserName,
    string DisplayName,
    string Bio,
    string? AvatarUrl);

public sealed record SearchTagResultDto(Guid Id, string Name, string Slug, int ArticleCount);
public sealed record SearchSuggestionItemDto(string Type, string Label, string Value, string Url);
public sealed record SearchSuggestionsDto(IReadOnlyList<SearchSuggestionItemDto> Items);
