using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;

namespace Nexa.Application.Features.Stats;

public sealed class StatsHandler(IStatsQueries stats, ICurrentUser currentUser)
{
    public async Task<Result<AdminStatsDto>> AdminAsync(CancellationToken cancellationToken) =>
        !currentUser.IsAdmin
            ? Result<AdminStatsDto>.Failure(Error.Forbidden)
            : Result<AdminStatsDto>.Success(await stats.AdminAsync(cancellationToken));

    public async Task<Result<AdminRecentActivityDto>> AdminRecentActivityAsync(int? take, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
            return Result<AdminRecentActivityDto>.Failure(Error.Forbidden);
        var count = take ?? 5;
        if (count is < 1 or > 20)
            return Result<AdminRecentActivityDto>.Failure(new Error(ErrorType.Validation, "invalid_take", "Take must be between 1 and 20."));
        return Result<AdminRecentActivityDto>.Success(await stats.AdminRecentActivityAsync(count, cancellationToken));
    }

    public async Task<Result<MyStatsDto>> MineAsync(CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<MyStatsDto>.Failure(Error.Unauthorized);
        return Result<MyStatsDto>.Success(await stats.MineAsync(userId, cancellationToken));
    }

    public async Task<Result<PublicReputationDto>> PublicReputationAsync(string userName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return Result<PublicReputationDto>.Failure(new Error(ErrorType.Validation,
                "invalid_request", "User name is required."));
        var reputation = await stats.PublicReputationAsync(userName, cancellationToken);
        return reputation is null ? Result<PublicReputationDto>.Failure(Error.Missing("User"))
            : Result<PublicReputationDto>.Success(reputation);
    }

    public async Task<Result<IReadOnlyList<PublicReputationDto>>> TopContributorsAsync(int? take,
        CancellationToken cancellationToken)
    {
        var count = take ?? 20;
        return count is < 1 or > 50
            ? Result<IReadOnlyList<PublicReputationDto>>.Failure(new Error(ErrorType.Validation,
                "invalid_take", "Take must be between 1 and 50."))
            : Result<IReadOnlyList<PublicReputationDto>>.Success(await stats.TopContributorsAsync(count, cancellationToken));
    }
}
