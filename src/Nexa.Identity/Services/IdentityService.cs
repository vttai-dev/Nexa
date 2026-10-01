using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Common;
using Nexa.Application.Features.Accounts;
using Nexa.Identity.Authorization;
using Nexa.Identity.Entities;

namespace Nexa.Identity.Services;

public sealed class IdentityService(UserManager<User> users, SignInManager<User> signIn, RoleManager<Role> roles,
    TimeProvider clock, IConfiguration configuration) : IIdentityService
{
    public async Task<Result<Guid>> CreateUserAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = new User
        {
            Id = Guid.CreateVersion7(),
            UserName = request.UserName.Trim(),
            Email = request.Email.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            CreatedAtUtc = clock.GetUtcNow()
        };
        var created = await users.CreateAsync(user, request.Password);
        if (!created.Succeeded)
            return Result<Guid>.Failure(AccountError(created));
        await AssignMemberAsync(user);
        return Result<Guid>.Success(user.Id);
    }

    public async Task<Result<Unit>> EnableAuthorRoleAsync(Guid userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<Unit>.Failure(Error.Missing("Account"));

        var userRoles = await users.GetRolesAsync(user);
        if (userRoles.Contains(RoleNames.Author, StringComparer.Ordinal) || userRoles.Contains(RoleNames.Admin, StringComparer.Ordinal))
            return Result<Unit>.Success(Unit.Value);

        if (!await roles.RoleExistsAsync(RoleNames.Author))
        {
            var createdRole = await roles.CreateAsync(new Role { Id = Guid.CreateVersion7(), Name = RoleNames.Author });
            if (!createdRole.Succeeded && !await roles.RoleExistsAsync(RoleNames.Author))
                return Result<Unit>.Failure(new Error(ErrorType.Conflict, "author_role_assignment_failed", "Could not enable author access."));
        }

        var assigned = await users.AddToRoleAsync(user, RoleNames.Author);
        if (!assigned.Succeeded && !await users.IsInRoleAsync(user, RoleNames.Author))
            return Result<Unit>.Failure(new Error(ErrorType.Conflict, "author_role_assignment_failed", "Could not enable author access."));

        await signIn.RefreshSignInAsync(user);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> SignInAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(request.Email.Trim());
        if (user is null)
            return Result<Unit>.Failure(InvalidLogin);
        if (configuration.GetValue<bool>("AccountMessages:RequireVerifiedContacts")
            && (!user.EmailConfirmed || !user.PhoneNumberConfirmed))
            return Result<Unit>.Failure(VerificationRequired);
        var result = await signIn.PasswordSignInAsync(user, request.Password, isPersistent: false, lockoutOnFailure: true);
        return result.Succeeded ? Result<Unit>.Success(Unit.Value) : Result<Unit>.Failure(InvalidLogin);
    }

    public Task SignOutAsync() => signIn.SignOutAsync();

    public async Task<Result<Unit>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<Unit>.Failure(Error.Missing("Account"));
        var changed = await users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!changed.Succeeded)
            return Result<Unit>.Failure(AccountError(changed));
        await users.UpdateSecurityStampAsync(user);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<string?> CreateEmailConfirmationTokenAsync(string email, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email.Trim());
        return user is null || user.EmailConfirmed ? null : await users.GenerateEmailConfirmationTokenAsync(user);
    }

    public async Task<Result<Unit>> ConfirmEmailAsync(string email, string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email.Trim());
        if (user is null)
            return Result<Unit>.Failure(InvalidVerification);
        var result = await users.ConfirmEmailAsync(user, token);
        return result.Succeeded ? Result<Unit>.Success(Unit.Value) : Result<Unit>.Failure(InvalidVerification);
    }

    public async Task<(string PhoneNumber, string Token)?> CreatePhoneVerificationTokenAsync(string email,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email.Trim());
        if (user is null || user.PhoneNumberConfirmed || string.IsNullOrWhiteSpace(user.PhoneNumber))
            return null;
        var token = await users.GenerateChangePhoneNumberTokenAsync(user, user.PhoneNumber);
        return (user.PhoneNumber, token);
    }

    public async Task<Result<Unit>> ConfirmPhoneAsync(string email, string token, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email.Trim());
        if (user is null || string.IsNullOrWhiteSpace(user.PhoneNumber))
            return Result<Unit>.Failure(InvalidVerification);
        var result = await users.ChangePhoneNumberAsync(user, user.PhoneNumber, token);
        return result.Succeeded ? Result<Unit>.Success(Unit.Value) : Result<Unit>.Failure(InvalidVerification);
    }

    public async Task<string?> CreatePasswordResetTokenAsync(string email, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email.Trim());
        return user is null ? null : await users.GeneratePasswordResetTokenAsync(user);
    }

    public async Task<Result<Unit>> ResetPasswordAsync(string email, string token, string newPassword,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByEmailAsync(email.Trim());
        if (user is null)
            return Result<Unit>.Failure(InvalidVerification);
        var result = await users.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
            return Result<Unit>.Failure(InvalidVerification);
        await users.UpdateSecurityStampAsync(user);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<AccountDto?> FindAsync(Guid userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId.ToString());
        return user is null ? null : new AccountDto(user.Id, user.UserName!, user.Email!, user.PhoneNumber,
            user.EmailConfirmed, user.PhoneNumberConfirmed, (await users.GetRolesAsync(user)).ToArray());
    }

    public async Task<bool> ExistsAsync(Guid userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await users.FindByIdAsync(userId.ToString()) is not null;
    }

    public async Task<bool> UserNameAvailableAsync(string userName, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await users.FindByNameAsync(userName.Trim()) is null;
    }

    public async Task<bool> EmailAvailableAsync(string email, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await users.FindByEmailAsync(email.Trim()) is null;
    }

    private async Task AssignMemberAsync(User user)
    {
        var assigned = await users.AddToRoleAsync(user, RoleNames.Member);
        if (!assigned.Succeeded)
            throw new InvalidOperationException("Could not assign the default membership role.");
    }

    private static Error AccountError(IdentityResult result)
    {
        var duplicate = result.Errors.Any(error => error.Code is "DuplicateUserName" or "DuplicateEmail");
        return new Error(duplicate ? ErrorType.Conflict : ErrorType.Validation,
            duplicate ? "account_unavailable" : "invalid_account",
            duplicate ? "This username or email is unavailable." : string.Join(" ", result.Errors.Select(error => error.Description)));
    }

    private static readonly Error InvalidLogin = new(ErrorType.Unauthorized, "invalid_login", "Unable to sign in with these credentials.");
    private static readonly Error VerificationRequired = new(ErrorType.Forbidden, "verification_required", "Verify your email address and phone number before signing in.");
    private static readonly Error InvalidVerification = new(ErrorType.Validation, "invalid_verification", "The verification token is invalid or expired.");
}
