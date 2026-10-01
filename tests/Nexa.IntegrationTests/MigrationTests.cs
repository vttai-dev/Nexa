using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Infrastructure.Persistence;
using Nexa.Infrastructure.Persistence.Seeding;

namespace Nexa.IntegrationTests;

public sealed class MigrationTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task Migration_sql_and_role_seed_can_run_again_without_duplicates()
    {
        await using var scope = fixture.Services.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<NexaDbContext>();
        var script = database.GetService<IMigrator>().GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
        await database.Database.ExecuteSqlRawAsync(script);
        await database.Database.ExecuteSqlRawAsync(script);
        await scope.ServiceProvider.GetRequiredService<RoleSeeder>().SeedAsync();
        await scope.ServiceProvider.GetRequiredService<RoleSeeder>().SeedAsync();
        Assert.Equal(3, await database.Roles.CountAsync());
        var applied = (await database.Database.GetAppliedMigrationsAsync()).ToArray();
        Assert.Contains("20260926050314_InitialCreate", applied);
        Assert.Contains("20260927061154_AddArticleViewCount", applied);
        Assert.Contains("20260927062412_AddTagFollowsAndReports", applied);
        Assert.Contains("20260927062742_AddAuditLogs", applied);
        Assert.Contains("20260927063905_AddNotifications", applied);
        Assert.Contains("20260927064913_AddArticleRevisions", applied);
        Assert.Empty(await database.Database.GetPendingMigrationsAsync());
        Assert.False(database.Database.HasPendingModelChanges());
    }
}
