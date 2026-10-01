namespace Nexa.Application.Common;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);

public sealed record PageRequest(int Page = 1, int PageSize = 20)
{
    public bool IsValid => Page >= 1 && Page <= 100_000 && PageSize is >= 1 and <= 100;
    public int Offset => (Page - 1) * PageSize;
    public static readonly Error Invalid = new(ErrorType.Validation, "invalid_page", "Page must be 1–100000 and pageSize 1–100.");
}
