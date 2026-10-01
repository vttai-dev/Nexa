using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Notifications;
using Nexa.Domain.Notifications;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class NotificationRepository(NexaDbContext database) : INotificationRepository
{
    public async Task<PagedResult<NotificationDto>> ListAsync(Guid recipientId, bool unreadOnly, PageRequest page,
        CancellationToken cancellationToken)
    {
        var query = database.Notifications.AsNoTracking().Where(notification => notification.RecipientId == recipientId);
        if (unreadOnly)
            query = query.Where(notification => notification.ReadAtUtc == null);
        query = query.OrderByDescending(notification => notification.CreatedAtUtc).ThenByDescending(notification => notification.Id);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip(page.Offset).Take(page.PageSize)
            .Select(notification => new NotificationDto(
                notification.Id,
                notification.Type,
                notification.Message,
                notification.ActorId,
                notification.ActorId == null ? null : database.Users.Where(user => user.Id == notification.ActorId).Select(user => user.UserName).First(),
                notification.ArticleId,
                notification.ArticleId == null ? null : database.Articles.Where(article => article.Id == notification.ArticleId).Select(article => article.Slug).First(),
                notification.CommentId,
                notification.ReadAtUtc != null,
                notification.CreatedAtUtc,
                notification.ReadAtUtc))
            .ToListAsync(cancellationToken);
        return new PagedResult<NotificationDto>(items, page.Page, page.PageSize, total);
    }

    public Task<int> UnreadCountAsync(Guid recipientId, CancellationToken cancellationToken) =>
        database.Notifications.CountAsync(notification => notification.RecipientId == recipientId && notification.ReadAtUtc == null,
            cancellationToken);

    public Task<Notification?> FindForRecipientAsync(Guid id, Guid recipientId, CancellationToken cancellationToken) =>
        database.Notifications.SingleOrDefaultAsync(notification => notification.Id == id && notification.RecipientId == recipientId,
            cancellationToken);

    public Task MarkAllReadAsync(Guid recipientId, DateTimeOffset now, CancellationToken cancellationToken) =>
        database.Notifications
            .Where(notification => notification.RecipientId == recipientId && notification.ReadAtUtc == null)
            .ExecuteUpdateAsync(updates => updates.SetProperty(notification => notification.ReadAtUtc, now), cancellationToken);

    public async Task<bool> DeleteForRecipientAsync(Guid id, Guid recipientId, CancellationToken cancellationToken) =>
        await database.Notifications.Where(notification => notification.Id == id && notification.RecipientId == recipientId)
            .ExecuteDeleteAsync(cancellationToken) > 0;

    public Task<int> DeleteReadAsync(Guid recipientId, CancellationToken cancellationToken) =>
        database.Notifications.Where(notification => notification.RecipientId == recipientId && notification.ReadAtUtc != null)
            .ExecuteDeleteAsync(cancellationToken);

    public async Task<IReadOnlyList<Guid>> AuthorFollowerIdsAsync(Guid authorId, CancellationToken cancellationToken) =>
        await database.Follows.AsNoTracking().Where(follow => follow.FolloweeId == authorId)
            .Select(follow => follow.FollowerId).Distinct().ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Guid>> TagFollowerIdsAsync(IReadOnlyCollection<Guid> tagIds,
        CancellationToken cancellationToken)
    {
        if (tagIds.Count == 0)
            return [];
        return await database.TagFollows.AsNoTracking().Where(follow => tagIds.Contains(follow.TagId))
            .Select(follow => follow.UserId).Distinct().ToListAsync(cancellationToken);
    }

    public void Add(Notification notification) => database.Notifications.Add(notification);
}
