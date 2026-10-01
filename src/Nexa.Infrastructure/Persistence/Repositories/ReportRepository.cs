using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Reports;
using Nexa.Domain.Articles;
using Nexa.Domain.Moderation;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class ReportRepository(NexaDbContext database) : IReportRepository
{
    public Task<bool> TargetExistsAsync(ReportTargetType targetType, Guid targetId, CancellationToken cancellationToken) =>
        targetType switch
        {
            ReportTargetType.Article => database.Articles.AnyAsync(article => article.Id == targetId
                && article.Status == ArticleStatus.Published, cancellationToken),
            ReportTargetType.Comment => database.Comments.AnyAsync(comment => comment.Id == targetId, cancellationToken),
            ReportTargetType.User => database.Users.AnyAsync(user => user.Id == targetId, cancellationToken),
            _ => Task.FromResult(false)
        };

    public async Task<PagedResult<ReportDto>> ListAsync(ReportStatus? status, ReportTargetType? targetType, Guid? targetId,
        PageRequest page, CancellationToken cancellationToken)
    {
        var query = database.Reports.AsNoTracking();
        if (status.HasValue)
            query = query.Where(report => report.Status == status.Value);
        if (targetType.HasValue)
            query = query.Where(report => report.TargetType == targetType.Value);
        if (targetId.HasValue)
            query = query.Where(report => report.TargetId == targetId.Value);
        query = query.OrderByDescending(report => report.CreatedAtUtc).ThenByDescending(report => report.Id);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(page.Offset).Take(page.PageSize)
            .Select(report => new ReportDto(
                report.Id,
                report.ReporterId,
                database.Users.Where(user => user.Id == report.ReporterId).Select(user => user.UserName!).First(),
                report.TargetType,
                report.TargetId,
                report.Reason,
                report.Details,
                report.Status,
                report.CreatedAtUtc,
                report.ResolvedAtUtc,
                report.ResolvedById,
                report.ResolutionNote))
            .ToListAsync(cancellationToken);
        return new PagedResult<ReportDto>(items, page.Page, page.PageSize, total);
    }

    public async Task<PagedResult<ReportDto>> ListByReporterAsync(Guid reporterId, PageRequest page, CancellationToken cancellationToken)
    {
        var query = database.Reports.AsNoTracking().Where(report => report.ReporterId == reporterId)
            .OrderByDescending(report => report.CreatedAtUtc).ThenByDescending(report => report.Id);
        var total = await query.CountAsync(cancellationToken);
        var items = await ReportDtos(query).Skip(page.Offset).Take(page.PageSize).ToListAsync(cancellationToken);
        return new PagedResult<ReportDto>(items, page.Page, page.PageSize, total);
    }

    public Task<ReportDto?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        ReportDtos(database.Reports.AsNoTracking().Where(report => report.Id == id)).SingleOrDefaultAsync(cancellationToken);

    public async Task<ReportTargetPreviewDto?> TargetPreviewAsync(Guid id, CancellationToken cancellationToken)
    {
        var report = await database.Reports.AsNoTracking().Where(item => item.Id == id)
            .Select(item => new { item.TargetType, item.TargetId }).SingleOrDefaultAsync(cancellationToken);
        if (report is null)
            return null;
        return report.TargetType switch
        {
            ReportTargetType.Article => await database.Articles.AsNoTracking()
                .Where(article => article.Id == report.TargetId)
                .Select(article => new ReportTargetPreviewDto(report.TargetType, report.TargetId, article.Title,
                    $"/articles/{article.Slug}"))
                .SingleOrDefaultAsync(cancellationToken),
            ReportTargetType.Comment => await database.Comments.AsNoTracking()
                .Where(comment => comment.Id == report.TargetId)
                .Select(comment => new ReportTargetPreviewDto(report.TargetType, report.TargetId,
                    comment.Body.Length > 120 ? comment.Body.Substring(0, 120) : comment.Body,
                    database.Articles.Where(article => article.Id == comment.ArticleId).Select(article => "/articles/" + article.Slug).First()))
                .SingleOrDefaultAsync(cancellationToken),
            ReportTargetType.User => await database.Users.AsNoTracking()
                .Where(user => user.Id == report.TargetId)
                .Select(user => new ReportTargetPreviewDto(report.TargetType, report.TargetId, user.UserName!,
                    "/users/" + user.UserName))
                .SingleOrDefaultAsync(cancellationToken),
            _ => null
        };
    }

    public async Task<ReportSummaryDto> SummaryAsync(CancellationToken cancellationToken)
    {
        var pending = await database.Reports.CountAsync(report => report.Status == ReportStatus.Pending, cancellationToken);
        var accepted = await database.Reports.CountAsync(report => report.Status == ReportStatus.Accepted, cancellationToken);
        var rejected = await database.Reports.CountAsync(report => report.Status == ReportStatus.Rejected, cancellationToken);
        return new ReportSummaryDto(pending, accepted, rejected, pending + accepted + rejected);
    }

    public Task<Report?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        database.Reports.SingleOrDefaultAsync(report => report.Id == id, cancellationToken);

    public void Add(Report report) => database.Reports.Add(report);

    private IQueryable<ReportDto> ReportDtos(IQueryable<Report> query) => query.Select(report => new ReportDto(
        report.Id,
        report.ReporterId,
        database.Users.Where(user => user.Id == report.ReporterId).Select(user => user.UserName!).First(),
        report.TargetType,
        report.TargetId,
        report.Reason,
        report.Details,
        report.Status,
        report.CreatedAtUtc,
        report.ResolvedAtUtc,
        report.ResolvedById,
        report.ResolutionNote));
}
