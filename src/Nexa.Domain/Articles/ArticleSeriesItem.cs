namespace Nexa.Domain.Articles;

public sealed class ArticleSeriesItem
{
    private ArticleSeriesItem() { }

    internal ArticleSeriesItem(Guid articleId, int position, DateTimeOffset addedAtUtc)
    {
        ArticleId = articleId;
        Position = position;
        AddedAtUtc = addedAtUtc;
    }

    public Guid SeriesId { get; private set; }
    public Guid ArticleId { get; private set; }
    public int Position { get; private set; }
    public DateTimeOffset AddedAtUtc { get; private set; }

    internal void MoveTo(int position) => Position = position;
}
