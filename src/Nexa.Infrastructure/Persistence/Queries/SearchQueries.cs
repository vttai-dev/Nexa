using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Search;
using Nexa.Domain.Articles;

namespace Nexa.Infrastructure.Persistence.Queries;

public sealed class SearchQueries(NexaDbContext database) : ISearchQueries
{
    public Task<PagedResult<SearchArticleResultDto>> ArticlesAsync(SearchRequest request, CancellationToken cancellationToken)
    {
        var query = database.Articles.AsNoTracking()
            .Where(article => article.Status == ArticleStatus.Published
                && EF.Functions.ToTsVector("simple", article.Title + " " + article.Summary + " " + article.BodyMarkdown)
                    .Matches(EF.Functions.WebSearchToTsQuery("simple", request.Query)))
            .OrderByDescending(article => EF.Functions.ToTsVector("simple", article.Title + " " + article.Summary + " " + article.BodyMarkdown)
                .Rank(EF.Functions.WebSearchToTsQuery("simple", request.Query)))
            .ThenByDescending(article => article.PublishedAtUtc)
            .ThenByDescending(article => article.Id)
            .Select(article => new SearchArticleResultDto(
                article.Id,
                article.Title,
                article.Slug,
                article.Summary,
                article.AuthorId,
                database.Profiles.Where(profile => profile.UserId == article.AuthorId).Select(profile => profile.DisplayName).First(),
                article.PublishedAtUtc));
        return PageAsync(query, request.Page, cancellationToken);
    }

    public Task<PagedResult<SearchUserResultDto>> UsersAsync(SearchRequest request, CancellationToken cancellationToken)
    {
        var term = request.Query.ToUpperInvariant();
        var query =
            from profile in database.Profiles.AsNoTracking()
            join user in database.Users.AsNoTracking() on profile.UserId equals user.Id
            where user.NormalizedUserName!.Contains(term)
                || profile.DisplayName.ToUpper().Contains(term)
                || profile.Bio.ToUpper().Contains(term)
            orderby profile.DisplayName, user.Id
            select new SearchUserResultDto(user.Id, user.UserName!, profile.DisplayName, profile.Bio, profile.AvatarUrl);
        return PageAsync(query, request.Page, cancellationToken);
    }

    public Task<PagedResult<SearchTagResultDto>> TagsAsync(SearchRequest request, CancellationToken cancellationToken)
    {
        var term = request.Query.ToUpperInvariant();
        var slugTerm = request.Query.ToLowerInvariant();
        return PageTagsAsync(term, slugTerm, request.Page, cancellationToken);
    }

    private async Task<PagedResult<SearchTagResultDto>> PageTagsAsync(string term, string slugTerm, PageRequest page,
        CancellationToken cancellationToken)
    {
        var matchingTags = database.Tags.AsNoTracking()
            .Where(tag => tag.NormalizedName.Contains(term) || tag.Slug.Contains(slugTerm));
        var total = await matchingTags.CountAsync(cancellationToken);
        var items = await matchingTags
            .Select(tag => new
            {
                tag.Id,
                tag.Name,
                tag.Slug,
                ArticleCount = database.Articles.Count(article => article.Status == ArticleStatus.Published
                    && article.Tags.Any(link => link.TagId == tag.Id))
            })
            .OrderByDescending(tag => tag.ArticleCount)
            .ThenBy(tag => tag.Name)
            .ThenBy(tag => tag.Id)
            .Skip(page.Offset)
            .Take(page.PageSize)
            .Select(tag => new SearchTagResultDto(tag.Id, tag.Name, tag.Slug, tag.ArticleCount))
            .ToListAsync(cancellationToken);
        return new PagedResult<SearchTagResultDto>(items, page.Page, page.PageSize, total);
    }

    private static async Task<PagedResult<T>> PageAsync<T>(IQueryable<T> query, PageRequest page, CancellationToken cancellationToken)
    {
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(page.Offset).Take(page.PageSize).ToListAsync(cancellationToken);
        return new PagedResult<T>(items, page.Page, page.PageSize, total);
    }
}
