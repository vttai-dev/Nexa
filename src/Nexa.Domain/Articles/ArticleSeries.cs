using Nexa.Domain.Common;

namespace Nexa.Domain.Articles;

public sealed class ArticleSeries : Entity
{
    private readonly List<ArticleSeriesItem> _articles = [];
    private ArticleSeries() { }

    public ArticleSeries(Guid ownerId, string title, string slug, string description, DateTimeOffset now)
    {
        OwnerId = Guard.Identifier(ownerId, "Owner");
        CreatedAtUtc = now;
        Update(title, slug, description, now);
    }

    public Guid OwnerId { get; private set; }
    public string Title { get; private set; } = "";
    public string Slug { get; private set; } = "";
    public string Description { get; private set; } = "";
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }
    public IReadOnlyCollection<ArticleSeriesItem> Articles => _articles.AsReadOnly();

    public void Update(string title, string slug, string description, DateTimeOffset now)
    {
        Title = Guard.Required(title, 200, "Title");
        Slug = Guard.Slug(slug);
        Description = Guard.Text(description, 2000, "Description");
        UpdatedAtUtc = now;
    }

    public void AddArticle(Guid articleId, DateTimeOffset now)
    {
        Guard.Identifier(articleId, "Article");
        if (_articles.Any(item => item.ArticleId == articleId))
            return;
        if (_articles.Count >= 100)
            throw new DomainException("A series can contain at most 100 articles.");
        _articles.Add(new ArticleSeriesItem(articleId, _articles.Count, now));
        UpdatedAtUtc = now;
    }

    public void RemoveArticle(Guid articleId, DateTimeOffset now)
    {
        _articles.RemoveAll(item => item.ArticleId == articleId);
        for (var position = 0; position < _articles.Count; position++)
            _articles[position].MoveTo(position);
        UpdatedAtUtc = now;
    }

    public void ReorderArticles(IReadOnlyList<Guid> orderedArticleIds, DateTimeOffset now)
    {
        if (orderedArticleIds.Count != _articles.Count || orderedArticleIds.Distinct().Count() != _articles.Count
            || orderedArticleIds.Any(articleId => _articles.All(item => item.ArticleId != articleId)))
            throw new DomainException("The order must contain every series article exactly once.");
        for (var position = 0; position < orderedArticleIds.Count; position++)
            _articles.Single(item => item.ArticleId == orderedArticleIds[position]).MoveTo(position);
        UpdatedAtUtc = now;
    }
}
