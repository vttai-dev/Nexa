using Microsoft.AspNetCore.Antiforgery;
using Nexa.Api.Errors;
using Nexa.Application.Features.Accounts;

namespace Nexa.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this RouteGroupBuilder api)
    {
        var auth = api.MapGroup("/auth").WithTags("Authentication");
        auth.MapGet("/csrf", (IAntiforgery antiforgery, HttpContext context) =>
        {
            context.Response.Headers.CacheControl = "no-store";
            var tokens = antiforgery.GetAndStoreTokens(context);
            return Results.Ok(new { requestToken = tokens.RequestToken, headerName = "X-CSRF-TOKEN" });
        }).WithName("GetCsrfToken");

        auth.MapGet("/availability/user-name/{userName}", async (string userName, AccountHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UserNameAvailabilityAsync(userName, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("availability").WithName("CheckUserNameAvailability").Produces<AccountAvailabilityDto>();

        auth.MapGet("/availability/email", async (string email, AccountHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.EmailAvailabilityAsync(email, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("availability").WithName("CheckEmailAvailability").Produces<AccountAvailabilityDto>();

        auth.MapPost("/register", async (RegisterRequest request, RegisterHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.HandleAsync(request, cancellationToken)).ToHttpResult(context, registered => Results.Json(registered, statusCode: 201)))
            .RequireRateLimiting("auth").WithName("Register").Produces<RegisteredDto>(201);

        auth.MapPost("/email/verification", async (EmailAddressRequest request, VerificationHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RequestEmailVerificationAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("auth").WithName("RequestEmailVerification").Produces(204);

        auth.MapPost("/email/verification/confirm", async (ConfirmEmailRequest request, VerificationHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ConfirmEmailAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("auth").WithName("ConfirmEmailVerification").Produces(204);

        auth.MapPost("/phone/verification", async (PhoneVerificationRequest request, VerificationHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RequestPhoneVerificationAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("auth").WithName("RequestPhoneVerification").Produces(204);

        auth.MapPost("/phone/verification/confirm", async (ConfirmPhoneRequest request, VerificationHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ConfirmPhoneAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("auth").WithName("ConfirmPhoneVerification").Produces(204);

        auth.MapPost("/password/forgot", async (EmailAddressRequest request, VerificationHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.RequestPasswordResetAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("auth").WithName("RequestPasswordReset").Produces(204);

        auth.MapPost("/password/reset", async (ResetPasswordRequest request, VerificationHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ResetPasswordAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("auth").WithName("ResetPassword").Produces(204);

        auth.MapPost("/login", async (LoginRequest request, AccountHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.LoginAsync(request, cancellationToken)).ToHttpResult(context))
            .RequireRateLimiting("auth").WithName("Login").Produces(204);

        auth.MapPost("/logout", async (AccountHandler handler) =>
        {
            await handler.LogoutAsync();
            return Results.NoContent();
        }).RequireAuthorization().WithName("Logout").Produces(204);
    }
}
