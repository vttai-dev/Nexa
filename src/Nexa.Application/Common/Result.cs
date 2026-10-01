namespace Nexa.Application.Common;

public sealed record Result<T>(T? Value, Error? Error)
{
    public bool IsSuccess => Error is null;
    public static Result<T> Success(T value) => new(value, null);
    public static Result<T> Failure(Error error) => new(default, error);
}

public readonly record struct Unit
{
    public static readonly Unit Value = new();
}
