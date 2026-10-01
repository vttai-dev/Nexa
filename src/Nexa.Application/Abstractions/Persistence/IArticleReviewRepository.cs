using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Application.Abstractions.Persistence;

public interface IArticleReviewRepository
{
    void Add(ArticleReview review);
    Task<bool> HasPendingAsync(Guid articleId, CancellationToken cancellationToken);
    Task<ArticleReview?> FindAsync(Guid id, CancellationToken cancellationToken);
    Task<ArticleReview?> FindPendingAsync(Guid id, CancellationToken cancellationToken);
    Task<PagedResult<ArticleReviewDto>> ListByArticleAsync(Guid articleId, Guid authorId, PageRequest page,
        CancellationToken cancellationToken);
    Task<PagedResult<ArticleReviewQueueItemDto>> ListQueueAsync(ArticleReviewStatus? status, PageRequest page,
        CancellationToken cancellationToken);
    Task<ArticleReviewQueueItemDto?> GetQueueItemAsync(Guid id, CancellationToken cancellationToken);
}
