using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Domain.Accounts;

namespace Nexa.Application.Features.Accounts;

public sealed class RegisterHandler(IIdentityService identity, IProfileRepository profiles, IUnitOfWork unitOfWork,
    TimeProvider clock, IAccountMessageSender? messageSender = null)
{
    public async Task<Result<RegisteredDto>> HandleAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<RegisteredDto>.Failure(error);

        var result = await unitOfWork.InTransactionAsync(async () =>
        {
            var account = await identity.CreateUserAsync(request, cancellationToken);
            if (!account.IsSuccess)
                return Result<RegisteredDto>.Failure(account.Error!);
            profiles.Add(new Profile(account.Value, request.DisplayName, clock.GetUtcNow()));
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return Result<RegisteredDto>.Success(new RegisteredDto(account.Value));
        }, cancellationToken);
        if (result.IsSuccess)
        {
            var emailToken = messageSender?.CanSendEmail == true
                ? await identity.CreateEmailConfirmationTokenAsync(request.Email, cancellationToken)
                : null;
            var phoneToken = messageSender?.CanSendPhone == true
                ? await identity.CreatePhoneVerificationTokenAsync(request.Email, cancellationToken)
                : null;
            if (emailToken is not null && messageSender is not null)
                await messageSender.SendEmailVerificationAsync(request.Email, emailToken, cancellationToken);
            if (phoneToken is not null && messageSender is not null)
                await messageSender.SendPhoneVerificationAsync(phoneToken.Value.PhoneNumber, phoneToken.Value.Token, cancellationToken);
        }
        return result;
    }
}
