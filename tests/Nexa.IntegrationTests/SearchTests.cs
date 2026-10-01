using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Common;
using Nexa.Application.Features.Search;
using Nexa.Domain.Taxonomy;
using Nexa.Infrastructure.Persistence;

namespace Nexa.IntegrationTests;

public sealed class SearchTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task Tag_search_and_search_aggregates_return_sorted_paginated_results()
    {
        using var author = await fixture.RegisterAsync();
        var suffix = Guid.NewGuid().ToString("N");
        var popularTag = new Tag($"NexaSearch {suffix}", $"nexa-search-popular-{suffix}");
        var lessPopularTag = new Tag($"NexaSearch {suffix} other", $"nexa-search-other-{suffix}");
        using (var scope = fixture.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
            database.Tags.AddRange(popularTag, lessPopularTag);
            await database.SaveChangesAsync();
        }

        await ApiFixture.CreateArticleAsync(author.Client, publish: true, tags: [popularTag.Id]);
        await ApiFixture.CreateArticleAsync(author.Client, publish: true, tags: [popularTag.Id]);
        await ApiFixture.CreateArticleAsync(author.Client, publish: true, tags: [lessPopularTag.Id]);

        var query = Uri.EscapeDataString($"NexaSearch {suffix[..8]}");
        using var firstPageResponse = await author.Client.GetAsync($"/api/v1/search/tags?query={query}&page=1&pageSize=1");
        await ApiFixture.ExpectAsync(firstPageResponse, HttpStatusCode.OK);
        var firstPage = (await firstPageResponse.Content.ReadFromJsonAsync<PagedResult<SearchTagResultDto>>(ApiFixture.JsonOptions))!;
        using var secondPageResponse = await author.Client.GetAsync($"/api/v1/search/tags?query={query}&page=2&pageSize=1");
        await ApiFixture.ExpectAsync(secondPageResponse, HttpStatusCode.OK);
        var secondPage = (await secondPageResponse.Content.ReadFromJsonAsync<PagedResult<SearchTagResultDto>>(ApiFixture.JsonOptions))!;

        Assert.Equal(2, firstPage.TotalCount);
        Assert.Equal(popularTag.Id, Assert.Single(firstPage.Items).Id);
        Assert.Equal(2, firstPage.Items[0].ArticleCount);
        Assert.Equal(lessPopularTag.Id, Assert.Single(secondPage.Items).Id);
        Assert.Equal(1, secondPage.Items[0].ArticleCount);

        using var suggestionsResponse = await author.Client.GetAsync($"/api/v1/search/suggestions?query={query}");
        await ApiFixture.ExpectAsync(suggestionsResponse, HttpStatusCode.OK);
        var suggestions = (await suggestionsResponse.Content.ReadFromJsonAsync<SearchSuggestionsDto>(ApiFixture.JsonOptions))!;
        Assert.Contains(suggestions.Items, item => item.Type == "tag" && item.Value == popularTag.Slug);

        using var allResponse = await author.Client.GetAsync($"/api/v1/search?query={query}&page=1&pageSize=10");
        await ApiFixture.ExpectAsync(allResponse, HttpStatusCode.OK);
        var all = (await allResponse.Content.ReadFromJsonAsync<SearchResultsDto>(ApiFixture.JsonOptions))!;
        Assert.Equal(2, all.Tags.TotalCount);
        Assert.Equal(popularTag.Id, all.Tags.Items[0].Id);
    }
}
