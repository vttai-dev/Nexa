using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Accounts;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Accounts;
using Nexa.Identity.Authorization;
using Nexa.Identity.Entities;
using Nexa.Infrastructure.Persistence;

namespace Nexa.IntegrationTests;

public sealed class AuthenticationTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task Registration_persists_profile_and_member_role_without_granting_admin()
    {
        using var account = await fixture.RegisterAsync();
        var me = (await account.Client.GetFromJsonAsync<MeDto>("/api/v1/me"))!;
        Assert.Equal(account.Id, me.Profile.UserId);
        Assert.Equal(account.Registration.DisplayName, me.Profile.DisplayName);
        Assert.Equal([RoleNames.Member], me.Account.Roles);
        using var scope = fixture.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
        Assert.True(await database.Profiles.AnyAsync(profile => profile.UserId == account.Id));
        Assert.False(database.Database.HasPendingModelChanges());
    }

    [Fact]
    public async Task Anonymous_requests_and_missing_csrf_are_rejected_with_problem_details()
    {
        using var client = fixture.NewClient();
        using var me = await client.GetAsync("/api/v1/me");
        await ApiFixture.ExpectAsync(me, HttpStatusCode.Unauthorized);
        Assert.Equal("application/problem+json", me.Content.Headers.ContentType?.MediaType);
        using var registration = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest("test_user", "test@example.com", ApiFixture.Password, "Tester", "+12025550123"));
        await ApiFixture.ExpectAsync(registration, HttpStatusCode.BadRequest);
        Assert.Contains("invalid_csrf", await registration.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Login_cookie_is_secure_and_logout_invalidates_the_browser_session()
    {
        using var account = await fixture.RegisterAsync();
        using var client = fixture.NewClient();
        await ApiFixture.CsrfAsync(client);
        using var login = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(account.Registration.Email, ApiFixture.Password));
        await ApiFixture.ExpectAsync(login, HttpStatusCode.NoContent);
        var session = Assert.Single(login.Headers.GetValues("Set-Cookie"), cookie => cookie.StartsWith("__Host-Nexa.Session=", StringComparison.Ordinal));
        Assert.Contains("secure", session, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("httponly", session, StringComparison.OrdinalIgnoreCase);
        await ApiFixture.CsrfAsync(client);
        using var logout = await client.PostAsJsonAsync("/api/v1/auth/logout", new { });
        await ApiFixture.ExpectAsync(logout, HttpStatusCode.NoContent);
        using var me = await client.GetAsync("/api/v1/me");
        await ApiFixture.ExpectAsync(me, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Registration_and_login_work_without_phone_or_message_provider()
    {
        using var client = fixture.NewClient();
        await ApiFixture.CsrfAsync(client);
        var suffix = Guid.NewGuid().ToString("N")[..12];
        var request = new RegisterRequest($"member_{suffix}", $"{suffix}@example.com", ApiFixture.Password,
            "Local member");
        using var registration = await client.PostAsJsonAsync("/api/v1/auth/register", request);
        await ApiFixture.ExpectAsync(registration, HttpStatusCode.Created);

        using var login = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(request.Email, ApiFixture.Password));
        await ApiFixture.ExpectAsync(login, HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task New_member_must_opt_in_before_creating_content_and_author_role_is_refreshed()
    {
        using var member = await fixture.RegisterAsync();
        using var forbidden = await member.Client.PostAsJsonAsync("/api/v1/articles",
            new ArticleInput("Reader draft", $"reader-{Guid.NewGuid():N}", "Summary", "Content", null, []));
        await ApiFixture.ExpectAsync(forbidden, HttpStatusCode.Forbidden);

        using var enrollment = await member.Client.PostAsJsonAsync("/api/v1/me/author", new { });
        await ApiFixture.ExpectAsync(enrollment, HttpStatusCode.NoContent);
        var account = (await member.Client.GetFromJsonAsync<MeDto>("/api/v1/me"))!.Account;
        Assert.Contains(RoleNames.Member, account.Roles);
        Assert.Contains(RoleNames.Author, account.Roles);

        var article = await ApiFixture.CreateArticleAsync(member.Client);
        Assert.Equal("Technical article", article.Title);
    }

    [Fact]
    public async Task Availability_endpoints_report_existing_username_and_email()
    {
        using var account = await fixture.RegisterAsync();
        using var client = fixture.NewClient();

        var userName = await client.GetFromJsonAsync<AccountAvailabilityDto>(
            $"/api/v1/auth/availability/user-name/{account.Registration.UserName}");
        var email = await client.GetFromJsonAsync<AccountAvailabilityDto>(
            $"/api/v1/auth/availability/email?email={Uri.EscapeDataString(account.Registration.Email)}");

        Assert.False(userName!.Available);
        Assert.False(email!.Available);
    }

    [Fact]
    public async Task Email_uniqueness_is_case_insensitive()
    {
        using var account = await fixture.RegisterAsync();
        using var client = fixture.NewClient();
        await ApiFixture.CsrfAsync(client);
        using var response = await client.PostAsJsonAsync("/api/v1/auth/register", account.Registration with
        {
            UserName = $"new_{Guid.NewGuid():N}"[..25],
            Email = account.Registration.Email.ToUpperInvariant()
        });
        await ApiFixture.ExpectAsync(response, HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Concurrent_registration_cannot_duplicate_a_normalized_email()
    {
        using var first = fixture.NewClient();
        using var second = fixture.NewClient();
        await ApiFixture.CsrfAsync(first);
        await ApiFixture.CsrfAsync(second);
        var suffix = Guid.NewGuid().ToString("N")[..12];
        var request = new RegisterRequest($"first_{suffix}", $"{suffix}@example.com", ApiFixture.Password, "Concurrent author", "+12025550123");
        var responses = await Task.WhenAll(
            first.PostAsJsonAsync("/api/v1/auth/register", request),
            second.PostAsJsonAsync("/api/v1/auth/register", request with { UserName = $"second_{suffix}" }));
        try
        {
            Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Created);
            Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Conflict);
            using var scope = fixture.Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
            Assert.Equal(1, await database.Users.CountAsync(user => user.NormalizedEmail == request.Email.ToUpperInvariant()));
        }
        finally
        {
            foreach (var response in responses)
                response.Dispose();
        }
    }

    [Fact]
    public async Task Failure_creating_profile_rolls_back_identity_and_membership()
    {
        using var failing = fixture.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.RemoveAll<IProfileRepository>();
            services.AddScoped<IProfileRepository, FailingProfileRepository>();
        }));
        using var client = failing.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false
        });
        await ApiFixture.CsrfAsync(client);
        var suffix = Guid.NewGuid().ToString("N")[..12];
        var request = new RegisterRequest($"fail_{suffix}", $"{suffix}@example.com", ApiFixture.Password, "Rollback", "+12025550123");
        using var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);
        await ApiFixture.ExpectAsync(response, HttpStatusCode.InternalServerError);

        using var scope = fixture.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
        Assert.False(await database.Users.AnyAsync(user => user.NormalizedEmail == request.Email.ToUpperInvariant()));
    }

    [Fact]
    public async Task Member_cannot_manage_taxonomy_and_public_profile_does_not_expose_email()
    {
        using var member = await fixture.RegisterAsync();
        using var forbidden = await member.Client.PostAsJsonAsync("/api/v1/tags", new { name = "CSharp", slug = "csharp" });
        await ApiFixture.ExpectAsync(forbidden, HttpStatusCode.Forbidden);
        using var publicClient = fixture.NewClient();
        var profile = await publicClient.GetStringAsync($"/api/v1/users/{member.Registration.UserName}");
        Assert.DoesNotContain(member.Registration.Email, profile);
        Assert.DoesNotContain("password", profile, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_lockout_returns_generic_failures()
    {
        using var account = await fixture.RegisterAsync();
        using var client = fixture.NewClient();
        await ApiFixture.CsrfAsync(client);
        for (var attempt = 0; attempt < 5; attempt++)
        {
            using var invalid = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(account.Registration.Email, "Wrong-password-123!"));
            await ApiFixture.ExpectAsync(invalid, HttpStatusCode.Unauthorized);
        }
        using var locked = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(account.Registration.Email, ApiFixture.Password));
        await ApiFixture.ExpectAsync(locked, HttpStatusCode.Unauthorized);
        using var scope = fixture.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var user = (await users.FindByIdAsync(account.Id.ToString()))!;
        Assert.True(await users.IsLockedOutAsync(user));
    }

    private sealed class FailingProfileRepository : IProfileRepository
    {
        public void Add(Profile profile) => throw new InvalidOperationException("Simulated profile persistence failure.");
        public Task<Profile?> FindAsync(Guid userId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<ProfileDto?> GetAsync(Guid userId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<ProfileDto?> GetByUserNameAsync(string userName, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<PublicProfileStatsDto?> StatsByUserNameAsync(string userName, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<PagedResult<PublicFollowDto>?> FollowersAsync(string userName, PageRequest page, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<PagedResult<PublicFollowDto>?> FollowingAsync(string userName, PageRequest page, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<MentionTargetDto>> MentionTargetsAsync(IReadOnlyCollection<string> userNames, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
