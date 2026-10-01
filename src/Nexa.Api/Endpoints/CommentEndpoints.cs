using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Comments;

namespace Nexa.Api.Endpoints;

public static class CommentEndpoints
{
    public static void MapCommentEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/articles/{id:guid}/comments", async (Guid id, int? page, int? pageSize,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListAsync(id, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithTags("Comments").WithName("ListComments").Produces<PagedResult<CommentDto>>();

        api.MapGet("/articles/{slug}/comments", async (string slug, int? page, int? pageSize,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListByArticleSlugAsync(slug, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithTags("Comments").WithName("ListCommentsByArticleSlug").Produces<PagedResult<CommentDto>>();

        api.MapGet("/comments/{id:guid}/replies", async (Guid id, int? page, int? pageSize,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListRepliesAsync(id, new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .WithTags("Comments").WithName("ListCommentReplies").Produces<PagedResult<CommentDto>>();

        api.MapPost("/articles/{id:guid}/comments", async (Guid id, CommentInput request,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CreateAsync(id, request, cancellationToken)).ToHttpResult(context,
                comment => Results.Json(comment, statusCode: 201)))
            .RequireAuthorization().RequireRateLimiting("content-write").WithTags("Comments").WithName("CreateComment").Produces<CreatedCommentDto>(201);

        api.MapPost("/articles/{slug}/comments", async (string slug, CommentInput request,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.CreateByArticleSlugAsync(slug, request, cancellationToken)).ToHttpResult(context,
                comment => Results.Json(comment, statusCode: 201)))
            .RequireAuthorization().RequireRateLimiting("content-write").WithTags("Comments").WithName("CreateCommentByArticleSlug").Produces<CreatedCommentDto>(201);

        api.MapPut("/comments/{id:guid}", async (Guid id, UpdateCommentRequest request,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.UpdateAsync(id, request, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().RequireRateLimiting("content-write").WithTags("Comments").WithName("UpdateComment").Produces(204);

        api.MapDelete("/comments/{id:guid}", async (Guid id, Guid version,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.DeleteAsync(id, version, cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().RequireRateLimiting("content-write").WithTags("Comments").WithName("DeleteComment").Produces(204);

        api.MapGet("/me/comments", async (int? page, int? pageSize,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.MineAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Comments").WithName("ListMyComments").Produces<PagedResult<CommentDto>>();

        api.MapGet("/admin/comments", async (int? page, int? pageSize, Guid? articleId, Guid? authorId,
            CommentHandler handler, HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListRecentAsync(new PageRequest(page ?? 1, pageSize ?? 20), articleId, authorId, cancellationToken))
            .ToHttpResult(context))
            .RequireAuthorization("Moderation").WithTags("Admin", "Comments").WithName("ListRecentComments")
            .Produces<PagedResult<CommentDto>>();
    }
}
