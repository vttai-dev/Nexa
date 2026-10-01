using Nexa.Domain.Common;

namespace Nexa.Domain.Moderation;

public sealed class Report : Entity
{
    private Report() { }

    public Report(Guid reporterId, ReportTargetType targetType, Guid targetId, ReportReason reason,
        string details, DateTimeOffset now)
    {
        ReporterId = Guard.Identifier(reporterId, "Reporter");
        TargetType = targetType;
        TargetId = Guard.Identifier(targetId, "Target");
        Reason = reason;
        Details = Guard.Text(details, 2000, "Report details");
        Status = ReportStatus.Pending;
        CreatedAtUtc = now;
    }

    public Guid ReporterId { get; private set; }
    public ReportTargetType TargetType { get; private set; }
    public Guid TargetId { get; private set; }
    public ReportReason Reason { get; private set; }
    public string Details { get; private set; } = "";
    public ReportStatus Status { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset? ResolvedAtUtc { get; private set; }
    public Guid? ResolvedById { get; private set; }
    public string ResolutionNote { get; private set; } = "";

    public void Decide(ReportStatus status, Guid resolverId, string resolutionNote, DateTimeOffset now)
    {
        if (Status != ReportStatus.Pending)
            throw new DomainException("This report has already been resolved.");
        if (status == ReportStatus.Pending)
            throw new DomainException("A report decision must resolve or reject the report.");
        Status = status;
        ResolvedById = Guard.Identifier(resolverId, "Resolver");
        ResolutionNote = Guard.Text(resolutionNote, 2000, "Resolution note");
        ResolvedAtUtc = now;
    }
}
