using Nexa.Domain.Common;

namespace Nexa.Domain.Engagement;

public sealed class Like(Guid userId, Guid articleId, DateTimeOffset createdAtUtc)
{
    public Guid UserId { get; private set; } = Guard.Identifier(userId, "User");
    public Guid ArticleId { get; private set; } = Guard.Identifier(articleId, "Article");
    public DateTimeOffset CreatedAtUtc { get; private set; } = createdAtUtc;
}
