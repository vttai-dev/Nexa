using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Domain.Articles;
using Nexa.Domain.Notifications;

namespace Nexa.Application.Features.Articles;

public sealed class ArticleReviewHandler(IArticleReviewRepository reviews, IArticleRepository articles,
    ICurrentUser currentUser, IUnitOfWork unitOfWork, TimeProvider clock, INotificationRepository notifications)
{
    public async Task<Result<ArticleReviewDto>> SubmitAsync(Guid articleId, SubmitArticleReviewRequest request,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } authorId)
            return Result<ArticleReviewDto>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<ArticleReviewDto>.Failure(error);
        var article = await articles.FindAsync(articleId, cancellationToken);
        if (article is null || article.AuthorId != authorId)
            return Result<ArticleReviewDto>.Failure(Error.Missing("Article"));
        if (article.Status != ArticleStatus.Draft)
            return Result<ArticleReviewDto>.Failure(new Error(ErrorType.Conflict, "draft_only", "Only draft articles can be submitted for review."));
        if (article.Version != request.Version)
            return Result<ArticleReviewDto>.Failure(Error.StaleVersion);
        if (string.IsNullOrWhiteSpace(article.BodyMarkdown))
            return Result<ArticleReviewDto>.Failure(new Error(ErrorType.Validation, "content_required", "Add article content before submitting it for review."));
        if (await reviews.HasPendingAsync(articleId, cancellationToken))
            return Result<ArticleReviewDto>.Failure(new Error(ErrorType.Conflict, "review_pending", "This article already has a pending review."));

        var now = clock.GetUtcNow();
        var review = new ArticleReview(article.Id, authorId, article.Version, request.Note, now);
        reviews.Add(review);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ArticleReviewDto>.Success(ToDto(review));
    }

    public async Task<Result<PagedResult<ArticleReviewDto>>> HistoryAsync(Guid articleId, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } authorId)
            return Result<PagedResult<ArticleReviewDto>>.Failure(Error.Unauthorized);
        if (!page.IsValid)
            return Result<PagedResult<ArticleReviewDto>>.Failure(PageRequest.Invalid);
        var article = await articles.FindAsync(articleId, cancellationToken);
        if (article is null || article.AuthorId != authorId)
            return Result<PagedResult<ArticleReviewDto>>.Failure(Error.Missing("Article"));
        return Result<PagedResult<ArticleReviewDto>>.Success(
            await reviews.ListByArticleAsync(articleId, authorId, page, cancellationToken));
    }

    public async Task<Result<Unit>> WithdrawAsync(Guid reviewId, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } authorId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var review = await reviews.FindPendingAsync(reviewId, cancellationToken);
        if (review is null)
            return Result<Unit>.Failure(Error.Missing("Pending article review"));
        if (review.AuthorId != authorId)
            return Result<Unit>.Failure(Error.Forbidden);
        review.Withdraw(authorId, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<PagedResult<ArticleReviewQueueItemDto>>> QueueAsync(ArticleReviewStatus? status,
        PageRequest page, CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<PagedResult<ArticleReviewQueueItemDto>>.Failure(Error.Forbidden);
        if (status.HasValue && !Enum.IsDefined(status.Value))
            return Result<PagedResult<ArticleReviewQueueItemDto>>.Failure(new Error(ErrorType.Validation, "invalid_status", "Review status is invalid."));
        if (!page.IsValid)
            return Result<PagedResult<ArticleReviewQueueItemDto>>.Failure(PageRequest.Invalid);
        return Result<PagedResult<ArticleReviewQueueItemDto>>.Success(
            await reviews.ListQueueAsync(status ?? ArticleReviewStatus.Pending, page, cancellationToken));
    }

    public async Task<Result<ArticleReviewQueueItemDto>> GetQueueItemAsync(Guid reviewId,
        CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<ArticleReviewQueueItemDto>.Failure(Error.Forbidden);
        var item = await reviews.GetQueueItemAsync(reviewId, cancellationToken);
        return item is null ? Result<ArticleReviewQueueItemDto>.Failure(Error.Missing("Article review"))
            : Result<ArticleReviewQueueItemDto>.Success(item);
    }

    public async Task<Result<Unit>> DecideAsync(Guid reviewId, DecideArticleReviewRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<Unit>.Failure(Error.Forbidden);
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        if (request.Status is not (ArticleReviewStatus.Approved or ArticleReviewStatus.Rejected))
            return Result<Unit>.Failure(new Error(ErrorType.Validation, "invalid_decision", "Decision must be Approved or Rejected."));
        if (currentUser.Id is not { } reviewerId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var review = await reviews.FindPendingAsync(reviewId, cancellationToken);
        if (review is null)
            return Result<Unit>.Failure(Error.Missing("Pending article review"));
        var article = await articles.FindAsync(review.ArticleId, cancellationToken);
        if (article is null)
            return Result<Unit>.Failure(Error.Missing("Article"));
        if (article.Status != ArticleStatus.Draft || article.Version != review.ArticleVersion)
            return Result<Unit>.Failure(Error.StaleVersion);

        var now = clock.GetUtcNow();
        if (request.Status == ArticleReviewStatus.Approved)
        {
            article.Publish(now);
            articles.AddRevision(new ArticleRevision(article, reviewerId, ArticleRevisionAction.Published, now));
            await AddPublicationNotificationsAsync(article, now, cancellationToken);
        }
        review.Decide(reviewerId, request.Status, request.Note, now);
        var notificationType = request.Status == ArticleReviewStatus.Approved
            ? NotificationType.ArticleReviewApproved
            : NotificationType.ArticleReviewRejected;
        var message = request.Status == ArticleReviewStatus.Approved
            ? $"Bài viết '{article.Title}' đã được duyệt và xuất bản."
            : $"Bài viết '{article.Title}' cần chỉnh sửa trước khi được xuất bản.";
        notifications.Add(new Notification(review.AuthorId, notificationType, message, now, reviewerId, article.Id));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    private async Task AddPublicationNotificationsAsync(Article article, DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var tagIds = article.Tags.Select(tag => tag.TagId).ToArray();
        var authorFollowers = await notifications.AuthorFollowerIdsAsync(article.AuthorId, cancellationToken);
        var tagFollowers = await notifications.TagFollowerIdsAsync(tagIds, cancellationToken);
        var tagFollowerSet = tagFollowers.ToHashSet();
        foreach (var recipientId in authorFollowers.Concat(tagFollowers).Where(id => id != article.AuthorId).Distinct())
        {
            var type = tagFollowerSet.Contains(recipientId) ? NotificationType.TagPublished : NotificationType.ArticlePublished;
            var message = type == NotificationType.TagPublished
                ? $"A new article matching a topic you follow was published: '{article.Title}'."
                : $"A new article from an author you follow was published: '{article.Title}'.";
            notifications.Add(new Notification(recipientId, type, message, now, article.AuthorId, article.Id));
        }
    }

    private static ArticleReviewDto ToDto(ArticleReview review) => new(review.Id, review.ArticleId,
        review.ArticleVersion, review.Status, review.SubmissionNote, review.ReviewNote, review.ReviewerId,
        review.SubmittedAtUtc, review.ReviewedAtUtc);
}
