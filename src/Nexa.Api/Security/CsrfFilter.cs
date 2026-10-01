using Microsoft.AspNetCore.Antiforgery;

namespace Nexa.Api.Security;

public sealed class CsrfFilter(IAntiforgery antiforgery) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var method = context.HttpContext.Request.Method;
        if (!HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && !HttpMethods.IsOptions(method))
        {
            try
            {
                await antiforgery.ValidateRequestAsync(context.HttpContext);
            }
            catch (AntiforgeryValidationException)
            {
                return Results.Problem(statusCode: 400, title: "A valid CSRF token is required.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "invalid_csrf",
                        ["traceId"] = context.HttpContext.TraceIdentifier
                    });
            }
        }
        return await next(context);
    }
}
