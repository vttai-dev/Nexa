using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Domain.Auditing;
using Nexa.Domain.Taxonomy;

namespace Nexa.Application.Features.Taxonomy;

public sealed class TaxonomyHandler(ITaxonomyRepository repository, IUnitOfWork unitOfWork, ICurrentUser currentUser,
    IAuditLogRepository auditLogs, TimeProvider clock)
{
    public async Task<Result<PagedResult<CategoryDto>>> CategoriesAsync(PageRequest page, CancellationToken cancellationToken) =>
        !page.IsValid ? Result<PagedResult<CategoryDto>>.Failure(PageRequest.Invalid)
        : Result<PagedResult<CategoryDto>>.Success(await repository.CategoriesAsync(page, cancellationToken));

    public async Task<Result<PagedResult<CategoryStatsDto>>> PopularCategoriesAsync(PageRequest page, CancellationToken cancellationToken) =>
        !page.IsValid ? Result<PagedResult<CategoryStatsDto>>.Failure(PageRequest.Invalid)
        : Result<PagedResult<CategoryStatsDto>>.Success(await repository.PopularCategoriesAsync(page, cancellationToken));

    public async Task<Result<CategoryStatsDto>> CategoryStatsAsync(Guid id, CancellationToken cancellationToken)
    {
        var stats = await repository.CategoryStatsAsync(id, cancellationToken);
        return stats is null ? Result<CategoryStatsDto>.Failure(Error.Missing("Category")) : Result<CategoryStatsDto>.Success(stats);
    }

    public async Task<Result<CategoryStatsDto>> CategoryStatsBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var stats = await repository.CategoryStatsBySlugAsync(slug, cancellationToken);
        return stats is null ? Result<CategoryStatsDto>.Failure(Error.Missing("Category")) : Result<CategoryStatsDto>.Success(stats);
    }

    public async Task<Result<PagedResult<TagDto>>> TagsAsync(PageRequest page, CancellationToken cancellationToken) =>
        !page.IsValid ? Result<PagedResult<TagDto>>.Failure(PageRequest.Invalid)
        : Result<PagedResult<TagDto>>.Success(await repository.TagsAsync(page, cancellationToken));

    public async Task<Result<PagedResult<TagStatsDto>>> PopularTagsAsync(PageRequest page, CancellationToken cancellationToken) =>
        !page.IsValid ? Result<PagedResult<TagStatsDto>>.Failure(PageRequest.Invalid)
        : Result<PagedResult<TagStatsDto>>.Success(await repository.PopularTagsAsync(page, cancellationToken));

    public async Task<Result<PagedResult<TagTrendDto>>> TrendingTagsAsync(int? days, PageRequest page,
        CancellationToken cancellationToken)
    {
        var periodDays = days ?? 7;
        if (periodDays is < 1 or > 90)
            return Result<PagedResult<TagTrendDto>>.Failure(new Error(ErrorType.Validation,
                "invalid_period", "Days must be between 1 and 90."));
        if (!page.IsValid)
            return Result<PagedResult<TagTrendDto>>.Failure(PageRequest.Invalid);
        return Result<PagedResult<TagTrendDto>>.Success(await repository.TrendingTagsAsync(
            clock.GetUtcNow().AddDays(-periodDays), periodDays, page, cancellationToken));
    }

    public async Task<Result<TagStatsDto>> TagStatsAsync(Guid id, CancellationToken cancellationToken)
    {
        var stats = await repository.TagStatsAsync(id, cancellationToken);
        return stats is null ? Result<TagStatsDto>.Failure(Error.Missing("Tag")) : Result<TagStatsDto>.Success(stats);
    }

    public async Task<Result<TagStatsDto>> TagStatsBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var stats = await repository.TagStatsBySlugAsync(slug, cancellationToken);
        return stats is null ? Result<TagStatsDto>.Failure(Error.Missing("Tag")) : Result<TagStatsDto>.Success(stats);
    }

    public async Task<Result<TaxonomySlugAvailabilityDto>> CategorySlugAvailabilityAsync(string slug, Guid? exceptId,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<TaxonomySlugAvailabilityDto>.Failure(Error.Forbidden);
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 180)
            return Result<TaxonomySlugAvailabilityDto>.Failure(new Error(ErrorType.Validation, "invalid_request", "Slug is invalid."));
        var normalized = slug.Trim().ToLowerInvariant();
        return Result<TaxonomySlugAvailabilityDto>.Success(new TaxonomySlugAvailabilityDto(normalized,
            await repository.CategorySlugAvailableAsync(normalized, exceptId, cancellationToken)));
    }

    public async Task<Result<TaxonomySlugAvailabilityDto>> TagSlugAvailabilityAsync(string slug, Guid? exceptId,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<TaxonomySlugAvailabilityDto>.Failure(Error.Forbidden);
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 180)
            return Result<TaxonomySlugAvailabilityDto>.Failure(new Error(ErrorType.Validation, "invalid_request", "Slug is invalid."));
        var normalized = slug.Trim().ToLowerInvariant();
        return Result<TaxonomySlugAvailabilityDto>.Success(new TaxonomySlugAvailabilityDto(normalized,
            await repository.TagSlugAvailableAsync(normalized, exceptId, cancellationToken)));
    }

    public async Task<Result<CreatedIdDto>> CreateCategoryAsync(CategoryInput request, CancellationToken cancellationToken)
    {
        if (!currentUser.CanAuthor)
            return Result<CreatedIdDto>.Failure(Error.Forbidden);
        if (RequestValidation.Validate(request) is { } error)
            return Result<CreatedIdDto>.Failure(error);
        var category = new Category(request.Name, request.Slug, request.Description);
        repository.Add(category);
        Audit("CategoryCreated", "Category", category.Id, request.Slug);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<CreatedIdDto>.Success(new CreatedIdDto(category.Id));
    }

    public async Task<Result<CreatedIdDto>> CreateTagAsync(TagInput request, CancellationToken cancellationToken)
    {
        if (!currentUser.CanAuthor)
            return Result<CreatedIdDto>.Failure(Error.Forbidden);
        if (RequestValidation.Validate(request) is { } error)
            return Result<CreatedIdDto>.Failure(error);
        var tag = new Tag(request.Name, request.Slug);
        repository.Add(tag);
        Audit("TagCreated", "Tag", tag.Id, request.Slug);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<CreatedIdDto>.Success(new CreatedIdDto(tag.Id));
    }

    public async Task<Result<Unit>> UpdateCategoryAsync(Guid id, CategoryInput request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<Unit>.Failure(Error.Forbidden);
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        var category = await repository.FindCategoryAsync(id, cancellationToken);
        if (category is null)
            return Result<Unit>.Failure(Error.Missing("Category"));
        category.Update(request.Name, request.Slug, request.Description);
        Audit("CategoryUpdated", "Category", category.Id, request.Slug);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> UpdateTagAsync(Guid id, TagInput request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<Unit>.Failure(Error.Forbidden);
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        var tag = await repository.FindTagAsync(id, cancellationToken);
        if (tag is null)
            return Result<Unit>.Failure(Error.Missing("Tag"));
        tag.Update(request.Name, request.Slug);
        Audit("TagUpdated", "Tag", tag.Id, request.Slug);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<Unit>.Failure(Error.Forbidden);
        var category = await repository.FindCategoryAsync(id, cancellationToken);
        if (category is null)
            return Result<Unit>.Failure(Error.Missing("Category"));
        if (await repository.CategoryInUseAsync(id, cancellationToken))
            return Result<Unit>.Failure(InUse);
        repository.Remove(category);
        Audit("CategoryDeleted", "Category", category.Id, category.Slug);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> DeleteTagAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<Unit>.Failure(Error.Forbidden);
        var tag = await repository.FindTagAsync(id, cancellationToken);
        if (tag is null)
            return Result<Unit>.Failure(Error.Missing("Tag"));
        if (await repository.TagInUseAsync(id, cancellationToken))
            return Result<Unit>.Failure(InUse);
        repository.Remove(tag);
        Audit("TagDeleted", "Tag", tag.Id, tag.Slug);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    private static readonly Error InUse = new(ErrorType.Conflict, "taxonomy_in_use", "This taxonomy is used by an article.");

    private void Audit(string action, string targetType, Guid targetId, string details)
    {
        if (currentUser.Id is not { } actorId)
            return;
        auditLogs.Add(new AuditLog(actorId, action, targetType, targetId, details, currentUser.IpAddress, clock.GetUtcNow()));
    }
}
