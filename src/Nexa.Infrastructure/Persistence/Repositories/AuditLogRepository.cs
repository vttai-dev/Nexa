using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Audit;
using Nexa.Domain.Auditing;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class AuditLogRepository(NexaDbContext database) : IAuditLogRepository
{
    public async Task<PagedResult<AuditLogDto>> ListAsync(AuditLogFilter filter, CancellationToken cancellationToken)
    {
        var query = database.AuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filter.Action))
            query = query.Where(log => log.Action == filter.Action.Trim());
        if (!string.IsNullOrWhiteSpace(filter.TargetType))
            query = query.Where(log => log.TargetType == filter.TargetType.Trim());
        if (filter.ActorId.HasValue)
            query = query.Where(log => log.ActorId == filter.ActorId.Value);
        query = query.OrderByDescending(log => log.CreatedAtUtc).ThenByDescending(log => log.Id);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(filter.Page.Offset).Take(filter.Page.PageSize)
            .Select(log => new AuditLogDto(
                log.Id,
                log.ActorId,
                database.Users.Where(user => user.Id == log.ActorId).Select(user => user.UserName!).First(),
                log.Action,
                log.TargetType,
                log.TargetId,
                log.Details,
                log.IpAddress,
                log.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        return new PagedResult<AuditLogDto>(items, filter.Page.Page, filter.Page.PageSize, total);
    }

    public void Add(AuditLog auditLog) => database.AuditLogs.Add(auditLog);
}
