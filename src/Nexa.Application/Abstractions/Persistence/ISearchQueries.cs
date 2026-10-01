using Nexa.Application.Common;
using Nexa.Application.Features.Search;

namespace Nexa.Application.Abstractions.Persistence;

public interface ISearchQueries
{
    Task<PagedResult<SearchArticleResultDto>> ArticlesAsync(SearchRequest request, CancellationToken cancellationToken);
    Task<PagedResult<SearchUserResultDto>> UsersAsync(SearchRequest request, CancellationToken cancellationToken);
    Task<PagedResult<SearchTagResultDto>> TagsAsync(SearchRequest request, CancellationToken cancellationToken);
}
