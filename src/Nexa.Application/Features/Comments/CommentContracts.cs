using System.ComponentModel.DataAnnotations;

namespace Nexa.Application.Features.Comments;

public sealed record CommentInput([property: Required, StringLength(5000)] string Body, Guid? ParentCommentId = null);
public sealed record UpdateCommentRequest(Guid Version, [property: Required, StringLength(5000)] string Body);
public sealed record CommentDto(Guid Id, Guid ArticleId, Guid AuthorId, Guid? ParentCommentId, string AuthorName, string Body,
    DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc, Guid Version);
public sealed record CreatedCommentDto(Guid Id, Guid Version);
