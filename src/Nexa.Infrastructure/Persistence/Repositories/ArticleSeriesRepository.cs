using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class ArticleSeriesRepository(NexaDbContext database) : IArticleSeriesRepository
{
    public void Add(ArticleSeries series) => database.ArticleSeries.Add(series);
    public void Remove(ArticleSeries series) => database.ArticleSeries.Remove(series);

    public Task<ArticleSeries?> FindOwnedAsync(Guid id, Guid ownerId, CancellationToken cancellationToken) =>
        database.ArticleSeries.Include(series => series.Articles)
            .SingleOrDefaultAsync(series => series.Id == id && series.OwnerId == ownerId, cancellationToken);

    public Task<bool> IsSlugAvailableAsync(string slug, Guid? exceptSeriesId, CancellationToken cancellationToken) =>
        database.ArticleSeries.AllAsync(series => series.Slug != slug || (exceptSeriesId.HasValue && series.Id == exceptSeriesId.Value),
            cancellationToken);

    public async Task<PagedResult<ArticleSeriesSummaryDto>> ListOwnedAsync(Guid ownerId, PageRequest page,
        CancellationToken cancellationToken)
    {
        var query = database.ArticleSeries.AsNoTracking().Where(series => series.OwnerId == ownerId);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(series => series.UpdatedAtUtc).ThenByDescending(series => series.Id)
            .Skip(page.Offset).Take(page.PageSize)
            .Select(series => new ArticleSeriesSummaryDto(series.Id, series.OwnerId, series.Title, series.Slug,
                series.Description, series.Articles.Count, series.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
        return new PagedResult<ArticleSeriesSummaryDto>(items, page.Page, page.PageSize, total);
    }

    public Task<ArticleSeriesDto?> GetPublicBySlugAsync(string slug, CancellationToken cancellationToken) =>
        database.ArticleSeries.AsNoTracking().Where(series => series.Slug == slug)
            .Select(series => new ArticleSeriesDto(series.Id, series.OwnerId,
                database.Profiles.Where(profile => profile.UserId == series.OwnerId).Select(profile => profile.DisplayName).First(),
                series.Title, series.Slug, series.Description, series.CreatedAtUtc, series.UpdatedAtUtc,
                series.Articles.OrderBy(item => item.Position)
                    .Where(item => database.Articles.Any(article => article.Id == item.ArticleId && article.Status == ArticleStatus.Published))
                    .Select(item => new ArticleSeriesArticleDto(item.ArticleId,
                        database.Articles.Where(article => article.Id == item.ArticleId).Select(article => article.Title).First(),
                        database.Articles.Where(article => article.Id == item.ArticleId).Select(article => article.Slug).First(),
                        database.Articles.Where(article => article.Id == item.ArticleId).Select(article => article.Summary).First(),
                        database.Articles.Where(article => article.Id == item.ArticleId).Select(article => article.PublishedAtUtc).First(),
                        item.Position)).ToList()))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<PagedResult<ArticleSeriesSummaryDto>?> ListPublicByUserNameAsync(string userName,
        PageRequest page, CancellationToken cancellationToken)
    {
        var normalizedUserName = userName.Trim().ToUpperInvariant();
        var userId = await database.Users.AsNoTracking()
            .Where(user => user.NormalizedUserName == normalizedUserName)
            .Select(user => (Guid?)user.Id).SingleOrDefaultAsync(cancellationToken);
        if (userId is null)
            return null;
        var query = database.ArticleSeries.AsNoTracking().Where(series => series.OwnerId == userId.Value
            && series.Articles.Any(item => database.Articles.Any(article => article.Id == item.ArticleId
                && article.Status == ArticleStatus.Published)));
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(series => series.UpdatedAtUtc).ThenByDescending(series => series.Id)
            .Skip(page.Offset).Take(page.PageSize)
            .Select(series => new ArticleSeriesSummaryDto(series.Id, series.OwnerId, series.Title, series.Slug,
                series.Description, series.Articles.Count(item => database.Articles.Any(article => article.Id == item.ArticleId
                    && article.Status == ArticleStatus.Published)), series.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
        return new PagedResult<ArticleSeriesSummaryDto>(items, page.Page, page.PageSize, total);
    }
}
