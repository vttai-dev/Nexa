using Nexa.Application.Features.Accounts;
using Nexa.Application.Common;
using Nexa.Domain.Accounts;

namespace Nexa.Application.Abstractions.Persistence;

public interface IProfileRepository
{
    void Add(Profile profile);
    Task<Profile?> FindAsync(Guid userId, CancellationToken cancellationToken);
    Task<ProfileDto?> GetAsync(Guid userId, CancellationToken cancellationToken);
    Task<ProfileDto?> GetByUserNameAsync(string userName, CancellationToken cancellationToken);
    Task<PublicProfileStatsDto?> StatsByUserNameAsync(string userName, CancellationToken cancellationToken);
    Task<PagedResult<PublicFollowDto>?> FollowersAsync(string userName, PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<PublicFollowDto>?> FollowingAsync(string userName, PageRequest page, CancellationToken cancellationToken);
    Task<IReadOnlyList<MentionTargetDto>> MentionTargetsAsync(IReadOnlyCollection<string> userNames,
        CancellationToken cancellationToken);
}
