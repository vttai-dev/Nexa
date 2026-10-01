using Nexa.Domain.Common;

namespace Nexa.Domain.Engagement;

public sealed class TagFollow
{
    private TagFollow() { }

    public TagFollow(Guid userId, Guid tagId, DateTimeOffset now)
    {
        UserId = Guard.Identifier(userId, "User");
        TagId = Guard.Identifier(tagId, "Tag");
        CreatedAtUtc = now;
    }

    public Guid UserId { get; private set; }
    public Guid TagId { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
}
