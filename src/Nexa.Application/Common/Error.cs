namespace Nexa.Application.Common;

public enum ErrorType { Validation, NotFound, Unauthorized, Forbidden, Conflict }

public sealed record Error(ErrorType Type, string Code, string Message)
{
    public static Error Missing(string resource) => new(ErrorType.NotFound, "not_found", $"{resource} was not found.");
    public static readonly Error Unauthorized = new(ErrorType.Unauthorized, "unauthorized", "Authentication is required.");
    public static readonly Error Forbidden = new(ErrorType.Forbidden, "forbidden", "You cannot perform this action.");
    public static readonly Error StaleVersion = new(ErrorType.Conflict, "stale_version", "The resource changed. Reload before editing.");
}
