using Nexa.Application.Common;
using Nexa.Application.Features.Comments;
using Nexa.Domain.Comments;

namespace Nexa.Application.Abstractions.Persistence;

public interface ICommentRepository
{
    void Add(Comment comment);
    Task<Comment?> FindAsync(Guid id, CancellationToken cancellationToken);
    Task<PagedResult<CommentDto>> ListAsync(Guid articleId, PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<CommentDto>> ListRepliesAsync(Guid parentCommentId, PageRequest page, CancellationToken cancellationToken);
    Task<PagedResult<CommentDto>> ListRecentAsync(PageRequest page, Guid? articleId, Guid? authorId,
        CancellationToken cancellationToken);
    Task<PagedResult<CommentDto>> ListByAuthorAsync(Guid authorId, PageRequest page, CancellationToken cancellationToken);
}
