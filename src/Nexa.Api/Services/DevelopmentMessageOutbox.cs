using System.Collections.Concurrent;

namespace Nexa.Api.Services;

public sealed record DevelopmentMessage(string Channel, string Recipient, string Subject, string Body,
    DateTimeOffset CreatedAtUtc);

public sealed class DevelopmentMessageOutbox
{
    private readonly ConcurrentQueue<DevelopmentMessage> messages = new();

    public void Add(DevelopmentMessage message)
    {
        messages.Enqueue(message);
        while (messages.Count > 200)
            messages.TryDequeue(out _);
    }

    public IReadOnlyList<DevelopmentMessage> Read(string? recipient) =>
        messages.ToArray().Where(message => string.IsNullOrWhiteSpace(recipient)
            || string.Equals(message.Recipient, recipient.Trim(), StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(message => message.CreatedAtUtc).Take(20).ToArray();
}
