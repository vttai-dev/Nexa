using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;

namespace Nexa.Application.Features.Notifications;

public sealed class NotificationHandler(INotificationRepository notifications, ICurrentUser currentUser,
    IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<Result<PagedResult<NotificationDto>>> ListAsync(bool? unreadOnly, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<NotificationDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<NotificationDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<NotificationDto>>.Success(await notifications.ListAsync(userId, unreadOnly == true, page, cancellationToken));
    }

    public async Task<Result<NotificationUnreadCountDto>> UnreadCountAsync(CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<NotificationUnreadCountDto>.Failure(Error.Unauthorized);
        return Result<NotificationUnreadCountDto>.Success(new NotificationUnreadCountDto(
            await notifications.UnreadCountAsync(userId, cancellationToken)));
    }

    public async Task<Result<Unit>> MarkReadAsync(Guid id, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var notification = await notifications.FindForRecipientAsync(id, userId, cancellationToken);
        if (notification is null)
            return Result<Unit>.Failure(Error.Missing("Notification"));
        notification.MarkRead(clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> MarkAllReadAsync(CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        await notifications.MarkAllReadAsync(userId, clock.GetUtcNow(), cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        return await notifications.DeleteForRecipientAsync(id, userId, cancellationToken)
            ? Result<Unit>.Success(Unit.Value)
            : Result<Unit>.Failure(Error.Missing("Notification"));
    }

    public async Task<Result<DeletedNotificationsDto>> DeleteReadAsync(CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<DeletedNotificationsDto>.Failure(Error.Unauthorized);
        var deleted = await notifications.DeleteReadAsync(userId, cancellationToken);
        return Result<DeletedNotificationsDto>.Success(new DeletedNotificationsDto(deleted));
    }
}
