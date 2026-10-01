using Nexa.Domain.Common;

namespace Nexa.Domain.Auditing;

public sealed class AuditLog : Entity
{
    private AuditLog() { }

    public AuditLog(Guid actorId, string action, string targetType, Guid? targetId, string details,
        string ipAddress, DateTimeOffset now)
    {
        ActorId = Guard.Identifier(actorId, "Actor");
        Action = Guard.Required(action, 100, "Audit action");
        TargetType = Guard.Required(targetType, 80, "Audit target type");
        TargetId = targetId == Guid.Empty ? null : targetId;
        Details = Guard.Text(details, 2000, "Audit details");
        IpAddress = Guard.Text(ipAddress, 64, "IP address");
        CreatedAtUtc = now;
    }

    public Guid ActorId { get; private set; }
    public string Action { get; private set; } = "";
    public string TargetType { get; private set; } = "";
    public Guid? TargetId { get; private set; }
    public string Details { get; private set; } = "";
    public string IpAddress { get; private set; } = "";
    public DateTimeOffset CreatedAtUtc { get; private set; }
}
