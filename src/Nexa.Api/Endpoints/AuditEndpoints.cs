using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Audit;

namespace Nexa.Api.Endpoints;

public static class AuditEndpoints
{
    public static void MapAuditEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/admin/audit-logs", async (int? page, int? pageSize, string? action, string? targetType,
            Guid? actorId, AuditHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListAsync(page, pageSize, action, targetType, actorId, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization("Admin")
            .WithTags("Admin")
            .WithName("AdminListAuditLogs")
            .Produces<PagedResult<AuditLogDto>>();
    }
}
