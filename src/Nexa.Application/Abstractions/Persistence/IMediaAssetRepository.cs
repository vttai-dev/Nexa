using Nexa.Application.Common;
using Nexa.Application.Features.Media;
using Nexa.Domain.Media;

namespace Nexa.Application.Abstractions.Persistence;

public interface IMediaAssetRepository
{
    void Add(MediaAsset asset);
    void Remove(MediaAsset asset);
    Task<MediaAsset?> FindOwnedAsync(Guid id, Guid ownerId, CancellationToken cancellationToken);
    Task<PagedResult<MediaAssetDto>> ListOwnedAsync(Guid ownerId, PageRequest page, CancellationToken cancellationToken);
}
