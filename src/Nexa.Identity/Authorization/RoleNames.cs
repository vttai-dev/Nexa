namespace Nexa.Identity.Authorization;

public static class RoleNames
{
    public const string Member = "Member";
    public const string Author = "Author";
    public const string Moderator = "Moderator";
    public const string Admin = "Admin";
    public static readonly IReadOnlyList<string> All = [Member, Author, Moderator, Admin];
}
