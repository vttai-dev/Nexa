using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Abstractions.Identity;
using Nexa.Identity.Entities;
using Nexa.Identity.Services;

namespace Nexa.Identity;

public static class DependencyInjection
{
    public static IdentityBuilder AddNexaIdentity(this IServiceCollection services)
    {
        var builder = services.AddIdentity<User, Role>(options =>
        {
            options.Password.RequiredLength = 12;
            options.Password.RequiredUniqueChars = 4;
            options.User.RequireUniqueEmail = true;
            options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        }).AddDefaultTokenProviders();

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = "__Host-Nexa.Session";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.ExpireTimeSpan = TimeSpan.FromHours(8);
            options.SlidingExpiration = true;
            options.Events.OnRedirectToLogin = context => WriteErrorAsync(context.HttpContext, 401, "Authentication is required.");
            options.Events.OnRedirectToAccessDenied = context => WriteErrorAsync(context.HttpContext, 403, "Access is denied.");
        });
        services.Configure<SecurityStampValidatorOptions>(options => options.ValidationInterval = TimeSpan.Zero);
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IAdminService, AdminService>();
        return builder;
    }

    private static Task WriteErrorAsync(HttpContext context, int status, string title) =>
        Results.Problem(statusCode: status, title: title,
            extensions: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
}
