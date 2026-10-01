using Nexa.Api.Errors;
using Nexa.Application.Features.Stats;

namespace Nexa.Api.Endpoints;

public static class StatsEndpoints
{
    public static void MapStatsEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/me/stats", async (StatsHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.MineAsync(cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Stats").WithName("GetMyStats").Produces<MyStatsDto>();

        api.MapGet("/admin/stats", async (StatsHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.AdminAsync(cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin").WithTags("Admin").WithName("GetAdminStats").Produces<AdminStatsDto>();

        api.MapGet("/admin/recent-activity", async (int? take, StatsHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.AdminRecentActivityAsync(take, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin").WithTags("Admin").WithName("GetAdminRecentActivity")
            .Produces<AdminRecentActivityDto>();

        api.MapGet("/users/{userName}/reputation", async (string userName, StatsHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.PublicReputationAsync(userName, cancellationToken)).ToHttpResult(context))
            .WithTags("Reputation").WithName("GetPublicUserReputation").Produces<PublicReputationDto>();

        api.MapGet("/contributors/top", async (int? take, StatsHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.TopContributorsAsync(take, cancellationToken)).ToHttpResult(context))
            .WithTags("Reputation").WithName("ListTopContributors").Produces<IReadOnlyList<PublicReputationDto>>();
    }
}
