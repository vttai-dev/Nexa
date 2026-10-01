using Microsoft.AspNetCore.Identity;
using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Common;
using Nexa.Application.Features.Admin;
using Nexa.Identity.Authorization;
using Nexa.Identity.Entities;

namespace Nexa.Identity.Services;

public sealed class AdminService(UserManager<User> users, RoleManager<Role> roles, TimeProvider clock) : IAdminService
{
    public async Task<Result<PagedResult<AdminUserSummaryDto>>> ListUsersAsync(AdminUserQuery query, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var usersQuery = users.Users;
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToUpperInvariant();
            usersQuery = usersQuery.Where(user =>
                user.NormalizedEmail!.Contains(search) || user.NormalizedUserName!.Contains(search));
        }
        var totalCount = usersQuery.Count();
        var pageUsers = usersQuery
            .OrderByDescending(user => user.CreatedAtUtc)
            .Skip((query.Page.Page - 1) * query.Page.PageSize)
            .Take(query.Page.PageSize)
            .ToList();
        var items = new List<AdminUserSummaryDto>(pageUsers.Count);
        foreach (var user in pageUsers)
            items.Add(new AdminUserSummaryDto(user.Id, user.UserName!, user.Email!, (await users.GetRolesAsync(user)).ToArray(),
                await users.IsLockedOutAsync(user), user.LockoutEnd, user.CreatedAtUtc));
        return Result<PagedResult<AdminUserSummaryDto>>.Success(new PagedResult<AdminUserSummaryDto>(
            items, query.Page.Page, query.Page.PageSize, totalCount));
    }

    public async Task<Result<AdminUserDto>> GetUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<AdminUserDto>.Failure(Error.Missing("User"));
        return Result<AdminUserDto>.Success(new AdminUserDto(user.Id, user.UserName!, user.Email!,
            (await users.GetRolesAsync(user)).ToArray(), await users.IsLockedOutAsync(user), user.LockoutEnd,
            user.CreatedAtUtc, user.EmailConfirmed, user.PhoneNumberConfirmed));
    }

    public async Task<Result<Unit>> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<Unit>.Failure(Error.Missing("User"));
        var requestedRoles = request.Roles.Select(role => role.Trim()).Distinct(StringComparer.Ordinal).ToArray();
        if (requestedRoles.Length == 0 || requestedRoles.Any(role => !RoleNames.All.Contains(role)))
            return Result<Unit>.Failure(InvalidRole);
        if (requestedRoles.Contains(RoleNames.Author, StringComparer.Ordinal) && !await roles.RoleExistsAsync(RoleNames.Author))
        {
            var createdRole = await roles.CreateAsync(new Role { Id = Guid.CreateVersion7(), Name = RoleNames.Author });
            if (!createdRole.Succeeded && !await roles.RoleExistsAsync(RoleNames.Author))
                return Result<Unit>.Failure(IdentityFailure(createdRole));
        }
        var currentRoles = await users.GetRolesAsync(user);
        var remove = currentRoles.Except(requestedRoles).ToArray();
        var add = requestedRoles.Except(currentRoles).ToArray();
        var removed = await users.RemoveFromRolesAsync(user, remove);
        if (!removed.Succeeded)
            return Result<Unit>.Failure(IdentityFailure(removed));
        var added = await users.AddToRolesAsync(user, add);
        if (!added.Succeeded)
            return Result<Unit>.Failure(IdentityFailure(added));
        await users.UpdateSecurityStampAsync(user);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> LockUserAsync(Guid userId, LockUserRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<Unit>.Failure(Error.Missing("User"));
        var enabled = await users.SetLockoutEnabledAsync(user, true);
        if (!enabled.Succeeded)
            return Result<Unit>.Failure(IdentityFailure(enabled));
        var locked = await users.SetLockoutEndDateAsync(user, clock.GetUtcNow().AddDays(request.Days));
        if (!locked.Succeeded)
            return Result<Unit>.Failure(IdentityFailure(locked));
        await users.UpdateSecurityStampAsync(user);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> UnlockUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is null)
            return Result<Unit>.Failure(Error.Missing("User"));
        var unlocked = await users.SetLockoutEndDateAsync(user, null);
        if (!unlocked.Succeeded)
            return Result<Unit>.Failure(IdentityFailure(unlocked));
        await users.ResetAccessFailedCountAsync(user);
        await users.UpdateSecurityStampAsync(user);
        return Result<Unit>.Success(Unit.Value);
    }

    private static Error IdentityFailure(IdentityResult result) =>
        new(ErrorType.Validation, "invalid_identity_operation", string.Join(" ", result.Errors.Select(error => error.Description)));

    private static readonly Error InvalidRole = new(ErrorType.Validation, "invalid_role", "Roles must be one or more of Member, Author, Moderator, Admin.");
}
