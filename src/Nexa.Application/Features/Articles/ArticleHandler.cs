using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Domain.Articles;
using Nexa.Domain.Notifications;
using Nexa.Domain.Auditing;

namespace Nexa.Application.Features.Articles;

public sealed class ArticleHandler(IArticleRepository repository, IArticleQueries queries,
    ICurrentUser currentUser, IUnitOfWork unitOfWork, TimeProvider clock,
    INotificationRepository? notifications = null, IArticleReviewRepository? reviewRequests = null,
    IAuditLogRepository? auditLogs = null)
{
    public async Task<Result<CreatedArticleDto>> CreateAsync(ArticleInput request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<CreatedArticleDto>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<CreatedArticleDto>.Failure(error);
        if (!await repository.TaxonomyExistsAsync(request.CategoryId, request.TagIds, cancellationToken))
            return Result<CreatedArticleDto>.Failure(Error.Missing("Category or tag"));
        var now = clock.GetUtcNow();
        var article = new Article(userId, request.Title, request.Slug, request.Summary, request.BodyMarkdown,
            request.CategoryId, request.TagIds, now);
        repository.Add(article);
        repository.AddRevision(new ArticleRevision(article, userId, ArticleRevisionAction.Created, now));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<CreatedArticleDto>.Success(new CreatedArticleDto(article.Id, article.Slug, article.Version));
    }

    public async Task<Result<Unit>> UpdateAsync(Guid id, UpdateArticleRequest request, CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } outerError)
            return Result<Unit>.Failure(outerError);
        if (RequestValidation.Validate(request.Article) is { } error)
            return Result<Unit>.Failure(error);
        var owned = await EditableAsync(id, request.Version, false, cancellationToken);
        if (!owned.IsSuccess)
            return Result<Unit>.Failure(owned.Error!);
        var input = request.Article;
        if (!await repository.TaxonomyExistsAsync(input.CategoryId, input.TagIds, cancellationToken))
            return Result<Unit>.Failure(Error.Missing("Category or tag"));
        var now = clock.GetUtcNow();
        owned.Value!.Update(input.Title, input.Slug, input.Summary, input.BodyMarkdown,
            input.CategoryId, input.TagIds, now);
        AddRevision(owned.Value, ArticleRevisionAction.Updated, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<AutosavedArticleDto>> AutosaveAsync(Guid id, AutosaveArticleRequest request,
        CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } outerError)
            return Result<AutosavedArticleDto>.Failure(outerError);
        if (RequestValidation.Validate(request.Article) is { } error)
            return Result<AutosavedArticleDto>.Failure(error);
        var owned = await EditableAsync(id, request.Version, false, cancellationToken);
        if (!owned.IsSuccess)
            return Result<AutosavedArticleDto>.Failure(owned.Error!);
        if (owned.Value!.Status != ArticleStatus.Draft)
            return Result<AutosavedArticleDto>.Failure(new Error(ErrorType.Conflict, "draft_only", "Only draft articles can be autosaved."));
        var input = request.Article;
        if (!await repository.TaxonomyExistsAsync(input.CategoryId, input.TagIds, cancellationToken))
            return Result<AutosavedArticleDto>.Failure(Error.Missing("Category or tag"));
        var savedAtUtc = clock.GetUtcNow();
        owned.Value.Update(input.Title, input.Slug, input.Summary, input.BodyMarkdown,
            input.CategoryId, input.TagIds, savedAtUtc);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<AutosavedArticleDto>.Success(new AutosavedArticleDto(owned.Value.Id, owned.Value.Version, savedAtUtc));
    }

    public async Task<Result<Unit>> PublishAsync(Guid id, Guid version, CancellationToken cancellationToken)
    {
        var owned = await EditableAsync(id, version, false, cancellationToken);
        if (!owned.IsSuccess)
            return Result<Unit>.Failure(owned.Error!);
        var now = clock.GetUtcNow();
        owned.Value!.Publish(now);
        AddRevision(owned.Value, ArticleRevisionAction.Published, now);
        if (notifications is not null && currentUser.Id is { } authorId)
        {
            var tagIds = owned.Value.Tags.Select(tag => tag.TagId).ToArray();
            var authorFollowers = await notifications.AuthorFollowerIdsAsync(authorId, cancellationToken);
            var tagFollowers = await notifications.TagFollowerIdsAsync(tagIds, cancellationToken);
            var tagFollowerSet = tagFollowers.ToHashSet();
            foreach (var recipientId in authorFollowers.Concat(tagFollowers).Where(id => id != authorId).Distinct())
            {
                var notificationType = tagFollowerSet.Contains(recipientId)
                    ? NotificationType.TagPublished
                    : NotificationType.ArticlePublished;
                var message = notificationType == NotificationType.TagPublished
                    ? $"A new article matching a topic you follow was published: '{owned.Value.Title}'."
                    : $"A new article from an author you follow was published: '{owned.Value.Title}'.";
                notifications.Add(new Notification(recipientId, notificationType, message, now, authorId, owned.Value.Id));
            }
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> ArchiveAsync(Guid id, Guid version, CancellationToken cancellationToken)
    {
        var owned = await EditableAsync(id, version, true, cancellationToken);
        if (!owned.IsSuccess)
            return Result<Unit>.Failure(owned.Error!);
        var now = clock.GetUtcNow();
        owned.Value!.Archive(now);
        AddRevision(owned.Value, ArticleRevisionAction.Archived, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> ListAsync(ArticleFilter filter, CancellationToken cancellationToken) =>
        !filter.Pagination.IsValid
            ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.ListPublishedAsync(filter, cancellationToken));

    public async Task<Result<IReadOnlyList<ArticleArchiveMonthDto>>> ArchiveMonthsAsync(CancellationToken cancellationToken) =>
        Result<IReadOnlyList<ArticleArchiveMonthDto>>.Success(await queries.ArchiveMonthsAsync(cancellationToken));

    public async Task<Result<PagedResult<ArticleSummaryDto>>> ListForModerationAsync(PageRequest page, ArticleStatus? status,
        CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Forbidden);
        return !page.IsValid
            ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.ListForModerationAsync(page, status, cancellationToken));
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> PopularAsync(PageRequest page, CancellationToken cancellationToken) =>
        !page.IsValid
            ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.PopularAsync(page, cancellationToken));

    public async Task<Result<PagedResult<ArticleSummaryDto>>> FeaturedAsync(PageRequest page, CancellationToken cancellationToken) =>
        !page.IsValid ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.FeaturedAsync(page, cancellationToken));

    public async Task<Result<PagedResult<ArticleSummaryDto>>> TrendingAsync(PageRequest page, int? days,
        CancellationToken cancellationToken)
    {
        var window = days ?? 7;
        if (!page.IsValid)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid);
        if (window is < 1 or > 90)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(new Error(ErrorType.Validation, "invalid_days", "Days must be between 1 and 90."));
        return Result<PagedResult<ArticleSummaryDto>>.Success(await queries.TrendingAsync(page, window, cancellationToken));
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> RecommendationsAsync(PageRequest page,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.RecommendationsAsync(userId, page, cancellationToken));
    }

    public async Task<Result<Unit>> SetFeaturedAsync(Guid id, bool featured, CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<Unit>.Failure(Error.Forbidden);
        if (currentUser.Id is not { } moderatorId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var article = await repository.FindAsync(id, cancellationToken);
        if (article is null)
            return Result<Unit>.Failure(Error.Missing("Article"));
        var now = clock.GetUtcNow();
        article.SetFeatured(featured, now);
        auditLogs?.Add(new AuditLog(moderatorId, featured ? "article.featured" : "article.unfeatured",
            "Article", id, article.Title, currentUser.IpAddress, now));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> ListByUserNameAsync(string userName, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return Result<PagedResult<ArticleSummaryDto>>.Failure(new Error(ErrorType.Validation, "invalid_request", "User name is required."));
        return !page.IsValid
            ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.ListPublishedByUserNameAsync(userName, page, cancellationToken));
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> ListByCategorySlugAsync(string slug, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid);
        var articles = await queries.ListPublishedByCategorySlugAsync(slug, page, cancellationToken);
        return articles is null ? Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Missing("Category"))
            : Result<PagedResult<ArticleSummaryDto>>.Success(articles);
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> ListByTagSlugAsync(string slug, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid);
        var articles = await queries.ListPublishedByTagSlugAsync(slug, page, cancellationToken);
        return articles is null ? Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Missing("Tag"))
            : Result<PagedResult<ArticleSummaryDto>>.Success(articles);
    }

    public async Task<Result<ArticleDto>> GetAsync(string slug, CancellationToken cancellationToken)
    {
        var article = await queries.GetPublishedAsync(slug, cancellationToken);
        return article is null ? Result<ArticleDto>.Failure(Error.Missing("Article")) : Result<ArticleDto>.Success(article);
    }

    public async Task<Result<ArticleDto>> GetForModerationAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<ArticleDto>.Failure(Error.Forbidden);
        var article = await queries.GetForModerationAsync(id, cancellationToken);
        return article is null ? Result<ArticleDto>.Failure(Error.Missing("Article")) : Result<ArticleDto>.Success(article);
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> RelatedAsync(string slug, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid);
        if (await queries.GetPublishedAsync(slug, cancellationToken) is null)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Missing("Article"));
        var related = await queries.RelatedAsync(slug, page, cancellationToken);
        return Result<PagedResult<ArticleSummaryDto>>.Success(related);
    }

    public async Task<Result<ArticleMetadataDto>> MetadataAsync(string slug, CancellationToken cancellationToken)
    {
        var metadata = await queries.MetadataAsync(slug, cancellationToken);
        return metadata is null ? Result<ArticleMetadataDto>.Failure(Error.Missing("Article")) : Result<ArticleMetadataDto>.Success(metadata);
    }

    public async Task<Result<ArticleSeoDto>> SeoAsync(Guid id, CancellationToken cancellationToken)
    {
        var owned = await OwnedReadableAsync(id, cancellationToken);
        return !owned.IsSuccess ? Result<ArticleSeoDto>.Failure(owned.Error!)
            : Result<ArticleSeoDto>.Success(new ArticleSeoDto(owned.Value!.Id, owned.Value.Version,
                owned.Value.MetaTitle, owned.Value.MetaDescription, owned.Value.Keywords, owned.Value.CanonicalUrl,
                owned.Value.UpdatedAtUtc));
    }

    public async Task<Result<ArticleSeoDto>> UpdateSeoAsync(Guid id, ArticleSeoRequest request,
        CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<ArticleSeoDto>.Failure(error);
        var owned = await EditableAsync(id, request.Version, false, cancellationToken);
        if (!owned.IsSuccess)
            return Result<ArticleSeoDto>.Failure(owned.Error!);
        owned.Value!.UpdateSeo(request.MetaTitle, request.MetaDescription, request.Keywords,
            request.CanonicalUrl, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ArticleSeoDto>.Success(new ArticleSeoDto(owned.Value.Id, owned.Value.Version,
            owned.Value.MetaTitle, owned.Value.MetaDescription, owned.Value.Keywords, owned.Value.CanonicalUrl,
            owned.Value.UpdatedAtUtc));
    }

    public async Task<Result<SlugAvailabilityDto>> SlugAvailabilityAsync(string slug, Guid? exceptArticleId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 180)
            return Result<SlugAvailabilityDto>.Failure(new Error(ErrorType.Validation, "invalid_request", "Slug is invalid."));
        var normalized = slug.Trim().ToLowerInvariant();
        var available = await repository.IsSlugAvailableAsync(normalized, exceptArticleId, cancellationToken);
        return Result<SlugAvailabilityDto>.Success(new SlugAvailabilityDto(normalized, available));
    }

    public async Task<Result<Unit>> RecordViewAsync(string slug, CancellationToken cancellationToken)
    {
        var article = await repository.FindPublishedAsync(slug, cancellationToken);
        if (article is null)
            return Result<Unit>.Failure(Error.Missing("Article"));
        article.RecordView();
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> RecordShareAsync(string slug, CancellationToken cancellationToken)
    {
        var article = await repository.FindPublishedAsync(slug, cancellationToken);
        if (article is null)
            return Result<Unit>.Failure(Error.Missing("Article"));
        article.RecordShare();
        if (notifications is not null && currentUser.Id is { } actorId && actorId != article.AuthorId)
            notifications.Add(new Notification(article.AuthorId, NotificationType.ArticleShared,
                $"Bài viết '{article.Title}' vừa được chia sẻ.", clock.GetUtcNow(), actorId, article.Id));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<PagedResult<ArticleSummaryDto>>> MineAsync(PageRequest page, ArticleStatus? status,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<ArticleSummaryDto>>.Failure(Error.Unauthorized);
        return !page.IsValid
            ? Result<PagedResult<ArticleSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSummaryDto>>.Success(await queries.ListOwnedAsync(userId, page, status, cancellationToken));
    }

    public async Task<Result<ArticleDto>> GetMineAsync(Guid id, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<ArticleDto>.Failure(Error.Unauthorized);
        var article = await queries.GetOwnedAsync(id, userId, cancellationToken);
        return article is null ? Result<ArticleDto>.Failure(Error.Missing("Article")) : Result<ArticleDto>.Success(article);
    }

    public async Task<Result<PagedResult<ArticleRevisionSummaryDto>>> RevisionsAsync(Guid id, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<ArticleRevisionSummaryDto>>.Failure(PageRequest.Invalid);
        var owned = await OwnedReadableAsync(id, cancellationToken);
        if (!owned.IsSuccess)
            return Result<PagedResult<ArticleRevisionSummaryDto>>.Failure(owned.Error!);
        return Result<PagedResult<ArticleRevisionSummaryDto>>.Success(
            await queries.ListRevisionsAsync(id, page, cancellationToken));
    }

    public async Task<Result<ArticleRevisionDto>> GetRevisionAsync(Guid id, Guid revisionId, CancellationToken cancellationToken)
    {
        var owned = await OwnedReadableAsync(id, cancellationToken);
        if (!owned.IsSuccess)
            return Result<ArticleRevisionDto>.Failure(owned.Error!);
        var revision = await queries.GetRevisionAsync(id, revisionId, cancellationToken);
        return revision is null ? Result<ArticleRevisionDto>.Failure(Error.Missing("Article revision"))
            : Result<ArticleRevisionDto>.Success(revision);
    }

    public async Task<Result<ArticleRevisionCompareDto>> CompareRevisionsAsync(Guid id, Guid fromRevisionId, Guid toRevisionId,
        CancellationToken cancellationToken)
    {
        var owned = await OwnedReadableAsync(id, cancellationToken);
        if (!owned.IsSuccess)
            return Result<ArticleRevisionCompareDto>.Failure(owned.Error!);
        var from = await queries.GetRevisionAsync(id, fromRevisionId, cancellationToken);
        var to = await queries.GetRevisionAsync(id, toRevisionId, cancellationToken);
        if (from is null || to is null)
            return Result<ArticleRevisionCompareDto>.Failure(Error.Missing("Article revision"));
        return Result<ArticleRevisionCompareDto>.Success(new ArticleRevisionCompareDto(from, to,
            from.Title != to.Title,
            from.Slug != to.Slug,
            from.Summary != to.Summary,
            from.BodyMarkdown != to.BodyMarkdown,
            from.CategoryId != to.CategoryId,
            !from.TagIds.OrderBy(tag => tag).SequenceEqual(to.TagIds.OrderBy(tag => tag))));
    }

    public async Task<Result<Unit>> RestoreRevisionAsync(Guid id, Guid revisionId, RestoreArticleRevisionRequest request,
        CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        var owned = await EditableAsync(id, request.Version, false, cancellationToken);
        if (!owned.IsSuccess)
            return Result<Unit>.Failure(owned.Error!);
        var revision = await queries.GetRevisionAsync(id, revisionId, cancellationToken);
        if (revision is null)
            return Result<Unit>.Failure(Error.Missing("Article revision"));
        if (!await repository.TaxonomyExistsAsync(revision.CategoryId, revision.TagIds, cancellationToken))
            return Result<Unit>.Failure(Error.Missing("Category or tag"));
        var now = clock.GetUtcNow();
        owned.Value!.Update(revision.Title, revision.Slug, revision.Summary, revision.BodyMarkdown,
            revision.CategoryId, revision.TagIds, now);
        AddRevision(owned.Value, ArticleRevisionAction.Restored, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    private async Task<Result<Article>> EditableAsync(Guid id, Guid version, bool allowModeration, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Article>.Failure(Error.Unauthorized);
        var article = await repository.FindAsync(id, cancellationToken);
        if (article is null)
            return Result<Article>.Failure(Error.Missing("Article"));
        if (article.AuthorId != userId && !(allowModeration && currentUser.CanModerate))
            return Result<Article>.Failure(article.Status == ArticleStatus.Published ? Error.Forbidden : Error.Missing("Article"));
        if (reviewRequests is not null && await reviewRequests.HasPendingAsync(id, cancellationToken))
            return Result<Article>.Failure(new Error(ErrorType.Conflict, "review_pending", "This article cannot be edited while its review is pending."));
        return article.Version != version
            ? Result<Article>.Failure(Error.StaleVersion)
            : Result<Article>.Success(article);
    }

    private async Task<Result<Article>> OwnedReadableAsync(Guid id, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Article>.Failure(Error.Unauthorized);
        var article = await repository.FindAsync(id, cancellationToken);
        return article is null || article.AuthorId != userId
            ? Result<Article>.Failure(Error.Missing("Article"))
            : Result<Article>.Success(article);
    }

    private void AddRevision(Article article, ArticleRevisionAction action, DateTimeOffset now)
    {
        if (currentUser.Id is { } editorId)
            repository.AddRevision(new ArticleRevision(article, editorId, action, now));
    }
}
