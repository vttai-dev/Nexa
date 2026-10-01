using Nexa.Domain.Common;

namespace Nexa.Domain.Comments;

public sealed class Comment : Entity
{
    private Comment() { }

    public Comment(Guid articleId, Guid authorId, string body, DateTimeOffset now, Guid? parentCommentId = null)
    {
        ArticleId = Guard.Identifier(articleId, "Article");
        AuthorId = Guard.Identifier(authorId, "Author");
        ParentCommentId = parentCommentId is { } parentId ? Guard.Identifier(parentId, "Parent comment") : null;
        CreatedAtUtc = now;
        Update(body, now);
    }

    public Guid ArticleId { get; private set; }
    public Guid AuthorId { get; private set; }
    public Guid? ParentCommentId { get; private set; }
    public string Body { get; private set; } = "";
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }
    public DateTimeOffset? DeletedAtUtc { get; private set; }
    public Guid Version { get; private set; }

    public void Update(string body, DateTimeOffset now)
    {
        if (DeletedAtUtc.HasValue)
            throw new DomainException("A deleted comment cannot be edited.");
        Body = Guard.Required(body, 5000, "Comment");
        UpdatedAtUtc = now;
        Version = Guid.NewGuid();
    }

    public void Delete(DateTimeOffset now)
    {
        DeletedAtUtc = now;
        UpdatedAtUtc = now;
        Version = Guid.NewGuid();
    }
}
