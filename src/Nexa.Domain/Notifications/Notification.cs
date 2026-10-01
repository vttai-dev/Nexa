using Nexa.Domain.Common;

namespace Nexa.Domain.Notifications;

public sealed class Notification : Entity
{
    private Notification() { }

    public Notification(Guid recipientId, NotificationType type, string message, DateTimeOffset now,
        Guid? actorId = null, Guid? articleId = null, Guid? commentId = null)
    {
        RecipientId = Guard.Identifier(recipientId, "Recipient");
        ActorId = actorId == Guid.Empty ? null : actorId;
        ArticleId = articleId == Guid.Empty ? null : articleId;
        CommentId = commentId == Guid.Empty ? null : commentId;
        Type = type;
        Message = Guard.Required(message, 500, "Notification message");
        CreatedAtUtc = now;
    }

    public Guid RecipientId { get; private set; }
    public Guid? ActorId { get; private set; }
    public Guid? ArticleId { get; private set; }
    public Guid? CommentId { get; private set; }
    public NotificationType Type { get; private set; }
    public string Message { get; private set; } = "";
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset? ReadAtUtc { get; private set; }
    public bool IsRead => ReadAtUtc.HasValue;

    public void MarkRead(DateTimeOffset now)
    {
        ReadAtUtc ??= now;
    }
}
