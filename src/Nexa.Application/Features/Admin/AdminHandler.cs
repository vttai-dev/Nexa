using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Common;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Domain.Auditing;

namespace Nexa.Application.Features.Admin;

public sealed class AdminHandler(IAdminService admin, ICurrentUser currentUser, IAuditLogRepository auditLogs, IStatsQueries stats,
    IUnitOfWork unitOfWork, TimeProvider clock)
{
    public Task<Result<PagedResult<AdminUserSummaryDto>>> ListUsersAsync(int? page, int? pageSize, string? search,
        CancellationToken cancellationToken)
    {
        var pageRequest = new PageRequest(page ?? 1, pageSize ?? 20);
        return !currentUser.IsAdmin ? Task.FromResult(Result<PagedResult<AdminUserSummaryDto>>.Failure(Error.Forbidden))
            : !pageRequest.IsValid ? Task.FromResult(Result<PagedResult<AdminUserSummaryDto>>.Failure(PageRequest.Invalid))
            : admin.ListUsersAsync(new AdminUserQuery(pageRequest, search), cancellationToken);
    }

    public Task<Result<AdminUserDto>> GetUserAsync(Guid userId, CancellationToken cancellationToken) =>
        !currentUser.IsAdmin ? Task.FromResult(Result<AdminUserDto>.Failure(Error.Forbidden))
        : admin.GetUserAsync(userId, cancellationToken);

    public async Task<Result<AdminUserActivityStatsDto>> GetUserActivityAsync(Guid userId, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<AdminUserActivityStatsDto>.Failure(Error.Forbidden);
        var userStats = await stats.UserActivityAsync(userId, cancellationToken);
        return userStats is null ? Result<AdminUserActivityStatsDto>.Failure(Error.Missing("User"))
            : Result<AdminUserActivityStatsDto>.Success(userStats);
    }

    public Task<Result<Unit>> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Task.FromResult(Result<Unit>.Failure(Error.Forbidden));
        if (currentUser.Id == userId && !request.Roles.Contains("Admin", StringComparer.Ordinal))
            return Task.FromResult(Result<Unit>.Failure(new Error(ErrorType.Conflict, "cannot_remove_self_admin", "You cannot remove your own Admin role.")));
        if (RequestValidation.Validate(request) is { } error)
            return Task.FromResult(Result<Unit>.Failure(error));
        return WithAuditAsync(admin.UpdateRolesAsync(userId, request, cancellationToken),
            "UserRolesUpdated", "User", userId, string.Join(",", request.Roles), cancellationToken);
    }

    public Task<Result<Unit>> LockUserAsync(Guid userId, LockUserRequest request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Task.FromResult(Result<Unit>.Failure(Error.Forbidden));
        if (currentUser.Id == userId)
            return Task.FromResult(Result<Unit>.Failure(new Error(ErrorType.Conflict, "cannot_lock_self", "You cannot lock your own account.")));
        if (RequestValidation.Validate(request) is { } error)
            return Task.FromResult(Result<Unit>.Failure(error));
        return WithAuditAsync(admin.LockUserAsync(userId, request, cancellationToken),
            "UserLocked", "User", userId, $"days={request.Days}", cancellationToken);
    }

    public Task<Result<Unit>> UnlockUserAsync(Guid userId, CancellationToken cancellationToken) =>
        !currentUser.IsAdmin ? Task.FromResult(Result<Unit>.Failure(Error.Forbidden))
        : WithAuditAsync(admin.UnlockUserAsync(userId, cancellationToken),
            "UserUnlocked", "User", userId, "", cancellationToken);

    private async Task<Result<Unit>> WithAuditAsync(Task<Result<Unit>> operation, string action, string targetType,
        Guid targetId, string details, CancellationToken cancellationToken)
    {
        var result = await operation;
        if (!result.IsSuccess || currentUser.Id is not { } actorId)
            return result;
        auditLogs.Add(new AuditLog(actorId, action, targetType, targetId, details, currentUser.IpAddress, clock.GetUtcNow()));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return result;
    }
}
