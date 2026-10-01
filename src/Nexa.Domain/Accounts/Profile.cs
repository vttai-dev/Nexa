using Nexa.Domain.Common;

namespace Nexa.Domain.Accounts;

public sealed class Profile
{
    private Profile() { }

    public Profile(Guid userId, string displayName, DateTimeOffset now)
    {
        UserId = Guard.Identifier(userId, "User");
        Update(displayName, "", null, null, now);
    }

    public Guid UserId { get; private set; }
    public string DisplayName { get; private set; } = "";
    public string Bio { get; private set; } = "";
    public string? AvatarUrl { get; private set; }
    public string? CoverImageUrl { get; private set; }
    public string? WebsiteUrl { get; private set; }
    public string? GitHubUrl { get; private set; }
    public string? LinkedInUrl { get; private set; }
    public string Company { get; private set; } = "";
    public string[] Skills { get; private set; } = [];
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public void Update(string displayName, string bio, string? avatarUrl, string? websiteUrl, DateTimeOffset now,
        string? coverImageUrl = null, string? gitHubUrl = null, string? linkedInUrl = null,
        string? company = null, IEnumerable<string>? skills = null)
    {
        DisplayName = Guard.Required(displayName, 100, "Display name");
        Bio = Guard.Text(bio, 2000, "Bio");
        AvatarUrl = ProfileImageUrl(avatarUrl, "Avatar");
        WebsiteUrl = Guard.WebUrl(websiteUrl, "Website");
        if (coverImageUrl is not null)
            CoverImageUrl = ProfileImageUrl(coverImageUrl, "Cover image");
        if (gitHubUrl is not null)
            GitHubUrl = Guard.WebUrl(gitHubUrl, "GitHub");
        if (linkedInUrl is not null)
            LinkedInUrl = Guard.WebUrl(linkedInUrl, "LinkedIn");
        if (company is not null)
            Company = string.IsNullOrWhiteSpace(company) ? "" : Guard.Required(company, 120, "Company");
        if (skills is not null)
        {
            var normalizedSkills = skills.Select(skill => Guard.Required(skill, 50, "Skill"))
                .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            if (normalizedSkills.Length > 20)
                throw new DomainException("A profile can have at most 20 skills.");
            Skills = normalizedSkills;
        }
        UpdatedAtUtc = now;
    }

    private static string? ProfileImageUrl(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var normalized = Guard.Required(value, 2048, field);
        var segments = normalized.Split('/');
        if (normalized.StartsWith("/uploads/images/", StringComparison.Ordinal)
            && !normalized.Contains('\\') && !segments.Contains("..", StringComparer.Ordinal))
            return normalized;
        return Guard.WebUrl(normalized, field);
    }
}
