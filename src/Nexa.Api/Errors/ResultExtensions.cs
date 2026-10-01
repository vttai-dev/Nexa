using Nexa.Application.Common;

namespace Nexa.Api.Errors;

public static class ResultExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result, HttpContext context, Func<T, IResult>? success = null)
    {
        if (result.Error is { } error)
        {
            var status = error.Type switch
            {
                ErrorType.Validation => 400,
                ErrorType.Unauthorized => 401,
                ErrorType.Forbidden => 403,
                ErrorType.NotFound => 404,
                ErrorType.Conflict => 409,
                _ => 500
            };
            return Results.Problem(statusCode: status, title: error.Message,
                extensions: new Dictionary<string, object?> { ["code"] = error.Code, ["traceId"] = context.TraceIdentifier });
        }
        if (success is not null)
            return success(result.Value!);
        return result.Value is Unit ? Results.NoContent() : Results.Ok(result.Value);
    }
}
