using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class ArticleReviewRepository(NexaDbContext database) : IArticleReviewRepository
{
    public void Add(ArticleReview review) => database.ArticleReviews.Add(review);

    public Task<bool> HasPendingAsync(Guid articleId, CancellationToken cancellationToken) =>
        database.ArticleReviews.AnyAsync(review => review.ArticleId == articleId
            && review.Status == ArticleReviewStatus.Pending, cancellationToken);

    public Task<ArticleReview?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        database.ArticleReviews.SingleOrDefaultAsync(review => review.Id == id, cancellationToken);

    public Task<ArticleReview?> FindPendingAsync(Guid id, CancellationToken cancellationToken) =>
        database.ArticleReviews.SingleOrDefaultAsync(review => review.Id == id
            && review.Status == ArticleReviewStatus.Pending, cancellationToken);

    public async Task<PagedResult<ArticleReviewDto>> ListByArticleAsync(Guid articleId, Guid authorId,
        PageRequest page, CancellationToken cancellationToken)
    {
        var query = database.ArticleReviews.AsNoTracking()
            .Where(review => review.ArticleId == articleId && review.AuthorId == authorId)
            .OrderByDescending(review => review.SubmittedAtUtc).ThenByDescending(review => review.Id);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(page.Offset).Take(page.PageSize)
            .Select(review => new ArticleReviewDto(review.Id, review.ArticleId, review.ArticleVersion, review.Status,
                review.SubmissionNote, review.ReviewNote, review.ReviewerId, review.SubmittedAtUtc, review.ReviewedAtUtc))
            .ToListAsync(cancellationToken);
        return new PagedResult<ArticleReviewDto>(items, page.Page, page.PageSize, total);
    }

    public async Task<PagedResult<ArticleReviewQueueItemDto>> ListQueueAsync(ArticleReviewStatus? status,
        PageRequest page, CancellationToken cancellationToken)
    {
        var query = QueueQuery(status);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(page.Offset).Take(page.PageSize).ToListAsync(cancellationToken);
        return new PagedResult<ArticleReviewQueueItemDto>(items, page.Page, page.PageSize, total);
    }

    public Task<ArticleReviewQueueItemDto?> GetQueueItemAsync(Guid id, CancellationToken cancellationToken) =>
        QueueQuery().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    private IQueryable<ArticleReviewQueueItemDto> QueueQuery(ArticleReviewStatus? status = null) =>
        from review in database.ArticleReviews.AsNoTracking()
        where !status.HasValue || review.Status == status.Value
        join article in database.Articles.AsNoTracking() on review.ArticleId equals article.Id
        join user in database.Users.AsNoTracking() on review.AuthorId equals user.Id
        join profile in database.Profiles.AsNoTracking() on review.AuthorId equals profile.UserId into profiles
        from profile in profiles.DefaultIfEmpty()
        orderby review.SubmittedAtUtc, review.Id
        select new ArticleReviewQueueItemDto(review.Id, article.Id, article.Title, article.Slug,
            review.AuthorId, profile == null ? user.UserName! : profile.DisplayName,
            user.UserName!, review.ArticleVersion, review.Status, review.SubmissionNote, review.SubmittedAtUtc);
}
