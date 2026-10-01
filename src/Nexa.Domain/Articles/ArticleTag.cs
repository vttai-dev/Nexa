namespace Nexa.Domain.Articles;

public sealed class ArticleTag(Guid articleId, Guid tagId)
{
    public Guid ArticleId { get; private set; } = articleId;
    public Guid TagId { get; private set; } = tagId;
}
