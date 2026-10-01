using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Nexa.Domain.Common;
using Npgsql;

namespace Nexa.Api.Errors;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        var postgres = exception as PostgresException ?? exception.InnerException as PostgresException;
        var (status, title, code) = exception switch
        {
            DomainException domain => (400, domain.Message, "invalid_domain"),
            BadHttpRequestException badRequest => (badRequest.StatusCode, "The request is invalid.", "invalid_request"),
            DbUpdateConcurrencyException => (409, "The resource changed. Reload before editing.", "stale_version"),
            _ when postgres?.SqlState == PostgresErrorCodes.UniqueViolation => (409, "A unique value is already in use.", "duplicate"),
            _ when postgres?.SqlState == PostgresErrorCodes.ForeignKeyViolation => (409, "The resource is referenced or no longer available.", "relationship_conflict"),
            _ when postgres?.SqlState == PostgresErrorCodes.CheckViolation => (400, "The operation violates a data constraint.", "invalid_data"),
            _ => (500, "An unexpected error occurred.", "server_error")
        };
        if (status == 500)
            logger.LogError(exception, "Unhandled request failure {TraceId}", context.TraceIdentifier);
        await Results.Problem(statusCode: status, title: title,
            extensions: new Dictionary<string, object?> { ["code"] = code, ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
        return true;
    }
}
