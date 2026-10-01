using Nexa.Application.Common;
using Nexa.Application.Features.Taxonomy;
using Nexa.Domain.Taxonomy;

namespace Nexa.Application.Abstractions.Persistence;

public interface ITaxonomyRepository
{
    Task<PagedResult<CategoryDto>> CategoriesAsync(PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<CategoryStatsDto>> PopularCategoriesAsync(PageRequest page, CancellationToken cancellationToken);
    Task<CategoryStatsDto?> CategoryStatsAsync(Guid id, CancellationToken cancellationToken);
    Task<CategoryStatsDto?> CategoryStatsBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<PagedResult<TagDto>> TagsAsync(PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<TagStatsDto>> PopularTagsAsync(PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<TagTrendDto>> TrendingTagsAsync(DateTimeOffset sinceUtc, int periodDays, PageRequest page,
        CancellationToken cancellationToken);
    Task<TagStatsDto?> TagStatsAsync(Guid id, CancellationToken cancellationToken);
    Task<TagStatsDto?> TagStatsBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<Category?> FindCategoryAsync(Guid id, CancellationToken cancellationToken);
    Task<Tag?> FindTagAsync(Guid id, CancellationToken cancellationToken);
    Task<Tag?> FindTagBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<bool> CategorySlugAvailableAsync(string slug, Guid? exceptId, CancellationToken cancellationToken);
    Task<bool> TagSlugAvailableAsync(string slug, Guid? exceptId, CancellationToken cancellationToken);
    Task<bool> CategoryInUseAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> TagInUseAsync(Guid id, CancellationToken cancellationToken);
    void Add(Category category);
    void Add(Tag tag);
    void Remove(Category category);
    void Remove(Tag tag);
}
