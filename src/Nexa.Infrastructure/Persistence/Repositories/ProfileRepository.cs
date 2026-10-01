using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Accounts;
using Nexa.Domain.Accounts;
using Nexa.Domain.Articles;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class ProfileRepository(NexaDbContext database) : IProfileRepository
{
    public void Add(Profile profile) => database.Profiles.Add(profile);

    public Task<Profile?> FindAsync(Guid userId, CancellationToken cancellationToken) =>
        database.Profiles.SingleOrDefaultAsync(profile => profile.UserId == userId, cancellationToken);

    public Task<ProfileDto?> GetAsync(Guid userId, CancellationToken cancellationToken) =>
        (from profile in database.Profiles.AsNoTracking()
         join user in database.Users.AsNoTracking() on profile.UserId equals user.Id
         where profile.UserId == userId
         select new ProfileDto(user.Id, user.UserName!, profile.DisplayName, profile.Bio, profile.AvatarUrl,
             profile.WebsiteUrl, profile.CoverImageUrl, profile.GitHubUrl, profile.LinkedInUrl, profile.Company, profile.Skills))
        .SingleOrDefaultAsync(cancellationToken);

    public Task<ProfileDto?> GetByUserNameAsync(string userName, CancellationToken cancellationToken)
    {
        var normalized = userName.ToUpperInvariant();
        return (from profile in database.Profiles.AsNoTracking()
                join user in database.Users.AsNoTracking() on profile.UserId equals user.Id
                where user.NormalizedUserName == normalized
                select new ProfileDto(user.Id, user.UserName!, profile.DisplayName, profile.Bio, profile.AvatarUrl,
                    profile.WebsiteUrl, profile.CoverImageUrl, profile.GitHubUrl, profile.LinkedInUrl, profile.Company, profile.Skills))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public Task<PublicProfileStatsDto?> StatsByUserNameAsync(string userName, CancellationToken cancellationToken)
    {
        var normalized = userName.ToUpperInvariant();
        return database.Users.AsNoTracking().Where(user => user.NormalizedUserName == normalized)
            .Select(user => new PublicProfileStatsDto(user.Id, user.UserName!,
                database.Articles.Count(article => article.AuthorId == user.Id && article.Status == ArticleStatus.Published),
                database.Follows.Count(follow => follow.FolloweeId == user.Id),
                database.Follows.Count(follow => follow.FollowerId == user.Id),
                database.TagFollows.Count(follow => follow.UserId == user.Id)))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<PublicFollowDto>?> FollowersAsync(string userName, PageRequest page, CancellationToken cancellationToken)
    {
        var userId = await UserIdAsync(userName, cancellationToken);
        if (userId is null)
            return null;
        var query = from follow in database.Follows.AsNoTracking()
                    join user in database.Users.AsNoTracking() on follow.FollowerId equals user.Id
                    join profile in database.Profiles.AsNoTracking() on user.Id equals profile.UserId
                    where follow.FolloweeId == userId.Value
                    orderby follow.CreatedAtUtc descending, user.Id
                    select new PublicFollowDto(user.Id, user.UserName!, profile.DisplayName, profile.AvatarUrl, follow.CreatedAtUtc);
        return await PageAsync(query, page, cancellationToken);
    }

    public async Task<PagedResult<PublicFollowDto>?> FollowingAsync(string userName, PageRequest page, CancellationToken cancellationToken)
    {
        var userId = await UserIdAsync(userName, cancellationToken);
        if (userId is null)
            return null;
        var query = from follow in database.Follows.AsNoTracking()
                    join user in database.Users.AsNoTracking() on follow.FolloweeId equals user.Id
                    join profile in database.Profiles.AsNoTracking() on user.Id equals profile.UserId
                    where follow.FollowerId == userId.Value
                    orderby follow.CreatedAtUtc descending, user.Id
                    select new PublicFollowDto(user.Id, user.UserName!, profile.DisplayName, profile.AvatarUrl, follow.CreatedAtUtc);
        return await PageAsync(query, page, cancellationToken);
    }

    public async Task<IReadOnlyList<MentionTargetDto>> MentionTargetsAsync(IReadOnlyCollection<string> userNames,
        CancellationToken cancellationToken)
    {
        var normalized = userNames.Where(userName => !string.IsNullOrWhiteSpace(userName))
            .Select(userName => userName.Trim().ToUpperInvariant()).Distinct().ToArray();
        if (normalized.Length == 0)
            return [];
        return await database.Users.AsNoTracking()
            .Where(user => normalized.Contains(user.NormalizedUserName!))
            .Select(user => new MentionTargetDto(user.Id, user.UserName!))
            .ToListAsync(cancellationToken);
    }

    private async Task<Guid?> UserIdAsync(string userName, CancellationToken cancellationToken)
    {
        var normalized = userName.ToUpperInvariant();
        return await database.Users.AsNoTracking()
            .Where(user => user.NormalizedUserName == normalized)
            .Select(user => (Guid?)user.Id)
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static async Task<PagedResult<PublicFollowDto>> PageAsync(IQueryable<PublicFollowDto> query, PageRequest page,
        CancellationToken cancellationToken)
    {
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(page.Offset).Take(page.PageSize).ToListAsync(cancellationToken);
        return new PagedResult<PublicFollowDto>(items, page.Page, page.PageSize, total);
    }
}
