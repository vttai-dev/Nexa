using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Application.Abstractions.Persistence;

public interface IArticleRepository
{
    Task<Article?> FindAsync(Guid id, CancellationToken cancellationToken);
    Task<Article?> FindPublishedAsync(string slug, CancellationToken cancellationToken);
    Task<ArticleNotificationTargetDto?> NotificationTargetAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> IsPublishedAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> IsSlugAvailableAsync(string slug, Guid? exceptArticleId, CancellationToken cancellationToken);
    Task<bool> TaxonomyExistsAsync(Guid? categoryId, IReadOnlyCollection<Guid> tagIds, CancellationToken cancellationToken);
    void Add(Article article);
    void AddRevision(ArticleRevision revision);
}
