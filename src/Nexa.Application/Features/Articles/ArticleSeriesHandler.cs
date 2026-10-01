using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Domain.Articles;

namespace Nexa.Application.Features.Articles;

public sealed class ArticleSeriesHandler(IArticleSeriesRepository seriesRepository, IArticleRepository articles,
    ICurrentUser currentUser, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<Result<ArticleSeriesSummaryDto>> CreateAsync(ArticleSeriesInput request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<ArticleSeriesSummaryDto>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<ArticleSeriesSummaryDto>.Failure(error);
        var slug = request.Slug.Trim().ToLowerInvariant();
        if (!await seriesRepository.IsSlugAvailableAsync(slug, null, cancellationToken))
            return Result<ArticleSeriesSummaryDto>.Failure(new Error(ErrorType.Conflict, "slug_unavailable", "The series slug is already in use."));
        var now = clock.GetUtcNow();
        var series = new ArticleSeries(ownerId, request.Title, slug, request.Description, now);
        seriesRepository.Add(series);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ArticleSeriesSummaryDto>.Success(ToSummary(series));
    }

    public async Task<Result<PagedResult<ArticleSeriesSummaryDto>>> MineAsync(PageRequest page, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<PagedResult<ArticleSeriesSummaryDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<ArticleSeriesSummaryDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ArticleSeriesSummaryDto>>.Success(await seriesRepository.ListOwnedAsync(ownerId, page, cancellationToken));
    }

    public async Task<Result<ArticleSeriesDto>> PublicAsync(string slug, CancellationToken cancellationToken)
    {
        var series = await seriesRepository.GetPublicBySlugAsync(slug, cancellationToken);
        return series is null ? Result<ArticleSeriesDto>.Failure(Error.Missing("Article series"))
            : Result<ArticleSeriesDto>.Success(series);
    }

    public async Task<Result<PagedResult<ArticleSeriesSummaryDto>>> ByUserNameAsync(string userName, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return Result<PagedResult<ArticleSeriesSummaryDto>>.Failure(new Error(ErrorType.Validation,
                "invalid_request", "User name is required."));
        if (!page.IsValid)
            return Result<PagedResult<ArticleSeriesSummaryDto>>.Failure(PageRequest.Invalid);
        var series = await seriesRepository.ListPublicByUserNameAsync(userName, page, cancellationToken);
        return series is null ? Result<PagedResult<ArticleSeriesSummaryDto>>.Failure(Error.Missing("User"))
            : Result<PagedResult<ArticleSeriesSummaryDto>>.Success(series);
    }

    public async Task<Result<Unit>> UpdateAsync(Guid id, ArticleSeriesInput request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<Unit>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        var series = await seriesRepository.FindOwnedAsync(id, ownerId, cancellationToken);
        if (series is null)
            return Result<Unit>.Failure(Error.Missing("Article series"));
        var slug = request.Slug.Trim().ToLowerInvariant();
        if (!await seriesRepository.IsSlugAvailableAsync(slug, id, cancellationToken))
            return Result<Unit>.Failure(new Error(ErrorType.Conflict, "slug_unavailable", "The series slug is already in use."));
        series.Update(request.Title, slug, request.Description, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var series = await seriesRepository.FindOwnedAsync(id, ownerId, cancellationToken);
        if (series is null)
            return Result<Unit>.Failure(Error.Missing("Article series"));
        seriesRepository.Remove(series);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> AddArticleAsync(Guid id, Guid articleId, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var series = await seriesRepository.FindOwnedAsync(id, ownerId, cancellationToken);
        if (series is null)
            return Result<Unit>.Failure(Error.Missing("Article series"));
        var article = await articles.FindAsync(articleId, cancellationToken);
        if (article is null || article.AuthorId != ownerId || article.Status != ArticleStatus.Published)
            return Result<Unit>.Failure(Error.Missing("Published article"));
        series.AddArticle(articleId, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> RemoveArticleAsync(Guid id, Guid articleId, CancellationToken cancellationToken)
    {
        var owned = await OwnedAsync(id, cancellationToken);
        if (!owned.IsSuccess)
            return Result<Unit>.Failure(owned.Error!);
        owned.Value!.RemoveArticle(articleId, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> ReorderAsync(Guid id, ReorderSeriesArticlesRequest request,
        CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        var owned = await OwnedAsync(id, cancellationToken);
        if (!owned.IsSuccess)
            return Result<Unit>.Failure(owned.Error!);
        owned.Value!.ReorderArticles(request.ArticleIds, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    private async Task<Result<ArticleSeries>> OwnedAsync(Guid id, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<ArticleSeries>.Failure(Error.Unauthorized);
        var series = await seriesRepository.FindOwnedAsync(id, ownerId, cancellationToken);
        return series is null ? Result<ArticleSeries>.Failure(Error.Missing("Article series"))
            : Result<ArticleSeries>.Success(series);
    }

    private static ArticleSeriesSummaryDto ToSummary(ArticleSeries series) =>
        new(series.Id, series.OwnerId, series.Title, series.Slug, series.Description,
            series.Articles.Count, series.UpdatedAtUtc);
}
