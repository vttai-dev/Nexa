using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Application.Abstractions.Persistence;

public interface IArticleQueries
{
    Task<PagedResult<ArticleSummaryDto>> ListPublishedAsync(ArticleFilter filter, CancellationToken cancellationToken);
    Task<IReadOnlyList<ArticleArchiveMonthDto>> ArchiveMonthsAsync(CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> ListForModerationAsync(PageRequest page, ArticleStatus? status, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> PopularAsync(PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> FeaturedAsync(PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> TrendingAsync(PageRequest page, int days, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> RecommendationsAsync(Guid userId, PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> ListPublishedByUserNameAsync(string userName, PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>?> ListPublishedByCategorySlugAsync(string slug, PageRequest page,
        CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>?> ListPublishedByTagSlugAsync(string slug, PageRequest page, CancellationToken cancellationToken);
    Task<ArticleDto?> GetPublishedAsync(string slug, CancellationToken cancellationToken);
    Task<ArticleDto?> GetForModerationAsync(Guid id, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> RelatedAsync(string slug, PageRequest page, CancellationToken cancellationToken);
    Task<ArticleMetadataDto?> MetadataAsync(string slug, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> ListOwnedAsync(Guid userId, PageRequest page, ArticleStatus? status,
        CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> FeedAsync(Guid userId, PageRequest page, CancellationToken cancellationToken);
    Task<ArticleDto?> GetOwnedAsync(Guid id, Guid userId, CancellationToken cancellationToken);
    Task<PagedResult<ArticleRevisionSummaryDto>> ListRevisionsAsync(Guid articleId, PageRequest page, CancellationToken cancellationToken);
    Task<ArticleRevisionDto?> GetRevisionAsync(Guid articleId, Guid revisionId, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> BookmarksAsync(Guid userId, PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<ArticleSummaryDto>> LikesAsync(Guid userId, PageRequest page, CancellationToken cancellationToken);
}
