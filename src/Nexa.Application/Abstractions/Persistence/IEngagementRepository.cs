using Nexa.Application.Common;
using Nexa.Application.Features.Engagement;
using Nexa.Application.Features.Taxonomy;

namespace Nexa.Application.Abstractions.Persistence;

public interface IEngagementRepository
{
    Task<bool> SetLikeAsync(Guid userId, Guid articleId, bool enabled, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> SetBookmarkAsync(Guid userId, Guid articleId, bool enabled, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> SetFollowAsync(Guid followerId, Guid followeeId, bool enabled, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> SetTagFollowAsync(Guid userId, Guid tagId, bool enabled, DateTimeOffset now, CancellationToken cancellationToken);
    Task<ArticleEngagementStateDto> ArticleStateAsync(Guid userId, Guid articleId, CancellationToken cancellationToken);
    Task<FollowStateDto> UserFollowStateAsync(Guid followerId, Guid followeeId, CancellationToken cancellationToken);
    Task<FollowStateDto> TagFollowStateAsync(Guid userId, Guid tagId, CancellationToken cancellationToken);
    Task<PagedResult<TagStatsDto>> FollowedTagsAsync(Guid userId, PageRequest page, CancellationToken cancellationToken);
}
