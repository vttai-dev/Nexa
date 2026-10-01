using Nexa.Domain.Common;

namespace Nexa.Domain.Articles;

public sealed class ArticleRevision : Entity
{
    private ArticleRevision() { }

    public ArticleRevision(Article article, Guid editorId, ArticleRevisionAction action, DateTimeOffset now)
    {
        ArticleId = Guard.Identifier(article.Id, "Article");
        EditorId = Guard.Identifier(editorId, "Editor");
        Action = action;
        Title = Guard.Required(article.Title, 200, "Title");
        Slug = Guard.Slug(article.Slug);
        Summary = Guard.Text(article.Summary, 500, "Summary");
        BodyMarkdown = Guard.Text(article.BodyMarkdown, 200_000, "Content");
        CategoryId = article.CategoryId;
        TagIds = article.Tags.Select(tag => tag.TagId).OrderBy(tagId => tagId).ToArray();
        Status = article.Status;
        ArticleVersion = article.Version;
        CreatedAtUtc = now;
    }

    public Guid ArticleId { get; private set; }
    public Guid EditorId { get; private set; }
    public ArticleRevisionAction Action { get; private set; }
    public string Title { get; private set; } = "";
    public string Slug { get; private set; } = "";
    public string Summary { get; private set; } = "";
    public string BodyMarkdown { get; private set; } = "";
    public Guid? CategoryId { get; private set; }
    public Guid[] TagIds { get; private set; } = [];
    public ArticleStatus Status { get; private set; }
    public Guid ArticleVersion { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
}
