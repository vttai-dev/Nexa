using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;

namespace Nexa.Application.Features.Accounts;

public sealed class AccountHandler(IIdentityService identity, IProfileRepository profiles,
    ICurrentUser currentUser, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<Result<Unit>> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        return await identity.SignInAsync(request, cancellationToken);
    }

    public Task LogoutAsync() => identity.SignOutAsync();

    public async Task<Result<Unit>> EnableAuthorRoleAsync(CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        return await identity.EnableAuthorRoleAsync(userId, cancellationToken);
    }

    public async Task<Result<AccountAvailabilityDto>> UserNameAvailabilityAsync(string userName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userName) || userName.Length is < 3 or > 30)
            return Result<AccountAvailabilityDto>.Failure(new Error(ErrorType.Validation, "invalid_user_name", "User name is invalid."));
        var normalized = userName.Trim();
        return Result<AccountAvailabilityDto>.Success(new AccountAvailabilityDto("userName", normalized,
            await identity.UserNameAvailableAsync(normalized, cancellationToken)));
    }

    public async Task<Result<AccountAvailabilityDto>> EmailAvailabilityAsync(string email, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254 || !email.Contains('@', StringComparison.Ordinal))
            return Result<AccountAvailabilityDto>.Failure(new Error(ErrorType.Validation, "invalid_email", "Email is invalid."));
        var normalized = email.Trim();
        return Result<AccountAvailabilityDto>.Success(new AccountAvailabilityDto("email", normalized,
            await identity.EmailAvailableAsync(normalized, cancellationToken)));
    }

    public async Task<Result<MeDto>> MeAsync(CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<MeDto>.Failure(Error.Unauthorized);
        var account = await identity.FindAsync(userId, cancellationToken);
        var profile = await profiles.GetAsync(userId, cancellationToken);
        return account is null || profile is null
            ? Result<MeDto>.Failure(Error.Missing("Account"))
            : Result<MeDto>.Success(new MeDto(account, profile));
    }

    public async Task<Result<ProfileDto>> PublicProfileAsync(string userName, CancellationToken cancellationToken)
    {
        var profile = await profiles.GetByUserNameAsync(userName, cancellationToken);
        return profile is null ? Result<ProfileDto>.Failure(Error.Missing("Profile")) : Result<ProfileDto>.Success(profile);
    }

    public async Task<Result<PublicProfileStatsDto>> PublicProfileStatsAsync(string userName, CancellationToken cancellationToken)
    {
        var stats = await profiles.StatsByUserNameAsync(userName, cancellationToken);
        return stats is null ? Result<PublicProfileStatsDto>.Failure(Error.Missing("Profile")) : Result<PublicProfileStatsDto>.Success(stats);
    }

    public async Task<Result<PagedResult<PublicFollowDto>>> FollowersAsync(string userName, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<PublicFollowDto>>.Failure(PageRequest.Invalid);
        var followers = await profiles.FollowersAsync(userName, page, cancellationToken);
        return followers is null ? Result<PagedResult<PublicFollowDto>>.Failure(Error.Missing("Profile"))
            : Result<PagedResult<PublicFollowDto>>.Success(followers);
    }

    public async Task<Result<PagedResult<PublicFollowDto>>> FollowingAsync(string userName, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<PublicFollowDto>>.Failure(PageRequest.Invalid);
        var following = await profiles.FollowingAsync(userName, page, cancellationToken);
        return following is null ? Result<PagedResult<PublicFollowDto>>.Failure(Error.Missing("Profile"))
            : Result<PagedResult<PublicFollowDto>>.Success(following);
    }

    public async Task<Result<Unit>> UpdateAsync(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        var profile = await profiles.FindAsync(userId, cancellationToken);
        if (profile is null)
            return Result<Unit>.Failure(Error.Missing("Profile"));
        profile.Update(request.DisplayName, request.Bio, request.AvatarUrl, request.WebsiteUrl, clock.GetUtcNow(),
            request.CoverImageUrl, request.GitHubUrl, request.LinkedInUrl, request.Company, request.Skills);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        return await identity.ChangePasswordAsync(userId, request, cancellationToken);
    }
}
