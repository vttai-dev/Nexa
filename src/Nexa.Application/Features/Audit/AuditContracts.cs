using Nexa.Application.Common;

namespace Nexa.Application.Features.Audit;

public sealed record AuditLogFilter(PageRequest Page, string? Action = null, string? TargetType = null, Guid? ActorId = null);

public sealed record AuditLogDto(
    Guid Id,
    Guid ActorId,
    string ActorUserName,
    string Action,
    string TargetType,
    Guid? TargetId,
    string Details,
    string IpAddress,
    DateTimeOffset CreatedAtUtc);
