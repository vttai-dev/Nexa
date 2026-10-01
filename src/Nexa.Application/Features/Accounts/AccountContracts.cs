using System.ComponentModel.DataAnnotations;

namespace Nexa.Application.Features.Accounts;

public sealed record RegisterRequest(
    [property: Required, StringLength(30, MinimumLength = 3), RegularExpression("^[a-zA-Z0-9_]+$")] string UserName,
    [property: Required, EmailAddress, StringLength(254)] string Email,
    [property: Required, StringLength(128, MinimumLength = 12)] string Password,
    [property: Required, StringLength(100)] string DisplayName,
    [property: Phone, StringLength(32, MinimumLength = 8)] string? PhoneNumber = null);

public sealed record LoginRequest(
    [property: Required, EmailAddress, StringLength(254)] string Email,
    [property: Required, StringLength(128)] string Password);

public sealed record UpdateProfileRequest(
    [property: Required, StringLength(100)] string DisplayName,
    [property: Required(AllowEmptyStrings = true), StringLength(2000)] string Bio,
    [property: StringLength(2048)] string? AvatarUrl,
    [property: StringLength(2048)] string? WebsiteUrl,
    [property: StringLength(2048)] string? CoverImageUrl = null,
    [property: StringLength(2048)] string? GitHubUrl = null,
    [property: StringLength(2048)] string? LinkedInUrl = null,
    [property: StringLength(120)] string? Company = null,
    [property: MaxLength(20)] string[]? Skills = null);

public sealed record ChangePasswordRequest(
    [property: Required, StringLength(128)] string CurrentPassword,
    [property: Required, StringLength(128, MinimumLength = 12)] string NewPassword);

public sealed record EmailAddressRequest([property: Required, EmailAddress, StringLength(254)] string Email);
public sealed record ConfirmEmailRequest([property: Required, EmailAddress, StringLength(254)] string Email,
    [property: Required, StringLength(4096)] string Token);
public sealed record PhoneVerificationRequest([property: Required, EmailAddress, StringLength(254)] string Email);
public sealed record ConfirmPhoneRequest([property: Required, EmailAddress, StringLength(254)] string Email,
    [property: Required, StringLength(10, MinimumLength = 4)] string Token);
public sealed record ResetPasswordRequest([property: Required, EmailAddress, StringLength(254)] string Email,
    [property: Required, StringLength(4096)] string Token,
    [property: Required, StringLength(128, MinimumLength = 12)] string NewPassword);

public sealed record AccountDto(Guid Id, string UserName, string Email, string? PhoneNumber, bool EmailConfirmed,
    bool PhoneNumberConfirmed, IReadOnlyList<string> Roles);
public sealed record ProfileDto(Guid UserId, string UserName, string DisplayName, string Bio, string? AvatarUrl,
    string? WebsiteUrl, string? CoverImageUrl, string? GitHubUrl, string? LinkedInUrl, string Company,
    IReadOnlyList<string> Skills);
public sealed record PublicProfileStatsDto(Guid UserId, string UserName, int PublishedArticles, int Followers,
    int FollowingUsers, int FollowingTags);
public sealed record PublicFollowDto(Guid UserId, string UserName, string DisplayName, string? AvatarUrl, DateTimeOffset FollowedAtUtc);
public sealed record MentionTargetDto(Guid UserId, string UserName);
public sealed record MeDto(AccountDto Account, ProfileDto Profile);
public sealed record RegisteredDto(Guid UserId);
public sealed record AccountAvailabilityDto(string Field, string Value, bool Available);
