using Nexa.Application.Common;
using Nexa.Application.Features.Reports;
using Nexa.Domain.Moderation;

namespace Nexa.Application.Abstractions.Persistence;

public interface IReportRepository
{
    Task<bool> TargetExistsAsync(ReportTargetType targetType, Guid targetId, CancellationToken cancellationToken);
    Task<PagedResult<ReportDto>> ListAsync(ReportStatus? status, ReportTargetType? targetType, Guid? targetId, PageRequest page,
        CancellationToken cancellationToken);
    Task<PagedResult<ReportDto>> ListByReporterAsync(Guid reporterId, PageRequest page, CancellationToken cancellationToken);
    Task<ReportDto?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task<ReportTargetPreviewDto?> TargetPreviewAsync(Guid id, CancellationToken cancellationToken);
    Task<ReportSummaryDto> SummaryAsync(CancellationToken cancellationToken);
    Task<Report?> FindAsync(Guid id, CancellationToken cancellationToken);
    void Add(Report report);
}
