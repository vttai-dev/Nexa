using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Nexa.Api.Endpoints;
using Nexa.Api.Errors;
using Nexa.Api.Maintenance;
using Nexa.Api.Security;
using Nexa.Api.Services;
using Nexa.Application;
using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Notifications;
using Nexa.Identity.Authorization;
using Nexa.Infrastructure;

var commandFlags = new[] { "--migrate", "--seed", "--bootstrap-admin" };
var builder = WebApplication.CreateBuilder(args.Where(argument => !commandFlags.Contains(argument)).ToArray());
var contactVerificationRequired = builder.Configuration.GetValue<bool>("AccountMessages:RequireVerifiedContacts");
var localMessageOutboxEnabled = (builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Testing"))
    && builder.Configuration.GetValue<bool>("AccountMessages:UseDevelopmentOutbox");
var emailProviderConfigured = builder.Configuration.GetValue<bool>("AccountMessages:EnableEmailDelivery")
    && Uri.TryCreate(builder.Configuration["AccountMessages:EmailWebhookUrl"], UriKind.Absolute, out var emailProviderUri)
    && emailProviderUri.Scheme == Uri.UriSchemeHttps;
var phoneProviderConfigured = builder.Configuration.GetValue<bool>("AccountMessages:EnablePhoneDelivery")
    && Uri.TryCreate(builder.Configuration["AccountMessages:PhoneWebhookUrl"], UriKind.Absolute, out var phoneProviderUri)
    && phoneProviderUri.Scheme == Uri.UriSchemeHttps;
if (contactVerificationRequired && !localMessageOutboxEnabled && (!emailProviderConfigured || !phoneProviderConfigured))
    throw new InvalidOperationException("Contact verification requires HTTPS email and SMS providers. Configure both providers before enabling AccountMessages:RequireVerifiedContacts.");
var connection = builder.Configuration.GetConnectionString("NexaDb");
if (string.IsNullOrWhiteSpace(connection))
    throw new InvalidOperationException("Configure ConnectionStrings:NexaDb using user-secrets or environment variables.");
if (builder.Environment.IsDevelopment())
    await DevelopmentDatabaseStarter.EnsureStartedAsync(builder.Configuration, connection);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(connection);
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient(nameof(AccountMessageSender));
builder.Services.AddSingleton<DevelopmentMessageOutbox>();
builder.Services.AddSingleton<NotificationEventBus>();
builder.Services.AddSingleton<INotificationRealtimePublisher>(services => services.GetRequiredService<NotificationEventBus>());
builder.Services.AddSingleton<IAccountMessageSender, AccountMessageSender>();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = true);
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("Admin", policy => policy.RequireRole(RoleNames.Admin))
    .AddPolicy("Moderation", policy => policy.RequireRole(RoleNames.Moderator, RoleNames.Admin))
    .AddPolicy("Authoring", policy => policy.RequireRole(RoleNames.Author, RoleNames.Admin));
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "__Host-Nexa.Csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = builder.Environment.IsDevelopment() ? SameSiteMode.None : SameSiteMode.Strict;
});
if (builder.Environment.IsDevelopment())
{
    builder.Services.ConfigureApplicationCookie(options => options.Cookie.SameSite = SameSiteMode.None);
}
builder.Services.AddHealthChecks().AddCheck<PostgresHealthCheck>("postgres", tags: ["ready"]);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = builder.Configuration.GetValue("RateLimits:AuthPermitLimit", 10),
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.AddPolicy("availability", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.AddPolicy("search", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = builder.Configuration.GetValue("RateLimits:SearchPermitLimit", 60),
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.AddPolicy("content-write", context => RateLimitPartition.GetFixedWindowLimiter(
        context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = builder.Configuration.GetValue("RateLimits:WritePermitLimit", 30),
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.OnRejected = (context, cancellationToken) =>
        new ValueTask(Results.Problem(statusCode: 429, title: "Too many requests.",
            extensions: new Dictionary<string, object?> { ["traceId"] = context.HttpContext.TraceIdentifier })
            .ExecuteAsync(context.HttpContext));
});
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
{
    if (allowedOrigins.Length > 0)
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
}));
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 26 * 1024 * 1024);

var app = builder.Build();
if (args.Any(commandFlags.Contains))
{
    await MaintenanceCommands.RunAsync(app, args);
    return;
}

app.UseExceptionHandler();
if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
    app.UseHsts();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();
app.UseRateLimiter();

if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("AccountMessages:UseDevelopmentOutbox"))
    app.MapOpenApi();
app.MapGet("/", () => Results.Ok(new { name = "Nexa.Platform", api = "/api/v1", docs = "/openapi/v1.json" }));
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });

var api = app.MapGroup("/api/v1").AddEndpointFilter<CsrfFilter>();
api.MapAuthEndpoints();
if (app.Environment.IsDevelopment())
    api.MapGet("/auth/dev/outbox", (HttpContext context, string? recipient, DevelopmentMessageOutbox outbox) =>
    {
        if (context.Connection.RemoteIpAddress is { } address && !System.Net.IPAddress.IsLoopback(address))
            return Results.NotFound();
        return Results.Ok(outbox.Read(recipient));
    }).RequireRateLimiting("auth").WithTags("Authentication").WithName("ReadDevelopmentMessageOutbox");
api.MapAdminEndpoints();
api.MapAuditEndpoints();
api.MapProfileEndpoints();
api.MapStatsEndpoints();
api.MapSearchEndpoints();
api.MapArticleEndpoints();
api.MapArticleSeriesEndpoints();
api.MapArticleReviewEndpoints();
api.MapCategoryEndpoints();
api.MapTagEndpoints();
api.MapCommentEndpoints();
api.MapEngagementEndpoints();
api.MapNotificationEndpoints();
api.MapReportEndpoints();
api.MapMediaEndpoints();
app.Run();

public partial class Program;
