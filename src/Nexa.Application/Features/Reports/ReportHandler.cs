using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Domain.Auditing;
using Nexa.Domain.Moderation;

namespace Nexa.Application.Features.Reports;

public sealed class ReportHandler(IReportRepository reports, IAuditLogRepository auditLogs, ICurrentUser currentUser,
    IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<Result<CreatedReportDto>> CreateAsync(CreateReportRequest request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<CreatedReportDto>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<CreatedReportDto>.Failure(error);
        if (request.TargetType == ReportTargetType.User && request.TargetId == userId)
            return Result<CreatedReportDto>.Failure(new Error(ErrorType.Conflict, "cannot_report_self", "You cannot report yourself."));
        if (!await reports.TargetExistsAsync(request.TargetType, request.TargetId, cancellationToken))
            return Result<CreatedReportDto>.Failure(Error.Missing("Report target"));
        var report = new Report(userId, request.TargetType, request.TargetId, request.Reason, request.Details, clock.GetUtcNow());
        reports.Add(report);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<CreatedReportDto>.Success(new CreatedReportDto(report.Id));
    }

    public async Task<Result<PagedResult<ReportDto>>> ListAsync(ReportStatus? status, ReportTargetType? targetType,
        Guid? targetId, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<PagedResult<ReportDto>>.Failure(Error.Forbidden);
        return !page.IsValid ? Result<PagedResult<ReportDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ReportDto>>.Success(await reports.ListAsync(status, targetType, targetId, page, cancellationToken));
    }

    public async Task<Result<ReportDto>> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<ReportDto>.Failure(Error.Forbidden);
        var report = await reports.GetAsync(id, cancellationToken);
        return report is null ? Result<ReportDto>.Failure(Error.Missing("Report")) : Result<ReportDto>.Success(report);
    }

    public async Task<Result<ReportTargetPreviewDto>> TargetPreviewAsync(Guid id, CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<ReportTargetPreviewDto>.Failure(Error.Forbidden);
        var preview = await reports.TargetPreviewAsync(id, cancellationToken);
        return preview is null ? Result<ReportTargetPreviewDto>.Failure(Error.Missing("Report target"))
            : Result<ReportTargetPreviewDto>.Success(preview);
    }

    public async Task<Result<PagedResult<ReportDto>>> MineAsync(PageRequest page, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<ReportDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<ReportDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<ReportDto>>.Success(await reports.ListByReporterAsync(userId, page, cancellationToken));
    }

    public async Task<Result<ReportSummaryDto>> SummaryAsync(CancellationToken cancellationToken) =>
        !currentUser.CanModerate ? Result<ReportSummaryDto>.Failure(Error.Forbidden)
        : Result<ReportSummaryDto>.Success(await reports.SummaryAsync(cancellationToken));

    public async Task<Result<Unit>> DecideAsync(Guid id, ReportDecisionRequest request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId || !currentUser.CanModerate)
            return Result<Unit>.Failure(Error.Forbidden);
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        if (request.Status == ReportStatus.Pending)
            return Result<Unit>.Failure(new Error(ErrorType.Validation, "invalid_report_decision", "Decision status must be Accepted or Rejected."));
        var report = await reports.FindAsync(id, cancellationToken);
        if (report is null)
            return Result<Unit>.Failure(Error.Missing("Report"));
        report.Decide(request.Status, userId, request.ResolutionNote, clock.GetUtcNow());
        auditLogs.Add(new AuditLog(userId, "ReportDecided", "Report", report.Id, request.Status.ToString(),
            currentUser.IpAddress, clock.GetUtcNow()));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }
}
