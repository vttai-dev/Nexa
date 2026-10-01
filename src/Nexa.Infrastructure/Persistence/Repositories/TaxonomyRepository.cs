using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Taxonomy;
using Nexa.Domain.Articles;
using Nexa.Domain.Taxonomy;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class TaxonomyRepository(NexaDbContext database) : ITaxonomyRepository
{
    public async Task<PagedResult<CategoryDto>> CategoriesAsync(PageRequest page, CancellationToken cancellationToken)
    {
        var total = await database.Categories.CountAsync(cancellationToken);
        var items = await database.Categories.AsNoTracking().OrderBy(category => category.Name).ThenBy(category => category.Id)
            .Skip(page.Offset).Take(page.PageSize)
            .Select(category => new CategoryDto(category.Id, category.Name, category.Slug, category.Description))
            .ToListAsync(cancellationToken);
        return new PagedResult<CategoryDto>(items, page.Page, page.PageSize, total);
    }

    public async Task<PagedResult<CategoryStatsDto>> PopularCategoriesAsync(PageRequest page, CancellationToken cancellationToken)
    {
        var total = await database.Categories.CountAsync(cancellationToken);
        var items = await database.Categories.AsNoTracking()
            .Select(category => new
            {
                category.Id,
                category.Name,
                category.Slug,
                category.Description,
                PublishedArticleCount = database.Articles.Count(article => article.Status == ArticleStatus.Published
                    && article.CategoryId == category.Id)
            })
            .OrderByDescending(category => category.PublishedArticleCount)
            .ThenBy(category => category.Name)
            .ThenBy(category => category.Id)
            .Skip(page.Offset)
            .Take(page.PageSize)
            .Select(category => new CategoryStatsDto(category.Id, category.Name, category.Slug, category.Description,
                category.PublishedArticleCount))
            .ToListAsync(cancellationToken);
        return new PagedResult<CategoryStatsDto>(items, page.Page, page.PageSize, total);
    }

    public Task<CategoryStatsDto?> CategoryStatsAsync(Guid id, CancellationToken cancellationToken) =>
        CategoryStats().SingleOrDefaultAsync(category => category.Id == id, cancellationToken);

    public Task<CategoryStatsDto?> CategoryStatsBySlugAsync(string slug, CancellationToken cancellationToken) =>
        CategoryStats().SingleOrDefaultAsync(category => category.Slug == slug, cancellationToken);

    public async Task<PagedResult<TagDto>> TagsAsync(PageRequest page, CancellationToken cancellationToken)
    {
        var total = await database.Tags.CountAsync(cancellationToken);
        var items = await database.Tags.AsNoTracking().OrderBy(tag => tag.Name).ThenBy(tag => tag.Id)
            .Skip(page.Offset).Take(page.PageSize).Select(tag => new TagDto(tag.Id, tag.Name, tag.Slug)).ToListAsync(cancellationToken);
        return new PagedResult<TagDto>(items, page.Page, page.PageSize, total);
    }

    public async Task<PagedResult<TagStatsDto>> PopularTagsAsync(PageRequest page, CancellationToken cancellationToken)
    {
        var total = await database.Tags.CountAsync(cancellationToken);
        var items = await database.Tags.AsNoTracking()
            .Select(tag => new
            {
                tag.Id,
                tag.Name,
                tag.Slug,
                PublishedArticleCount = database.Articles.Count(article => article.Status == ArticleStatus.Published
                    && article.Tags.Any(link => link.TagId == tag.Id)),
                FollowerCount = database.TagFollows.Count(follow => follow.TagId == tag.Id)
            })
            .OrderByDescending(tag => tag.PublishedArticleCount)
            .ThenBy(tag => tag.Name)
            .ThenBy(tag => tag.Id)
            .Skip(page.Offset)
            .Take(page.PageSize)
            .Select(tag => new TagStatsDto(tag.Id, tag.Name, tag.Slug, tag.PublishedArticleCount, tag.FollowerCount))
            .ToListAsync(cancellationToken);
        return new PagedResult<TagStatsDto>(items, page.Page, page.PageSize, total);
    }

    public async Task<PagedResult<TagTrendDto>> TrendingTagsAsync(DateTimeOffset sinceUtc, int periodDays,
        PageRequest page, CancellationToken cancellationToken)
    {
        var matchingTags = database.Tags.AsNoTracking()
            .Where(tag => database.Articles.Any(article => article.Status == ArticleStatus.Published
                && article.PublishedAtUtc >= sinceUtc && article.Tags.Any(link => link.TagId == tag.Id)));
        var total = await matchingTags.CountAsync(cancellationToken);
        var items = await matchingTags
            .Select(tag => new
            {
                tag.Id,
                tag.Name,
                tag.Slug,
                PublishedArticleCount = database.Articles.Count(article => article.Status == ArticleStatus.Published
                    && article.PublishedAtUtc >= sinceUtc && article.Tags.Any(link => link.TagId == tag.Id)),
                FollowerCount = database.TagFollows.Count(follow => follow.TagId == tag.Id)
            })
            .OrderByDescending(tag => tag.PublishedArticleCount)
            .ThenByDescending(tag => tag.FollowerCount)
            .ThenBy(tag => tag.Name)
            .ThenBy(tag => tag.Id)
            .Skip(page.Offset)
            .Take(page.PageSize)
            .Select(tag => new TagTrendDto(tag.Id, tag.Name, tag.Slug, tag.PublishedArticleCount,
                tag.FollowerCount, periodDays))
            .ToListAsync(cancellationToken);
        return new PagedResult<TagTrendDto>(items, page.Page, page.PageSize, total);
    }

    public Task<TagStatsDto?> TagStatsAsync(Guid id, CancellationToken cancellationToken) =>
        TagStats().SingleOrDefaultAsync(tag => tag.Id == id, cancellationToken);

    public Task<TagStatsDto?> TagStatsBySlugAsync(string slug, CancellationToken cancellationToken) =>
        TagStats().SingleOrDefaultAsync(tag => tag.Slug == slug, cancellationToken);

    public Task<Category?> FindCategoryAsync(Guid id, CancellationToken cancellationToken) =>
        database.Categories.SingleOrDefaultAsync(category => category.Id == id, cancellationToken);
    public Task<Tag?> FindTagAsync(Guid id, CancellationToken cancellationToken) =>
        database.Tags.SingleOrDefaultAsync(tag => tag.Id == id, cancellationToken);
    public Task<Tag?> FindTagBySlugAsync(string slug, CancellationToken cancellationToken) =>
        database.Tags.SingleOrDefaultAsync(tag => tag.Slug == slug, cancellationToken);
    public async Task<bool> CategorySlugAvailableAsync(string slug, Guid? exceptId, CancellationToken cancellationToken) =>
        !await database.Categories.AnyAsync(category => category.Slug == slug && (!exceptId.HasValue || category.Id != exceptId.Value),
            cancellationToken);
    public async Task<bool> TagSlugAvailableAsync(string slug, Guid? exceptId, CancellationToken cancellationToken) =>
        !await database.Tags.AnyAsync(tag => tag.Slug == slug && (!exceptId.HasValue || tag.Id != exceptId.Value), cancellationToken);
    public Task<bool> CategoryInUseAsync(Guid id, CancellationToken cancellationToken) =>
        database.Articles.AnyAsync(article => article.CategoryId == id, cancellationToken);
    public Task<bool> TagInUseAsync(Guid id, CancellationToken cancellationToken) =>
        database.ArticleTags.AnyAsync(tag => tag.TagId == id, cancellationToken);
    public void Add(Category category) => database.Categories.Add(category);
    public void Add(Tag tag) => database.Tags.Add(tag);
    public void Remove(Category category) => database.Categories.Remove(category);
    public void Remove(Tag tag) => database.Tags.Remove(tag);

    private IQueryable<TagStatsDto> TagStats() => database.Tags.AsNoTracking().Select(tag => new TagStatsDto(
        tag.Id,
        tag.Name,
        tag.Slug,
        database.Articles.Count(article => article.Status == ArticleStatus.Published
            && article.Tags.Any(link => link.TagId == tag.Id)),
        database.TagFollows.Count(follow => follow.TagId == tag.Id)));

    private IQueryable<CategoryStatsDto> CategoryStats() => database.Categories.AsNoTracking().Select(category => new CategoryStatsDto(
        category.Id,
        category.Name,
        category.Slug,
        category.Description,
        database.Articles.Count(article => article.Status == ArticleStatus.Published && article.CategoryId == category.Id)));
}
