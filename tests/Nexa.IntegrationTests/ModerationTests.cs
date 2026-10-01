using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Common;
using Nexa.Application.Features.Accounts;
using Nexa.Application.Features.Articles;
using Nexa.Application.Features.Comments;
using Nexa.Application.Features.Taxonomy;
using Nexa.Identity.Authorization;
using Nexa.Identity.Entities;
using Nexa.Infrastructure.Persistence;

namespace Nexa.IntegrationTests;

public sealed class ModerationTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task Moderation_routes_require_moderator_or_admin_and_admin_routes_require_admin()
    {
        using var anonymous = fixture.NewClient();
        using var member = await fixture.RegisterAsync();
        using var moderator = await fixture.RegisterAsync();
        using var admin = await fixture.RegisterAsync();
        await GrantRoleAsync(moderator, RoleNames.Moderator);
        await GrantRoleAsync(admin, RoleNames.Admin);

        var moderationRoutes = new[]
        {
            "/api/v1/moderation/article-reviews",
            "/api/v1/moderation/reports",
            "/api/v1/admin/articles",
            "/api/v1/admin/comments"
        };
        foreach (var route in moderationRoutes)
        {
            using var anonymousResponse = await anonymous.GetAsync(route);
            using var memberResponse = await member.Client.GetAsync(route);
            using var moderatorResponse = await moderator.Client.GetAsync(route);
            using var adminResponse = await admin.Client.GetAsync(route);
            await ApiFixture.ExpectAsync(anonymousResponse, HttpStatusCode.Unauthorized);
            await ApiFixture.ExpectAsync(memberResponse, HttpStatusCode.Forbidden);
            await ApiFixture.ExpectAsync(moderatorResponse, HttpStatusCode.OK);
            await ApiFixture.ExpectAsync(adminResponse, HttpStatusCode.OK);
        }

        using var moderatorAdminResponse = await moderator.Client.GetAsync("/api/v1/admin/users");
        using var adminAdminResponse = await admin.Client.GetAsync("/api/v1/admin/users");
        await ApiFixture.ExpectAsync(moderatorAdminResponse, HttpStatusCode.Forbidden);
        await ApiFixture.ExpectAsync(adminAdminResponse, HttpStatusCode.OK);
    }

    [Fact]
    public async Task Removing_moderator_role_invalidates_existing_session_immediately()
    {
        using var moderator = await fixture.RegisterAsync();
        await GrantRoleAsync(moderator, RoleNames.Moderator);
        using var allowed = await moderator.Client.GetAsync("/api/v1/moderation/reports");
        await ApiFixture.ExpectAsync(allowed, HttpStatusCode.OK);

        using (var scope = fixture.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var user = (await users.FindByIdAsync(moderator.Id.ToString()))!;
            Assert.True((await users.RemoveFromRoleAsync(user, RoleNames.Moderator)).Succeeded);
            Assert.True((await users.UpdateSecurityStampAsync(user)).Succeeded);
        }

        using var denied = await moderator.Client.GetAsync("/api/v1/moderation/reports");
        await ApiFixture.ExpectAsync(denied, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Moderator_can_soft_delete_comments_and_cannot_edit_another_authors_content()
    {
        using var author = await fixture.RegisterAsync();
        using var reader = await fixture.RegisterAsync();
        using var moderator = await fixture.RegisterAsync();
        await GrantRoleAsync(moderator, RoleNames.Moderator);
        var article = await ApiFixture.CreateArticleAsync(author.Client, publish: true);
        using var created = await reader.Client.PostAsJsonAsync($"/api/v1/articles/{article.Id}/comments", new CommentInput("A helpful comment"));
        await ApiFixture.ExpectAsync(created, HttpStatusCode.Created);
        var comment = (await created.Content.ReadFromJsonAsync<CreatedCommentDto>())!;
        using var edit = await moderator.Client.PutAsJsonAsync($"/api/v1/comments/{comment.Id}", new UpdateCommentRequest(comment.Version, "Rewritten"));
        await ApiFixture.ExpectAsync(edit, HttpStatusCode.Forbidden);
        using var deleted = await moderator.Client.DeleteAsync($"/api/v1/comments/{comment.Id}?version={comment.Version}");
        await ApiFixture.ExpectAsync(deleted, HttpStatusCode.NoContent);
        var comments = (await reader.Client.GetFromJsonAsync<PagedResult<CommentDto>>($"/api/v1/articles/{article.Id}/comments"))!;
        Assert.DoesNotContain(comments.Items, item => item.Id == comment.Id);
        using var scope = fixture.Services.CreateScope();
        var persisted = await scope.ServiceProvider.GetRequiredService<NexaDbContext>().Comments
            .IgnoreQueryFilters().SingleAsync(item => item.Id == comment.Id);
        Assert.NotNull(persisted.DeletedAtUtc);
    }

    [Fact]
    public async Task Administrator_manages_taxonomy_and_used_taxonomy_cannot_be_deleted()
    {
        using var admin = await fixture.RegisterAsync();
        await GrantRoleAsync(admin, RoleNames.Admin);
        var suffix = Guid.NewGuid().ToString("N");
        using var categoryCreated = await admin.Client.PostAsJsonAsync("/api/v1/categories", new CategoryInput("Engineering", $"engineering-{suffix}", ""));
        await ApiFixture.ExpectAsync(categoryCreated, HttpStatusCode.Created);
        var category = (await categoryCreated.Content.ReadFromJsonAsync<CreatedIdDto>())!;
        using var tagCreated = await admin.Client.PostAsJsonAsync("/api/v1/tags", new TagInput($"Tag-{suffix}", $"tag-{suffix}"));
        await ApiFixture.ExpectAsync(tagCreated, HttpStatusCode.Created);
        var tag = (await tagCreated.Content.ReadFromJsonAsync<CreatedIdDto>())!;
        var article = await ApiFixture.CreateArticleAsync(admin.Client, categoryId: category.Id, tags: [tag.Id]);
        using var categoryDelete = await admin.Client.DeleteAsync($"/api/v1/categories/{category.Id}");
        using var tagDelete = await admin.Client.DeleteAsync($"/api/v1/tags/{tag.Id}");
        await ApiFixture.ExpectAsync(categoryDelete, HttpStatusCode.Conflict);
        await ApiFixture.ExpectAsync(tagDelete, HttpStatusCode.Conflict);
        using var detach = await admin.Client.PutAsJsonAsync($"/api/v1/articles/{article.Id}",
            new UpdateArticleRequest(article.Version, new ArticleInput(article.Title, article.Slug, article.Summary, article.BodyMarkdown, null, [])));
        await ApiFixture.ExpectAsync(detach, HttpStatusCode.NoContent);
        using var removedCategory = await admin.Client.DeleteAsync($"/api/v1/categories/{category.Id}");
        using var removedTag = await admin.Client.DeleteAsync($"/api/v1/tags/{tag.Id}");
        await ApiFixture.ExpectAsync(removedCategory, HttpStatusCode.NoContent);
        await ApiFixture.ExpectAsync(removedTag, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Comment_author_can_edit_once_and_stale_version_is_rejected()
    {
        using var account = await fixture.RegisterAsync();
        var article = await ApiFixture.CreateArticleAsync(account.Client, publish: true);
        using var created = await account.Client.PostAsJsonAsync($"/api/v1/articles/{article.Id}/comments", new CommentInput("Original"));
        await ApiFixture.ExpectAsync(created, HttpStatusCode.Created);
        var comment = (await created.Content.ReadFromJsonAsync<CreatedCommentDto>())!;
        using var edited = await account.Client.PutAsJsonAsync($"/api/v1/comments/{comment.Id}", new UpdateCommentRequest(comment.Version, "Edited"));
        using var stale = await account.Client.PutAsJsonAsync($"/api/v1/comments/{comment.Id}", new UpdateCommentRequest(comment.Version, "Stale"));
        await ApiFixture.ExpectAsync(edited, HttpStatusCode.NoContent);
        await ApiFixture.ExpectAsync(stale, HttpStatusCode.Conflict);
    }

    private async Task GrantRoleAsync(TestAccount account, string role)
    {
        using var scope = fixture.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var user = (await users.FindByIdAsync(account.Id.ToString()))!;
        var assigned = await users.AddToRoleAsync(user, role);
        Assert.True(assigned.Succeeded);
        using var login = await account.Client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(account.Registration.Email, ApiFixture.Password));
        await ApiFixture.ExpectAsync(login, HttpStatusCode.NoContent);
        await ApiFixture.CsrfAsync(account.Client);
    }
}
