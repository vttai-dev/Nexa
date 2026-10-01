namespace Nexa.Application.Features.Media;

public sealed record CreateMediaAssetRequest(string Url, string StoragePath, string FileName, string ContentType, long SizeBytes);
public sealed record MediaAssetDto(Guid Id, string Url, string FileName, string ContentType, long SizeBytes, DateTimeOffset CreatedAtUtc);
