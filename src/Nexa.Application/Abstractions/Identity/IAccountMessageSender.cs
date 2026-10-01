namespace Nexa.Application.Abstractions.Identity;

public interface IAccountMessageSender
{
    bool CanSendEmail { get; }
    bool CanSendPhone { get; }
    Task SendEmailVerificationAsync(string email, string token, CancellationToken cancellationToken);
    Task SendPhoneVerificationAsync(string phoneNumber, string token, CancellationToken cancellationToken);
    Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken);
}
