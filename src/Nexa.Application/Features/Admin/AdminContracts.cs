using System.ComponentModel.DataAnnotations;
using Nexa.Application.Common;

namespace Nexa.Application.Features.Admin;

public sealed record AdminUserQuery(PageRequest Page, string? Search);

public sealed record AdminUserSummaryDto(
    Guid Id,
    string UserName,
    string Email,
    IReadOnlyList<string> Roles,
    bool IsLocked,
    DateTimeOffset? LockoutEndUtc,
    DateTimeOffset CreatedAtUtc);

public sealed record AdminUserDto(
    Guid Id,
    string UserName,
    string Email,
    IReadOnlyList<string> Roles,
    bool IsLocked,
    DateTimeOffset? LockoutEndUtc,
    DateTimeOffset CreatedAtUtc,
    bool EmailConfirmed,
    bool PhoneNumberConfirmed);

public sealed record AdminUserActivityStatsDto(
    Guid UserId,
    int Articles,
    int PublishedArticles,
    int Comments,
    int LikesGiven,
    int Bookmarks,
    int Followers,
    int FollowingUsers,
    int FollowingTags,
    int ReportsCreated,
    int ReportsAgainstUser);

public sealed record UpdateUserRolesRequest(
    [property: Required, MinLength(1)] IReadOnlyList<string> Roles);

public sealed record LockUserRequest(
    [property: Range(1, 3650)] int Days = 30);
