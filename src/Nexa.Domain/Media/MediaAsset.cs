using Nexa.Domain.Common;

namespace Nexa.Domain.Media;

public sealed class MediaAsset : Entity
{
    private MediaAsset() { }

    public MediaAsset(Guid ownerId, string url, string storagePath, string fileName, string contentType,
        long sizeBytes, DateTimeOffset createdAtUtc)
    {
        OwnerId = Guard.Identifier(ownerId, "Owner");
        Url = Guard.Required(url, 500, "URL");
        StoragePath = Guard.Required(storagePath, 500, "Storage path");
        FileName = Guard.Required(fileName, 255, "File name");
        ContentType = Guard.Required(contentType, 100, "Content type");
        if (sizeBytes is <= 0 or > 25 * 1024 * 1024)
            throw new DomainException("Media file size must be between 1 byte and 25 MB.");
        SizeBytes = sizeBytes;
        CreatedAtUtc = createdAtUtc;
    }

    public Guid OwnerId { get; private set; }
    public string Url { get; private set; } = "";
    public string StoragePath { get; private set; } = "";
    public string FileName { get; private set; } = "";
    public string ContentType { get; private set; } = "";
    public long SizeBytes { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
}
