using Nexa.Domain.Common;

namespace Nexa.Domain.Engagement;

public sealed class Follow
{
    private Follow() { }

    public Follow(Guid followerId, Guid followeeId, DateTimeOffset now)
    {
        FollowerId = Guard.Identifier(followerId, "Follower");
        FolloweeId = Guard.Identifier(followeeId, "Followee");
        if (followerId == followeeId)
            throw new DomainException("You cannot follow yourself.");
        CreatedAtUtc = now;
    }

    public Guid FollowerId { get; private set; }
    public Guid FolloweeId { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
}
