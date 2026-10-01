using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;

namespace Nexa.Application.Features.Audit;

public sealed class AuditHandler(IAuditLogRepository auditLogs, ICurrentUser currentUser)
{
    public async Task<Result<PagedResult<AuditLogDto>>> ListAsync(int? page, int? pageSize, string? action,
        string? targetType, Guid? actorId, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<PagedResult<AuditLogDto>>.Failure(Error.Forbidden);
        var pageRequest = new PageRequest(page ?? 1, pageSize ?? 20);
        return !pageRequest.IsValid ? Result<PagedResult<AuditLogDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<AuditLogDto>>.Success(await auditLogs.ListAsync(
                new AuditLogFilter(pageRequest, action, targetType, actorId), cancellationToken));
    }
}
