using System.Text.RegularExpressions;
using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Comments;
using Nexa.Domain.Notifications;

namespace Nexa.Application.Features.Comments;

public sealed partial class CommentHandler(ICommentRepository repository, IArticleRepository articles,
    IProfileRepository profiles, INotificationRepository notifications, ICurrentUser currentUser,
    IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<Result<PagedResult<CommentDto>>> ListAsync(Guid articleId, PageRequest page, CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<CommentDto>>.Failure(PageRequest.Invalid);
        if (!await articles.IsPublishedAsync(articleId, cancellationToken))
            return Result<PagedResult<CommentDto>>.Failure(Error.Missing("Article"));
        return Result<PagedResult<CommentDto>>.Success(await repository.ListAsync(articleId, page, cancellationToken));
    }

    public async Task<Result<PagedResult<CommentDto>>> ListByArticleSlugAsync(string slug, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<CommentDto>>.Failure(PageRequest.Invalid);
        var article = await articles.FindPublishedAsync(slug, cancellationToken);
        return article is null ? Result<PagedResult<CommentDto>>.Failure(Error.Missing("Article"))
            : Result<PagedResult<CommentDto>>.Success(await repository.ListAsync(article.Id, page, cancellationToken));
    }

    public async Task<Result<PagedResult<CommentDto>>> ListRepliesAsync(Guid parentCommentId, PageRequest page,
        CancellationToken cancellationToken)
    {
        if (!page.IsValid)
            return Result<PagedResult<CommentDto>>.Failure(PageRequest.Invalid);
        var parent = await repository.FindAsync(parentCommentId, cancellationToken);
        if (parent is null || parent.ParentCommentId is not null || !await articles.IsPublishedAsync(parent.ArticleId, cancellationToken))
            return Result<PagedResult<CommentDto>>.Failure(Error.Missing("Comment"));
        return Result<PagedResult<CommentDto>>.Success(await repository.ListRepliesAsync(parentCommentId, page, cancellationToken));
    }

    public async Task<Result<PagedResult<CommentDto>>> ListRecentAsync(PageRequest page, Guid? articleId, Guid? authorId,
        CancellationToken cancellationToken)
    {
        if (!currentUser.CanModerate)
            return Result<PagedResult<CommentDto>>.Failure(Error.Forbidden);
        return !page.IsValid ? Result<PagedResult<CommentDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<CommentDto>>.Success(await repository.ListRecentAsync(page, articleId, authorId, cancellationToken));
    }

    public async Task<Result<PagedResult<CommentDto>>> MineAsync(PageRequest page, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<PagedResult<CommentDto>>.Failure(Error.Unauthorized);
        return !page.IsValid ? Result<PagedResult<CommentDto>>.Failure(PageRequest.Invalid)
            : Result<PagedResult<CommentDto>>.Success(await repository.ListByAuthorAsync(userId, page, cancellationToken));
    }

    public async Task<Result<CreatedCommentDto>> CreateAsync(Guid articleId, CommentInput request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<CreatedCommentDto>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<CreatedCommentDto>.Failure(error);
        var target = await articles.NotificationTargetAsync(articleId, cancellationToken);
        if (target is null)
            return Result<CreatedCommentDto>.Failure(Error.Missing("Article"));
        return await CreateForTargetAsync(target, userId, request.Body, request.ParentCommentId, cancellationToken);
    }

    public async Task<Result<CreatedCommentDto>> CreateByArticleSlugAsync(string slug, CommentInput request,
        CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<CreatedCommentDto>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<CreatedCommentDto>.Failure(error);
        var article = await articles.FindPublishedAsync(slug, cancellationToken);
        if (article is null)
            return Result<CreatedCommentDto>.Failure(Error.Missing("Article"));
        var target = await articles.NotificationTargetAsync(article.Id, cancellationToken);
        return target is null ? Result<CreatedCommentDto>.Failure(Error.Missing("Article"))
            : await CreateForTargetAsync(target, userId, request.Body, request.ParentCommentId, cancellationToken);
    }

    private async Task<Result<CreatedCommentDto>> CreateForTargetAsync(ArticleNotificationTargetDto target, Guid userId, string body,
        Guid? parentCommentId, CancellationToken cancellationToken)
    {
        Comment? parent = null;
        if (parentCommentId.HasValue)
        {
            parent = await repository.FindAsync(parentCommentId.Value, cancellationToken);
            if (parent is null || parent.ArticleId != target.Id || parent.ParentCommentId is not null)
                return Result<CreatedCommentDto>.Failure(Error.Missing("Parent comment"));
        }
        var comment = new Comment(target.Id, userId, body, clock.GetUtcNow(), parentCommentId);
        repository.Add(comment);
        var now = clock.GetUtcNow();
        if (target.AuthorId != userId)
            notifications.Add(new Notification(target.AuthorId, NotificationType.ArticleCommented,
                $"Your article '{target.Title}' has a new comment.", now, userId, target.Id, comment.Id));
        if (parent is not null && parent.AuthorId != userId && parent.AuthorId != target.AuthorId)
            notifications.Add(new Notification(parent.AuthorId, NotificationType.CommentReplied,
                $"Someone replied to your comment on '{target.Title}'.", now, userId, target.Id, comment.Id));
        foreach (var mention in await profiles.MentionTargetsAsync(ExtractMentions(body), cancellationToken))
        {
            if (mention.UserId == userId || mention.UserId == target.AuthorId)
                continue;
            notifications.Add(new Notification(mention.UserId, NotificationType.Mentioned,
                $"You were mentioned in a comment on '{target.Title}'.", now, userId, target.Id, comment.Id));
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<CreatedCommentDto>.Success(new CreatedCommentDto(comment.Id, comment.Version));
    }

    public async Task<Result<Unit>> UpdateAsync(Guid id, UpdateCommentRequest request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        if (RequestValidation.Validate(request) is { } error)
            return Result<Unit>.Failure(error);
        var comment = await repository.FindAsync(id, cancellationToken);
        if (comment is null || !await articles.IsPublishedAsync(comment.ArticleId, cancellationToken))
            return Result<Unit>.Failure(Error.Missing("Comment"));
        if (comment.AuthorId != userId)
            return Result<Unit>.Failure(Error.Forbidden);
        if (comment.Version != request.Version)
            return Result<Unit>.Failure(Error.StaleVersion);
        comment.Update(request.Body, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> DeleteAsync(Guid id, Guid version, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
            return Result<Unit>.Failure(Error.Unauthorized);
        var comment = await repository.FindAsync(id, cancellationToken);
        if (comment is null)
            return Result<Unit>.Failure(Error.Missing("Comment"));
        if (comment.AuthorId != userId && !currentUser.CanModerate)
            return Result<Unit>.Failure(Error.Forbidden);
        if (comment.Version != version)
            return Result<Unit>.Failure(Error.StaleVersion);
        comment.Delete(clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    private static string[] ExtractMentions(string body) => MentionRegex().Matches(body)
        .Select(match => match.Groups["userName"].Value)
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .Take(20)
        .ToArray();

    [GeneratedRegex(@"(?<![\w@])@(?<userName>[A-Za-z0-9_]{3,30})", RegexOptions.CultureInvariant)]
    private static partial Regex MentionRegex();
}
