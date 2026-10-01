namespace Nexa.Application.Features.Engagement;

public sealed record ArticleEngagementStateDto(Guid ArticleId, bool Liked, bool Bookmarked);
public sealed record FollowStateDto(Guid TargetId, bool Following);
