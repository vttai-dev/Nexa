using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Accounts;

namespace Nexa.Api.Endpoints;

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/me", async (AccountHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.MeAsync(cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Accounts").WithName("GetMe").Produces<MeDto>();

        api.MapPut("/me/profile", async (UpdateProfileRequest request, AccountHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UpdateAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Accounts").WithName("UpdateProfile").Produces(204);

        api.MapPut("/me/password", async (ChangePasswordRequest request, AccountHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ChangePasswordAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Accounts").WithName("ChangePassword").Produces(204);

        api.MapPost("/me/author", async (AccountHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.EnableAuthorRoleAsync(cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().RequireRateLimiting("content-write").WithTags("Accounts").WithName("EnableAuthorRole").Produces(204);

        api.MapGet("/users/{userName}", async (string userName, AccountHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.PublicProfileAsync(userName, cancellationToken)).ToHttpResult(context))
            .WithTags("Accounts").WithName("GetPublicProfile").Produces<ProfileDto>();

        api.MapGet("/users/{userName}/stats", async (string userName, AccountHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.PublicProfileStatsAsync(userName, cancellationToken)).ToHttpResult(context))
            .WithTags("Accounts").WithName("GetPublicProfileStats").Produces<PublicProfileStatsDto>();

        api.MapGet("/users/{userName}/followers", async (string userName, int? page, int? pageSize,
            AccountHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowersAsync(userName, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithTags("Accounts").WithName("ListPublicProfileFollowers").Produces<PagedResult<PublicFollowDto>>();

        api.MapGet("/users/{userName}/following", async (string userName, int? page, int? pageSize,
            AccountHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.FollowingAsync(userName, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithTags("Accounts").WithName("ListPublicProfileFollowing").Produces<PagedResult<PublicFollowDto>>();
    }
}
