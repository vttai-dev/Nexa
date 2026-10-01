using Nexa.Application.Common;
using Nexa.Application.Features.Admin;

namespace Nexa.Application.Abstractions.Identity;

public interface IAdminService
{
    Task<Result<PagedResult<AdminUserSummaryDto>>> ListUsersAsync(AdminUserQuery query, CancellationToken cancellationToken);
    Task<Result<AdminUserDto>> GetUserAsync(Guid userId, CancellationToken cancellationToken);
    Task<Result<Unit>> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken);
    Task<Result<Unit>> LockUserAsync(Guid userId, LockUserRequest request, CancellationToken cancellationToken);
    Task<Result<Unit>> UnlockUserAsync(Guid userId, CancellationToken cancellationToken);
}
