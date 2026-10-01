using System.ComponentModel.DataAnnotations;
using Nexa.Application.Common;
using Nexa.Domain.Articles;

namespace Nexa.Application.Features.Articles;

public sealed record SubmitArticleReviewRequest(Guid Version, [property: StringLength(2000)] string? Note);
public sealed record DecideArticleReviewRequest(ArticleReviewStatus Status,
    [property: StringLength(2000)] string? Note);
public sealed record ArticleReviewDto(Guid Id, Guid ArticleId, Guid ArticleVersion, ArticleReviewStatus Status,
    string? SubmissionNote, string? ReviewNote, Guid? ReviewerId, DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? ReviewedAtUtc);
public sealed record ArticleReviewQueueItemDto(Guid Id, Guid ArticleId, string Title, string Slug,
    Guid AuthorId, string AuthorName, string AuthorUserName, Guid ArticleVersion,
    ArticleReviewStatus Status, string? SubmissionNote, DateTimeOffset SubmittedAtUtc);
