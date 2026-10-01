using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Reports;
using Nexa.Domain.Moderation;

namespace Nexa.Api.Endpoints;

public static class ReportEndpoints
{
    public static void MapReportEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/reports", async (CreateReportRequest request, ReportHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.CreateAsync(request, cancellationToken)).ToHttpResult(context,
                created => Results.Json(created, statusCode: 201)))
            .RequireAuthorization().WithTags("Reports").WithName("CreateReport").Produces<CreatedReportDto>(201);

        api.MapGet("/me/reports", async (int? page, int? pageSize, ReportHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.MineAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Reports").WithName("ListMyReports").Produces<PagedResult<ReportDto>>();

        var moderation = api.MapGroup("/moderation/reports").RequireAuthorization("Moderation").WithTags("Moderation");
        moderation.MapGet("/", async (ReportStatus? status, ReportTargetType? targetType, Guid? targetId,
            int? page, int? pageSize, ReportHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListAsync(status, targetType, targetId, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken))
            .ToHttpResult(context))
            .WithName("ListReports").Produces<PagedResult<ReportDto>>();

        moderation.MapGet("/summary", async (ReportHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.SummaryAsync(cancellationToken)).ToHttpResult(context))
            .WithName("GetReportSummary").Produces<ReportSummaryDto>();

        moderation.MapGet("/{id:guid}", async (Guid id, ReportHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.GetAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("GetReport").Produces<ReportDto>();

        moderation.MapGet("/{id:guid}/target", async (Guid id, ReportHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.TargetPreviewAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("GetReportTargetPreview").Produces<ReportTargetPreviewDto>();

        moderation.MapPut("/{id:guid}/decision", async (Guid id, ReportDecisionRequest request, ReportHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.DecideAsync(id, request, cancellationToken)).ToHttpResult(context))
            .WithName("DecideReport").Produces(204);
    }
}
