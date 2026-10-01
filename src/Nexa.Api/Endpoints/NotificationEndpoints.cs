using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Notifications;
using Nexa.Application.Abstractions.Identity;
using Nexa.Api.Services;

namespace Nexa.Api.Endpoints;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this RouteGroupBuilder api)
    {
        var notifications = api.MapGroup("/notifications").RequireAuthorization().WithTags("Notifications");
        notifications.MapGet("/stream", async (HttpContext context, ICurrentUser currentUser,
            NotificationEventBus eventBus) =>
        {
            if (currentUser.Id is not { } recipientId)
                return Results.Unauthorized();
            using var subscription = eventBus.Subscribe(recipientId);
            context.Response.ContentType = "text/event-stream";
            context.Response.Headers.CacheControl = "no-cache";
            context.Response.Headers.Connection = "keep-alive";
            context.Response.Headers["X-Accel-Buffering"] = "no";
            await context.Response.WriteAsync(": connected\n\n", context.RequestAborted);
            await context.Response.Body.FlushAsync(context.RequestAborted);
            try
            {
                while (!context.RequestAborted.IsCancellationRequested)
                {
                    using var waitCancellation = CancellationTokenSource.CreateLinkedTokenSource(context.RequestAborted);
                    var notificationAvailable = subscription.Reader.WaitToReadAsync(waitCancellation.Token).AsTask();
                    var heartbeat = Task.Delay(TimeSpan.FromSeconds(15), waitCancellation.Token);
                    var completed = await Task.WhenAny(notificationAvailable, heartbeat);
                    waitCancellation.Cancel();
                    if (completed == notificationAvailable)
                    {
                        if (!await notificationAvailable)
                            break;
                        while (subscription.Reader.TryRead(out _))
                        {
                            await context.Response.WriteAsync("event: notification\ndata: refresh\n\n", context.RequestAborted);
                            await context.Response.Body.FlushAsync(context.RequestAborted);
                        }
                        continue;
                    }
                    await heartbeat;
                    await context.Response.WriteAsync(": keep-alive\n\n", context.RequestAborted);
                    await context.Response.Body.FlushAsync(context.RequestAborted);
                }
            }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
            }
            return Results.Empty;
        }).WithName("StreamNotifications").Produces(200);

        notifications.MapGet("/", async (bool? unreadOnly, int? page, int? pageSize, NotificationHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListAsync(unreadOnly, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithName("ListNotifications").Produces<PagedResult<NotificationDto>>();

        notifications.MapGet("/unread-count", async (NotificationHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.UnreadCountAsync(cancellationToken)).ToHttpResult(context))
            .WithName("GetUnreadNotificationCount").Produces<NotificationUnreadCountDto>();

        notifications.MapPost("/{id:guid}/read", async (Guid id, NotificationHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.MarkReadAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("MarkNotificationRead").Produces(204);

        notifications.MapPost("/read-all", async (NotificationHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.MarkAllReadAsync(cancellationToken)).ToHttpResult(context))
            .WithName("MarkAllNotificationsRead").Produces(204);

        notifications.MapDelete("/{id:guid}", async (Guid id, NotificationHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.DeleteAsync(id, cancellationToken)).ToHttpResult(context))
            .WithName("DeleteNotification").Produces(204);

        notifications.MapDelete("/read", async (NotificationHandler handler, HttpContext context,
            CancellationToken cancellationToken) =>
            (await handler.DeleteReadAsync(cancellationToken)).ToHttpResult(context))
            .WithName("DeleteReadNotifications").Produces<DeletedNotificationsDto>();
    }
}
