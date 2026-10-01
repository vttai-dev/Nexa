using Nexa.Application.Common;
using Nexa.Application.Features.Accounts;

namespace Nexa.Application.Abstractions.Identity;

public interface IIdentityService
{
    Task<Result<Guid>> CreateUserAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<Result<Unit>> EnableAuthorRoleAsync(Guid userId, CancellationToken cancellationToken);
    Task<Result<Unit>> SignInAsync(LoginRequest request, CancellationToken cancellationToken);
    Task SignOutAsync();
    Task<Result<Unit>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken);
    Task<string?> CreateEmailConfirmationTokenAsync(string email, CancellationToken cancellationToken);
    Task<Result<Unit>> ConfirmEmailAsync(string email, string token, CancellationToken cancellationToken);
    Task<(string PhoneNumber, string Token)?> CreatePhoneVerificationTokenAsync(string email, CancellationToken cancellationToken);
    Task<Result<Unit>> ConfirmPhoneAsync(string email, string token, CancellationToken cancellationToken);
    Task<string?> CreatePasswordResetTokenAsync(string email, CancellationToken cancellationToken);
    Task<Result<Unit>> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken);
    Task<AccountDto?> FindAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> UserNameAvailableAsync(string userName, CancellationToken cancellationToken);
    Task<bool> EmailAvailableAsync(string email, CancellationToken cancellationToken);
}
