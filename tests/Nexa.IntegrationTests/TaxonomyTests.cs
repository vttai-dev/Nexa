using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Common;
using Nexa.Application.Features.Taxonomy;
using Nexa.Domain.Taxonomy;
using Nexa.Infrastructure.Persistence;

namespace Nexa.IntegrationTests;

public sealed class TaxonomyTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task Popular_taxonomy_lists_sort_page_and_count_without_projected_ordering()
    {
        using var author = await fixture.RegisterAsync();
        var suffix = Guid.NewGuid().ToString("N");
        var popularCategory = new Category($"Nexa Popular {suffix}", $"nexa-popular-{suffix}", "Popular");
        var lessPopularCategory = new Category($"Nexa Other {suffix}", $"nexa-other-{suffix}", "Other");
        var popularTag = new Tag($"NexaPopular {suffix}", $"nexa-popular-{suffix}");
        var lessPopularTag = new Tag($"NexaOther {suffix}", $"nexa-other-{suffix}");
        using (var scope = fixture.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
            database.Categories.AddRange(popularCategory, lessPopularCategory);
            database.Tags.AddRange(popularTag, lessPopularTag);
            await database.SaveChangesAsync();
        }

        await ApiFixture.CreateArticleAsync(author.Client, publish: true, categoryId: popularCategory.Id, tags: [popularTag.Id]);
        await ApiFixture.CreateArticleAsync(author.Client, publish: true, categoryId: popularCategory.Id, tags: [popularTag.Id]);
        await ApiFixture.CreateArticleAsync(author.Client, publish: true, categoryId: lessPopularCategory.Id, tags: [lessPopularTag.Id]);

        var popularTags = await GetPageAsync<TagStatsDto>(author.Client, "/api/v1/tags/popular", 1);
        var lessPopularTags = await GetPageAsync<TagStatsDto>(author.Client, "/api/v1/tags/popular", 2);
        Assert.Equal(2, popularTags.TotalCount);
        Assert.Equal(popularTag.Id, Assert.Single(popularTags.Items).Id);
        Assert.Equal(2, popularTags.Items[0].PublishedArticleCount);
        Assert.Equal(lessPopularTag.Id, Assert.Single(lessPopularTags.Items).Id);

        var popularCategories = await GetPageAsync<CategoryStatsDto>(author.Client, "/api/v1/categories/popular", 1);
        var lessPopularCategories = await GetPageAsync<CategoryStatsDto>(author.Client, "/api/v1/categories/popular", 2);
        Assert.Equal(2, popularCategories.TotalCount);
        Assert.Equal(popularCategory.Id, Assert.Single(popularCategories.Items).Id);
        Assert.Equal(2, popularCategories.Items[0].PublishedArticleCount);
        Assert.Equal(lessPopularCategory.Id, Assert.Single(lessPopularCategories.Items).Id);

        var trendingTags = await GetPageAsync<TagTrendDto>(author.Client, "/api/v1/tags/trending?days=30", 1);
        Assert.Equal(2, trendingTags.TotalCount);
        Assert.Equal(popularTag.Id, Assert.Single(trendingTags.Items).Id);
        Assert.Equal(2, trendingTags.Items[0].PublishedArticleCount);
    }

    [Fact]
    public async Task Only_authors_can_create_topics_and_tags()
    {
        using var account = await fixture.RegisterAsync();
        var suffix = Guid.NewGuid().ToString("N");
        var category = new CategoryInput($"Topic {suffix}", $"topic-{suffix}", "");
        var tag = new TagInput($"Tag {suffix}", $"tag-{suffix}");

        using var deniedCategory = await account.Client.PostAsJsonAsync("/api/v1/categories", category);
        using var deniedTag = await account.Client.PostAsJsonAsync("/api/v1/tags", tag);
        await ApiFixture.ExpectAsync(deniedCategory, HttpStatusCode.Forbidden);
        await ApiFixture.ExpectAsync(deniedTag, HttpStatusCode.Forbidden);

        using var authorRole = await account.Client.PostAsJsonAsync("/api/v1/me/author", new { });
        await ApiFixture.ExpectAsync(authorRole, HttpStatusCode.NoContent);
        using var createdCategory = await account.Client.PostAsJsonAsync("/api/v1/categories", category);
        using var createdTag = await account.Client.PostAsJsonAsync("/api/v1/tags", tag);
        await ApiFixture.ExpectAsync(createdCategory, HttpStatusCode.Created);
        await ApiFixture.ExpectAsync(createdTag, HttpStatusCode.Created);
    }

    private static async Task<PagedResult<T>> GetPageAsync<T>(HttpClient client, string path, int page)
    {
        using var response = await client.GetAsync($"{path}{(path.Contains('?') ? '&' : '?')}page={page}&pageSize=1");
        await ApiFixture.ExpectAsync(response, HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<PagedResult<T>>(ApiFixture.JsonOptions))!;
    }
}
