using System.ComponentModel.DataAnnotations;
using Nexa.Domain.Moderation;

namespace Nexa.Application.Features.Reports;

public sealed record CreateReportRequest(
    ReportTargetType TargetType,
    Guid TargetId,
    ReportReason Reason,
    [property: Required(AllowEmptyStrings = true), StringLength(2000)] string Details);

public sealed record ReportDecisionRequest(
    ReportStatus Status,
    [property: Required(AllowEmptyStrings = true), StringLength(2000)] string ResolutionNote = "");

public sealed record ReportDto(
    Guid Id,
    Guid ReporterId,
    string ReporterUserName,
    ReportTargetType TargetType,
    Guid TargetId,
    ReportReason Reason,
    string Details,
    ReportStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ResolvedAtUtc,
    Guid? ResolvedById,
    string ResolutionNote);

public sealed record CreatedReportDto(Guid Id);
public sealed record ReportSummaryDto(int Pending, int Accepted, int Rejected, int Total);
public sealed record ReportTargetPreviewDto(ReportTargetType TargetType, Guid TargetId, string Label, string? Url);
