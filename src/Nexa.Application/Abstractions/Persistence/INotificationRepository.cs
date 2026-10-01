using Nexa.Application.Common;
using Nexa.Application.Features.Notifications;
using Nexa.Domain.Notifications;

namespace Nexa.Application.Abstractions.Persistence;

public interface INotificationRepository
{
    Task<PagedResult<NotificationDto>> ListAsync(Guid recipientId, bool unreadOnly, PageRequest page, CancellationToken cancellationToken);
    Task<int> UnreadCountAsync(Guid recipientId, CancellationToken cancellationToken);
    Task<Notification?> FindForRecipientAsync(Guid id, Guid recipientId, CancellationToken cancellationToken);
    Task MarkAllReadAsync(Guid recipientId, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> DeleteForRecipientAsync(Guid id, Guid recipientId, CancellationToken cancellationToken);
    Task<int> DeleteReadAsync(Guid recipientId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Guid>> AuthorFollowerIdsAsync(Guid authorId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Guid>> TagFollowerIdsAsync(IReadOnlyCollection<Guid> tagIds, CancellationToken cancellationToken);
    void Add(Notification notification);
}
