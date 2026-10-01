using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Common;

namespace Nexa.Application.Features.Accounts;

public sealed class VerificationHandler(IIdentityService identity, IAccountMessageSender sender)
{
    public async Task<Result<Unit>> RequestEmailVerificationAsync(EmailAddressRequest request,
        CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        if (!sender.CanSendEmail)
            return Result<Unit>.Failure(MessageDeliveryNotConfigured("email"));
        var token = await identity.CreateEmailConfirmationTokenAsync(request.Email, cancellationToken);
        if (token is not null)
            await sender.SendEmailVerificationAsync(request.Email, token, cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        return await identity.ConfirmEmailAsync(request.Email, request.Token, cancellationToken);
    }

    public async Task<Result<Unit>> RequestPhoneVerificationAsync(PhoneVerificationRequest request,
        CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        if (!sender.CanSendPhone)
            return Result<Unit>.Failure(MessageDeliveryNotConfigured("SMS"));
        var issued = await identity.CreatePhoneVerificationTokenAsync(request.Email, cancellationToken);
        if (issued is not null)
            await sender.SendPhoneVerificationAsync(issued.Value.PhoneNumber, issued.Value.Token, cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> ConfirmPhoneAsync(ConfirmPhoneRequest request, CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        return await identity.ConfirmPhoneAsync(request.Email, request.Token, cancellationToken);
    }

    public async Task<Result<Unit>> RequestPasswordResetAsync(EmailAddressRequest request,
        CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        if (!sender.CanSendEmail)
            return Result<Unit>.Failure(MessageDeliveryNotConfigured("email"));
        var token = await identity.CreatePasswordResetTokenAsync(request.Email, cancellationToken);
        if (token is not null)
            await sender.SendPasswordResetAsync(request.Email, token, cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> ResetPasswordAsync(ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        return await identity.ResetPasswordAsync(request.Email, request.Token, request.NewPassword, cancellationToken);
    }

    private static Error MessageDeliveryNotConfigured(string channel) =>
        new(ErrorType.Conflict, "message_delivery_not_configured",
            $"{channel} delivery is not enabled. Configure a real provider before requesting a message.");
}
