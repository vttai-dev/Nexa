using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Application.Abstractions.Persistence;

public interface IArticleSeriesRepository
{
    void Add(ArticleSeries series);
    void Remove(ArticleSeries series);
    Task<ArticleSeries?> FindOwnedAsync(Guid id, Guid ownerId, CancellationToken cancellationToken);
    Task<ArticleSeriesDto?> GetPublicBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSeriesSummaryDto>?> ListPublicByUserNameAsync(string userName, PageRequest page,
        CancellationToken cancellationToken);
    Task<PagedResult<ArticleSeriesSummaryDto>> ListOwnedAsync(Guid ownerId, PageRequest page, CancellationToken cancellationToken);
    Task<bool> IsSlugAvailableAsync(string slug, Guid? exceptSeriesId, CancellationToken cancellationToken);
}
