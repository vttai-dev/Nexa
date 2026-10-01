using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Infrastructure.Persistence;

namespace Nexa.IntegrationTests;

public sealed class ArticleTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task Draft_is_private_and_only_owner_can_publish_it()
    {
        using var owner = await fixture.RegisterAsync();
        using var other = await fixture.RegisterAsync();
        using var anonymous = fixture.NewClient();
        var draft = await ApiFixture.CreateArticleAsync(owner.Client);
        using var publicDraft = await anonymous.GetAsync($"/api/v1/articles/{draft.Slug}");
        await ApiFixture.ExpectAsync(publicDraft, HttpStatusCode.NotFound);
        using var privateDraft = await other.Client.GetAsync($"/api/v1/me/articles/{draft.Id}");
        await ApiFixture.ExpectAsync(privateDraft, HttpStatusCode.NotFound);
        using var forbidden = await other.Client.PostAsJsonAsync($"/api/v1/articles/{draft.Id}/publish", new VersionRequest(draft.Version));
        await ApiFixture.ExpectAsync(forbidden, HttpStatusCode.NotFound);
        using var published = await owner.Client.PostAsJsonAsync($"/api/v1/articles/{draft.Id}/publish", new VersionRequest(draft.Version));
        await ApiFixture.ExpectAsync(published, HttpStatusCode.NoContent);
        var article = (await anonymous.GetFromJsonAsync<ArticleDto>($"/api/v1/articles/{draft.Slug}", ApiFixture.JsonOptions))!;
        Assert.Equal(draft.Id, article.Id);
        Assert.Equal(owner.Id, article.AuthorId);
        Assert.NotNull(article.PublishedAtUtc);
    }

    [Fact]
    public async Task Concurrent_updates_with_one_version_have_one_winner()
    {
        using var owner = await fixture.RegisterAsync();
        var draft = await ApiFixture.CreateArticleAsync(owner.Client);
        var request = new UpdateArticleRequest(draft.Version,
            new ArticleInput("Changed", draft.Slug, "", "Updated content", null, []));
        var responses = await Task.WhenAll(
            owner.Client.PutAsJsonAsync($"/api/v1/articles/{draft.Id}", request),
            owner.Client.PutAsJsonAsync($"/api/v1/articles/{draft.Id}", request with
            {
                Article = request.Article with { Title = "Different change" }
            }));
        try
        {
            Assert.Single(responses, response => response.StatusCode == HttpStatusCode.NoContent);
            Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Conflict);
        }
        finally
        {
            foreach (var response in responses)
                response.Dispose();
        }
    }

    [Fact]
    public async Task Database_concurrency_token_rejects_lost_update_even_outside_http()
    {
        using var owner = await fixture.RegisterAsync();
        var draft = await ApiFixture.CreateArticleAsync(owner.Client);
        using var firstScope = fixture.Services.CreateScope();
        using var secondScope = fixture.Services.CreateScope();
        var first = firstScope.ServiceProvider.GetRequiredService<NexaDbContext>();
        var second = secondScope.ServiceProvider.GetRequiredService<NexaDbContext>();
        var firstArticle = await first.Articles.SingleAsync(article => article.Id == draft.Id);
        var secondArticle = await second.Articles.SingleAsync(article => article.Id == draft.Id);
        firstArticle.Update("First", draft.Slug, "", "Content", null, [], DateTimeOffset.UtcNow);
        secondArticle.Update("Second", draft.Slug, "", "Content", null, [], DateTimeOffset.UtcNow);
        await first.SaveChangesAsync();
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());
    }

    [Fact]
    public async Task Public_lists_validate_pagination_and_exclude_drafts()
    {
        using var owner = await fixture.RegisterAsync();
        var draft = await ApiFixture.CreateArticleAsync(owner.Client);
        using var anonymous = fixture.NewClient();
        using var invalid = await anonymous.GetAsync("/api/v1/articles?pageSize=1000");
        await ApiFixture.ExpectAsync(invalid, HttpStatusCode.BadRequest);
        var feed = (await anonymous.GetFromJsonAsync<PagedResult<ArticleSummaryDto>>($"/api/v1/articles?authorId={owner.Id}", ApiFixture.JsonOptions))!;
        Assert.DoesNotContain(feed.Items, article => article.Id == draft.Id);
        Assert.Equal(0, feed.TotalCount);
    }

    [Fact]
    public async Task Public_article_shares_are_counted()
    {
        using var author = await fixture.RegisterAsync();
        var article = await ApiFixture.CreateArticleAsync(author.Client, publish: true);
        using var anonymous = fixture.NewClient();
        await ApiFixture.CsrfAsync(anonymous);

        using var share = await anonymous.PostAsync($"/api/v1/articles/{article.Slug}/shares", content: null);
        await ApiFixture.ExpectAsync(share, HttpStatusCode.NoContent);

        var metadata = await anonymous.GetFromJsonAsync<ArticleMetadataDto>(
            $"/api/v1/articles/{article.Slug}/metadata", ApiFixture.JsonOptions);
        Assert.Equal(1, metadata?.ShareCount);
    }
}
