using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Domain.Media;

namespace Nexa.Application.Features.Media;

public sealed class MediaHandler(IMediaAssetRepository repository, ICurrentUser currentUser,
    IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<Result<MediaAssetDto>> CreateAsync(CreateMediaAssetRequest request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<MediaAssetDto>.Failure(Error.Unauthorized);
        var asset = new MediaAsset(ownerId, request.Url, request.StoragePath, request.FileName,
            request.ContentType, request.SizeBytes, clock.GetUtcNow());
        repository.Add(asset);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<MediaAssetDto>.Success(ToDto(asset));
    }

    public async Task<Result<PagedResult<MediaAssetDto>>> ListMineAsync(PageRequest page, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<PagedResult<MediaAssetDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<MediaAssetDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<MediaAssetDto>>.Success(await repository.ListOwnedAsync(ownerId, page, cancellationToken));
    }

    public async Task<Result<string>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } ownerId)
            return Result<string>.Failure(Error.Unauthorized);
        var asset = await repository.FindOwnedAsync(id, ownerId, cancellationToken);
        if (asset is null)
            return Result<string>.Failure(Error.Missing("Media asset"));
        var storagePath = asset.StoragePath;
        repository.Remove(asset);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<string>.Success(storagePath);
    }

    private static MediaAssetDto ToDto(MediaAsset asset) =>
        new(asset.Id, asset.Url, asset.FileName, asset.ContentType, asset.SizeBytes, asset.CreatedAtUtc);
}
