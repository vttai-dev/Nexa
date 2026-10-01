using Nexa.Application.Features.Stats;
using Nexa.Application.Features.Admin;

namespace Nexa.Application.Abstractions.Persistence;

public interface IStatsQueries
{
    Task<AdminStatsDto> AdminAsync(CancellationToken cancellationToken);
    Task<AdminRecentActivityDto> AdminRecentActivityAsync(int take, CancellationToken cancellationToken);
    Task<MyStatsDto> MineAsync(Guid userId, CancellationToken cancellationToken);
    Task<PublicReputationDto?> PublicReputationAsync(string userName, CancellationToken cancellationToken);
    Task<IReadOnlyList<PublicReputationDto>> TopContributorsAsync(int take, CancellationToken cancellationToken);
    Task<AdminUserActivityStatsDto?> UserActivityAsync(Guid userId, CancellationToken cancellationToken);
}
