using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Media;
using Nexa.Domain.Media;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class MediaAssetRepository(NexaDbContext database) : IMediaAssetRepository
{
    public void Add(MediaAsset asset) => database.Set<MediaAsset>().Add(asset);
    public void Remove(MediaAsset asset) => database.Set<MediaAsset>().Remove(asset);

    public Task<MediaAsset?> FindOwnedAsync(Guid id, Guid ownerId, CancellationToken cancellationToken) =>
        database.Set<MediaAsset>().SingleOrDefaultAsync(asset => asset.Id == id && asset.OwnerId == ownerId, cancellationToken);

    public async Task<PagedResult<MediaAssetDto>> ListOwnedAsync(Guid ownerId, PageRequest page, CancellationToken cancellationToken)
    {
        var query = database.Set<MediaAsset>().AsNoTracking().Where(asset => asset.OwnerId == ownerId);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(asset => asset.CreatedAtUtc).ThenByDescending(asset => asset.Id)
            .Skip(page.Offset).Take(page.PageSize)
            .Select(asset => new MediaAssetDto(asset.Id, asset.Url, asset.FileName, asset.ContentType,
                asset.SizeBytes, asset.CreatedAtUtc)).ToListAsync(cancellationToken);
        return new PagedResult<MediaAssetDto>(items, page.Page, page.PageSize, total);
    }
}
