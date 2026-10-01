using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Comments;
using Nexa.Domain.Comments;

namespace Nexa.Infrastructure.Persistence.Repositories;

public sealed class CommentRepository(NexaDbContext database) : ICommentRepository
{
    public void Add(Comment comment) => database.Comments.Add(comment);
    public Task<Comment?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        database.Comments.SingleOrDefaultAsync(comment => comment.Id == id, cancellationToken);

    public async Task<PagedResult<CommentDto>> ListAsync(Guid articleId, PageRequest page, CancellationToken cancellationToken)
    {
        var query = database.Comments.AsNoTracking().Where(comment => comment.ArticleId == articleId
            && comment.ParentCommentId == null && comment.DeletedAtUtc == null);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(comment => comment.CreatedAtUtc).ThenBy(comment => comment.Id)
            .Skip(page.Offset).Take(page.PageSize).Select(comment =>
                new CommentDto(comment.Id, comment.ArticleId, comment.AuthorId, comment.ParentCommentId,
                    database.Profiles.Where(profile => profile.UserId == comment.AuthorId).Select(profile => profile.DisplayName).First(),
                    comment.Body, comment.CreatedAtUtc, comment.UpdatedAtUtc, comment.Version)).ToListAsync(cancellationToken);
        return new PagedResult<CommentDto>(items, page.Page, page.PageSize, total);
    }

    public async Task<PagedResult<CommentDto>> ListRepliesAsync(Guid parentCommentId, PageRequest page,
        CancellationToken cancellationToken)
    {
        var query = database.Comments.AsNoTracking().Where(comment => comment.ParentCommentId == parentCommentId
            && comment.DeletedAtUtc == null);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(comment => comment.CreatedAtUtc).ThenBy(comment => comment.Id)
            .Skip(page.Offset).Take(page.PageSize).Select(comment =>
                new CommentDto(comment.Id, comment.ArticleId, comment.AuthorId, comment.ParentCommentId,
                    database.Profiles.Where(profile => profile.UserId == comment.AuthorId).Select(profile => profile.DisplayName).First(),
                    comment.Body, comment.CreatedAtUtc, comment.UpdatedAtUtc, comment.Version)).ToListAsync(cancellationToken);
        return new PagedResult<CommentDto>(items, page.Page, page.PageSize, total);
    }

    public async Task<PagedResult<CommentDto>> ListRecentAsync(PageRequest page, Guid? articleId, Guid? authorId,
        CancellationToken cancellationToken)
    {
        var query = database.Comments.AsNoTracking().Where(comment => comment.DeletedAtUtc == null);
        if (articleId.HasValue)
            query = query.Where(comment => comment.ArticleId == articleId.Value);
        if (authorId.HasValue)
            query = query.Where(comment => comment.AuthorId == authorId.Value);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(comment => comment.CreatedAtUtc).ThenByDescending(comment => comment.Id)
            .Skip(page.Offset).Take(page.PageSize).Select(comment =>
                new CommentDto(comment.Id, comment.ArticleId, comment.AuthorId, comment.ParentCommentId,
                    database.Profiles.Where(profile => profile.UserId == comment.AuthorId).Select(profile => profile.DisplayName).First(),
                    comment.Body, comment.CreatedAtUtc, comment.UpdatedAtUtc, comment.Version)).ToListAsync(cancellationToken);
        return new PagedResult<CommentDto>(items, page.Page, page.PageSize, total);
    }

    public async Task<PagedResult<CommentDto>> ListByAuthorAsync(Guid authorId, PageRequest page, CancellationToken cancellationToken)
    {
        var query = database.Comments.AsNoTracking().Where(comment => comment.AuthorId == authorId && comment.DeletedAtUtc == null);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(comment => comment.CreatedAtUtc).ThenByDescending(comment => comment.Id)
            .Skip(page.Offset).Take(page.PageSize).Select(comment =>
                new CommentDto(comment.Id, comment.ArticleId, comment.AuthorId, comment.ParentCommentId,
                    database.Profiles.Where(profile => profile.UserId == comment.AuthorId).Select(profile => profile.DisplayName).First(),
                    comment.Body, comment.CreatedAtUtc, comment.UpdatedAtUtc, comment.Version)).ToListAsync(cancellationToken);
        return new PagedResult<CommentDto>(items, page.Page, page.PageSize, total);
    }
}
