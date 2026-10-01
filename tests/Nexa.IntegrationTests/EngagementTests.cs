using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Application.Features.Taxonomy;
using Nexa.Domain.Taxonomy;
using Nexa.Infrastructure.Persistence;
using Npgsql;

namespace Nexa.IntegrationTests;

public sealed class EngagementTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task Concurrent_likes_and_bookmarks_are_idempotent_and_bookmarks_stay_private()
    {
        using var author = await fixture.RegisterAsync();
        using var reader = await fixture.RegisterAsync();
        using var stranger = await fixture.RegisterAsync();
        var article = await ApiFixture.CreateArticleAsync(author.Client, publish: true);
        var likeUrl = $"/api/v1/articles/{article.Id}/like";
        var bookmarkUrl = $"/api/v1/articles/{article.Id}/bookmark";
        var responses = await Task.WhenAll(Enumerable.Range(0, 6).Select(_ => reader.Client.PutAsync(likeUrl, null))
            .Concat(Enumerable.Range(0, 6).Select(_ => reader.Client.PutAsync(bookmarkUrl, null))));
        try
        {
            foreach (var response in responses)
                await ApiFixture.ExpectAsync(response, HttpStatusCode.NoContent);
        }
        finally
        {
            foreach (var response in responses)
                response.Dispose();
        }
        using var scope = fixture.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
        Assert.Equal(1, await database.Likes.CountAsync(like => like.ArticleId == article.Id && like.UserId == reader.Id));
        Assert.Equal(1, await database.Bookmarks.CountAsync(bookmark => bookmark.ArticleId == article.Id && bookmark.UserId == reader.Id));
        var readerBookmarks = (await reader.Client.GetFromJsonAsync<PagedResult<ArticleSummaryDto>>("/api/v1/me/bookmarks", ApiFixture.JsonOptions))!;
        var strangerBookmarks = (await stranger.Client.GetFromJsonAsync<PagedResult<ArticleSummaryDto>>("/api/v1/me/bookmarks", ApiFixture.JsonOptions))!;
        Assert.Contains(readerBookmarks.Items, item => item.Id == article.Id);
        Assert.DoesNotContain(strangerBookmarks.Items, item => item.Id == article.Id);
        using var firstDelete = await reader.Client.DeleteAsync(likeUrl);
        using var secondDelete = await reader.Client.DeleteAsync(likeUrl);
        await ApiFixture.ExpectAsync(firstDelete, HttpStatusCode.NoContent);
        await ApiFixture.ExpectAsync(secondDelete, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Archived_articles_disappear_from_bookmarks_and_reject_new_interactions()
    {
        using var author = await fixture.RegisterAsync();
        using var reader = await fixture.RegisterAsync();
        var article = await ApiFixture.CreateArticleAsync(author.Client, publish: true);
        using var bookmark = await reader.Client.PutAsync($"/api/v1/articles/{article.Id}/bookmark", null);
        await ApiFixture.ExpectAsync(bookmark, HttpStatusCode.NoContent);
        using var archive = await author.Client.PostAsJsonAsync($"/api/v1/articles/{article.Id}/archive", new VersionRequest(article.Version));
        await ApiFixture.ExpectAsync(archive, HttpStatusCode.NoContent);
        var saved = (await reader.Client.GetFromJsonAsync<PagedResult<ArticleSummaryDto>>("/api/v1/me/bookmarks", ApiFixture.JsonOptions))!;
        Assert.DoesNotContain(saved.Items, item => item.Id == article.Id);
        using var like = await reader.Client.PutAsync($"/api/v1/articles/{article.Id}/like", null);
        await ApiFixture.ExpectAsync(like, HttpStatusCode.NotFound);
        using var comments = await reader.Client.GetAsync($"/api/v1/articles/{article.Id}/comments");
        await ApiFixture.ExpectAsync(comments, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Follow_is_idempotent_and_self_follow_is_blocked_by_api_and_database()
    {
        using var follower = await fixture.RegisterAsync();
        using var target = await fixture.RegisterAsync();
        var url = $"/api/v1/users/{target.Id}/follow";
        var responses = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => follower.Client.PutAsync(url, null)));
        try
        {
            foreach (var response in responses)
                await ApiFixture.ExpectAsync(response, HttpStatusCode.NoContent);
        }
        finally
        {
            foreach (var response in responses)
                response.Dispose();
        }
        using var self = await follower.Client.PutAsync($"/api/v1/users/{follower.Id}/follow", null);
        await ApiFixture.ExpectAsync(self, HttpStatusCode.BadRequest);
        using var scope = fixture.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
        Assert.Equal(1, await database.Follows.CountAsync(follow => follow.FollowerId == follower.Id && follow.FolloweeId == target.Id));
        var now = DateTimeOffset.UtcNow;
        var failure = await Assert.ThrowsAsync<PostgresException>(() => database.Database.ExecuteSqlInterpolatedAsync(
            $"""INSERT INTO social.follows (follower_id, followee_id, created_at_utc) VALUES ({follower.Id}, {follower.Id}, {now})"""));
        Assert.Equal(PostgresErrorCodes.CheckViolation, failure.SqlState);
        using var remove = await follower.Client.DeleteAsync(url);
        using var again = await follower.Client.DeleteAsync(url);
        await ApiFixture.ExpectAsync(remove, HttpStatusCode.NoContent);
        await ApiFixture.ExpectAsync(again, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Followed_tags_are_sorted_paged_and_include_published_article_and_follower_counts()
    {
        using var reader = await fixture.RegisterAsync();
        var suffix = Guid.NewGuid().ToString("N");
        var alphaTag = new Tag($"Alpha {suffix}", $"alpha-{suffix}");
        var zuluTag = new Tag($"Zulu {suffix}", $"zulu-{suffix}");
        using (var scope = fixture.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
            database.Tags.AddRange(alphaTag, zuluTag);
            await database.SaveChangesAsync();
        }

        using var followAlpha = await reader.Client.PutAsync($"/api/v1/tags/{alphaTag.Id}/follow", null);
        using var followZulu = await reader.Client.PutAsync($"/api/v1/tags/{zuluTag.Id}/follow", null);
        await ApiFixture.ExpectAsync(followAlpha, HttpStatusCode.NoContent);
        await ApiFixture.ExpectAsync(followZulu, HttpStatusCode.NoContent);
        await ApiFixture.CreateArticleAsync(reader.Client, publish: true, tags: [alphaTag.Id]);

        var page = (await reader.Client.GetFromJsonAsync<PagedResult<TagStatsDto>>(
            "/api/v1/me/tags/following?page=1&pageSize=1", ApiFixture.JsonOptions))!;

        Assert.Equal(2, page.TotalCount);
        var tag = Assert.Single(page.Items);
        Assert.Equal(alphaTag.Id, tag.Id);
        Assert.Equal(1, tag.PublishedArticleCount);
        Assert.Equal(1, tag.FollowerCount);
    }
}
