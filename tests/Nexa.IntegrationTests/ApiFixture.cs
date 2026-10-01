using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Features.Accounts;
using Nexa.Application.Features.Articles;
using Nexa.Infrastructure.Persistence;
using Nexa.Infrastructure.Persistence.Seeding;
using Testcontainers.PostgreSql;

namespace Nexa.IntegrationTests;

public sealed class ApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:18.6-alpine").Build();
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };
    public const string Password = "Nexa-Test-Password-123!";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:NexaDb", _postgres.GetConnectionString());
        builder.UseSetting("RateLimits:AuthPermitLimit", "10000");
        builder.UseSetting("Logging:LogLevel:Default", "Error");
        builder.UseSetting("Logging:LogLevel:Microsoft.AspNetCore", "Critical");
        builder.UseSetting("Logging:LogLevel:Microsoft.EntityFrameworkCore", "Critical");
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        await using var scope = Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<NexaDbContext>().Database.MigrateAsync();
        await scope.ServiceProvider.GetRequiredService<RoleSeeder>().SeedAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    public HttpClient NewClient() => CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
        AllowAutoRedirect = false,
        HandleCookies = true
    });

    public async Task<TestAccount> RegisterAsync()
    {
        var suffix = Guid.NewGuid().ToString("N")[..16];
        var request = new RegisterRequest($"user_{suffix}", $"{suffix}@example.com", Password, $"Author {suffix}", "+12025550123");
        var client = NewClient();
        await CsrfAsync(client);
        using var registered = await client.PostAsJsonAsync("/api/v1/auth/register", request);
        await ExpectAsync(registered, HttpStatusCode.Created);
        var result = (await registered.Content.ReadFromJsonAsync<RegisteredDto>())!;
        using var login = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(request.Email, request.Password));
        await ExpectAsync(login, HttpStatusCode.NoContent);
        await CsrfAsync(client);
        return new TestAccount(result.UserId, request, client);
    }

    public static async Task CsrfAsync(HttpClient client)
    {
        var csrf = (await client.GetFromJsonAsync<CsrfResponse>("/api/v1/auth/csrf"))!;
        client.DefaultRequestHeaders.Remove("X-CSRF-TOKEN");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", csrf.RequestToken);
    }

    public static async Task ExpectAsync(HttpResponseMessage response, HttpStatusCode status) =>
        Assert.True(response.StatusCode == status, $"Expected {(int)status}, got {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");

    public static async Task<ArticleDto> CreateArticleAsync(HttpClient client, bool publish = false, Guid? categoryId = null, Guid[]? tags = null)
    {
        using var authorRegistration = await client.PostAsJsonAsync("/api/v1/me/author", new { });
        await ExpectAsync(authorRegistration, HttpStatusCode.NoContent);
        var slug = $"article-{Guid.NewGuid():N}";
        using var response = await client.PostAsJsonAsync("/api/v1/articles",
            new ArticleInput("Technical article", slug, "Summary", "# Nexa\nContent", categoryId, tags ?? []));
        await ExpectAsync(response, HttpStatusCode.Created);
        var created = (await response.Content.ReadFromJsonAsync<CreatedArticleDto>())!;
        Assert.Equal($"/api/v1/me/articles/{created.Id}", response.Headers.Location?.OriginalString);
        if (publish)
        {
            using var published = await client.PostAsJsonAsync($"/api/v1/articles/{created.Id}/publish", new VersionRequest(created.Version));
            await ExpectAsync(published, HttpStatusCode.NoContent);
        }
        return (await client.GetFromJsonAsync<ArticleDto>($"/api/v1/me/articles/{created.Id}", JsonOptions))!;
    }

    private sealed record CsrfResponse(string RequestToken);
}

public sealed record TestAccount(Guid Id, RegisterRequest Registration, HttpClient Client) : IDisposable
{
    public void Dispose() => Client.Dispose();
}
