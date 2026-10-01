using System.Collections.Concurrent;
using System.Threading.Channels;
using Nexa.Application.Abstractions.Notifications;

namespace Nexa.Api.Services;

public sealed class NotificationEventBus : INotificationRealtimePublisher
{
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<Guid, Channel<byte>>> subscribers = new();

    public Subscription Subscribe(Guid recipientId)
    {
        var id = Guid.NewGuid();
        var channel = Channel.CreateBounded<byte>(new BoundedChannelOptions(1)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });
        subscribers.GetOrAdd(recipientId, _ => new ConcurrentDictionary<Guid, Channel<byte>>())[id] = channel;
        return new Subscription(channel.Reader, () =>
        {
            if (subscribers.TryGetValue(recipientId, out var recipientSubscribers)
                && recipientSubscribers.TryRemove(id, out var removed))
                removed.Writer.TryComplete();
        });
    }

    public Task PublishAsync(Guid recipientId)
    {
        if (subscribers.TryGetValue(recipientId, out var recipientSubscribers))
            foreach (var channel in recipientSubscribers.Values)
                channel.Writer.TryWrite(1);
        return Task.CompletedTask;
    }

    public sealed class Subscription(ChannelReader<byte> reader, Action dispose) : IDisposable
    {
        private int disposed;
        public ChannelReader<byte> Reader { get; } = reader;

        public void Dispose()
        {
            if (Interlocked.Exchange(ref disposed, 1) == 0)
                dispose();
        }
    }
}
