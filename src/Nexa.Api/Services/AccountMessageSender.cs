using System.Net.Http.Headers;
using System.Net.Http.Json;
using Nexa.Application.Abstractions.Identity;

namespace Nexa.Api.Services;

public sealed class AccountMessageSender(IHttpClientFactory clients, IConfiguration configuration,
    IHostEnvironment environment, DevelopmentMessageOutbox outbox, ILogger<AccountMessageSender> logger)
    : IAccountMessageSender
{
    public bool CanSendEmail => UseDevelopmentOutbox
        || (configuration.GetValue<bool>("AccountMessages:EnableEmailDelivery")
            && IsHttpsEndpoint(configuration["AccountMessages:EmailWebhookUrl"]));
    public bool CanSendPhone => UseDevelopmentOutbox
        || (configuration.GetValue<bool>("AccountMessages:EnablePhoneDelivery")
            && IsHttpsEndpoint(configuration["AccountMessages:PhoneWebhookUrl"]));

    public Task SendEmailVerificationAsync(string email, string token, CancellationToken cancellationToken) =>
        SendAsync("email", email, "Xác minh email Nexa", $"Mã xác minh email của bạn: {token}", cancellationToken);

    public Task SendPhoneVerificationAsync(string phoneNumber, string token, CancellationToken cancellationToken) =>
        SendAsync("phone", phoneNumber, "Xác minh số điện thoại Nexa", $"Mã xác minh số điện thoại Nexa: {token}", cancellationToken);

    public Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken) =>
        SendAsync("email", email, "Đặt lại mật khẩu Nexa", $"Mã đặt lại mật khẩu của bạn: {token}", cancellationToken);

    private async Task SendAsync(string channel, string recipient, string subject, string body,
        CancellationToken cancellationToken)
    {
        if (UseDevelopmentOutbox)
        {
            outbox.Add(new DevelopmentMessage(channel, recipient, subject, body, DateTimeOffset.UtcNow));
            logger.LogInformation("Local {Channel} message queued for {Recipient}: {Body}", channel, recipient, body);
            return;
        }

        var key = channel == "phone" ? "AccountMessages:PhoneWebhookUrl" : "AccountMessages:EmailWebhookUrl";
        var endpoint = configuration[key];
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw new InvalidOperationException($"Configure {key} with an HTTPS message-provider endpoint.");
        using var request = new HttpRequestMessage(HttpMethod.Post, uri)
        {
            Content = JsonContent.Create(new { channel, to = recipient, subject, message = body })
        };
        var bearer = configuration["AccountMessages:WebhookBearerToken"];
        if (!string.IsNullOrWhiteSpace(bearer))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
        using var response = await clients.CreateClient(nameof(AccountMessageSender)).SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private bool UseDevelopmentOutbox =>
        (environment.IsDevelopment() || environment.IsEnvironment("Testing"))
        && configuration.GetValue<bool>("AccountMessages:UseDevelopmentOutbox");

    private static bool IsHttpsEndpoint(string? endpoint) =>
        Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;
}
