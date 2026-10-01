namespace Nexa.Application.Abstractions.Notifications;

public interface INotificationRealtimePublisher
{
    Task PublishAsync(Guid recipientId);
}
