using System.ComponentModel.DataAnnotations;
using Nexa.Application.Common;

namespace Nexa.Application.Features.Articles;

public sealed record ArticleSeriesInput(
    [property: Required, StringLength(200)] string Title,
    [property: Required, StringLength(180)] string Slug,
    [property: Required(AllowEmptyStrings = true), StringLength(2000)] string Description);

public sealed record ReorderSeriesArticlesRequest([property: Required, MaxLength(100)] Guid[] ArticleIds);
public sealed record ArticleSeriesSummaryDto(Guid Id, Guid OwnerId, string Title, string Slug,
    string Description, int ArticleCount, DateTimeOffset UpdatedAtUtc);
public sealed record ArticleSeriesArticleDto(Guid ArticleId, string Title, string Slug, string Summary,
    DateTimeOffset? PublishedAtUtc, int Position);
public sealed record ArticleSeriesDto(Guid Id, Guid OwnerId, string OwnerName, string Title, string Slug,
    string Description, DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc,
    IReadOnlyList<ArticleSeriesArticleDto> Articles);
