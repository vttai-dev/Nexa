using Nexa.Domain.Notifications;

namespace Nexa.Application.Features.Notifications;

public sealed record NotificationDto(
    Guid Id,
    NotificationType Type,
    string Message,
    Guid? ActorId,
    string? ActorUserName,
    Guid? ArticleId,
    string? ArticleSlug,
    Guid? CommentId,
    bool IsRead,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ReadAtUtc);

public sealed record NotificationUnreadCountDto(int Count);
public sealed record DeletedNotificationsDto(int Count);
