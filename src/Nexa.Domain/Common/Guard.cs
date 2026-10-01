using System.Text.RegularExpressions;

namespace Nexa.Domain.Common;

public static partial class Guard
{
    public static string Required(string? value, int maximum, string field)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > maximum)
            throw new DomainException($"{field} must contain 1–{maximum} characters.");
        return value.Trim();
    }

    public static string Text(string? value, int maximum, string field)
    {
        if (value is null || value.Length > maximum)
            throw new DomainException($"{field} must contain at most {maximum} characters.");
        return value;
    }

    public static Guid Identifier(Guid value, string field)
    {
        if (value == Guid.Empty)
            throw new DomainException($"{field} must be a valid identifier.");
        return value;
    }

    public static string Slug(string? value)
    {
        var slug = Required(value, 180, "Slug").ToLowerInvariant();
        if (!SlugPattern().IsMatch(slug))
            throw new DomainException("Slug must use lowercase letters, numbers and single hyphens.");
        return slug;
    }

    public static string? WebUrl(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var url = Required(value, 2048, field);
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme is not ("https" or "http"))
            throw new DomainException($"{field} must be an absolute HTTP or HTTPS URL.");
        return url;
    }

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();
}
