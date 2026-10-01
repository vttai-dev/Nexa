using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Admin;

namespace Nexa.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this RouteGroupBuilder api)
    {
        var admin = api.MapGroup("/admin").RequireAuthorization("Admin").WithTags("Admin");

        admin.MapGet("/users", async (int? page, int? pageSize, string? search, AdminHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListUsersAsync(page, pageSize, search, cancellationToken)).ToHttpResult(context))
            .WithName("AdminListUsers").Produces<PagedResult<AdminUserSummaryDto>>();

        admin.MapGet("/users/{id:guid}", async (Guid id, AdminHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.GetUserAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("AdminGetUser").Produces<AdminUserDto>();

        admin.MapGet("/users/{id:guid}/activity", async (Guid id, AdminHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.GetUserActivityAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("AdminGetUserActivity").Produces<AdminUserActivityStatsDto>();

        admin.MapPut("/users/{id:guid}/roles", async (Guid id, UpdateUserRolesRequest request, AdminHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UpdateRolesAsync(id, request, cancellationToken)).ToHttpResult(context))
            .WithName("AdminUpdateUserRoles").Produces(204);

        admin.MapPost("/users/{id:guid}/lock", async (Guid id, LockUserRequest request, AdminHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.LockUserAsync(id, request, cancellationToken)).ToHttpResult(context))
            .WithName("AdminLockUser").Produces(204);

        admin.MapPost("/users/{id:guid}/unlock", async (Guid id, AdminHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UnlockUserAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("AdminUnlockUser").Produces(204);
    }
}
