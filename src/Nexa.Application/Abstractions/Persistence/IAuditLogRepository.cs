using Nexa.Application.Common;
using Nexa.Application.Features.Audit;
using Nexa.Domain.Auditing;

namespace Nexa.Application.Abstractions.Persistence;

public interface IAuditLogRepository
{
    Task<PagedResult<AuditLogDto>> ListAsync(AuditLogFilter filter, CancellationToken cancellationToken);
    void Add(AuditLog auditLog);
}
