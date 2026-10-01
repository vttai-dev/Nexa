using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class ArticleRepository(NexaDbContext database) : IArticleRepository
{
    public Task<Article?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        database.Articles.Include(article => article.Tags).SingleOrDefaultAsync(article => article.Id == id, cancellationToken);

    public Task<Article?> FindPublishedAsync(string slug, CancellationToken cancellationToken) =>
        database.Articles.SingleOrDefaultAsync(article => article.Slug == slug && article.Status == ArticleStatus.Published, cancellationToken);

    public Task<ArticleNotificationTargetDto?> NotificationTargetAsync(Guid id, CancellationToken cancellationToken) =>
        database.Articles.AsNoTracking()
            .Where(article => article.Id == id && article.Status == ArticleStatus.Published)
            .Select(article => new ArticleNotificationTargetDto(article.Id, article.AuthorId, article.Title, article.Slug))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<bool> IsPublishedAsync(Guid id, CancellationToken cancellationToken) =>
        database.Articles.AnyAsync(article => article.Id == id && article.Status == ArticleStatus.Published, cancellationToken);

    public async Task<bool> IsSlugAvailableAsync(string slug, Guid? exceptArticleId, CancellationToken cancellationToken) =>
        !await database.Articles.AnyAsync(article => article.Slug == slug && (!exceptArticleId.HasValue || article.Id != exceptArticleId.Value),
            cancellationToken);

    public async Task<bool> TaxonomyExistsAsync(Guid? categoryId, IReadOnlyCollection<Guid> tagIds, CancellationToken cancellationToken)
    {
        if (categoryId.HasValue && !await database.Categories.AnyAsync(category => category.Id == categoryId.Value, cancellationToken))
            return false;
        var unique = tagIds.Distinct().ToArray();
        return await database.Tags.CountAsync(tag => unique.Contains(tag.Id), cancellationToken) == unique.Length;
    }

    public void Add(Article article) => database.Articles.Add(article);

    public void AddRevision(ArticleRevision revision) => database.ArticleRevisions.Add(revision);
}
