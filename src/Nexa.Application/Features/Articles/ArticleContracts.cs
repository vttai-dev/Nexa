using System.ComponentModel.DataAnnotations;
using Nexa.Application.Common;
using Nexa.Domain.Articles;

namespace Nexa.Application.Features.Articles;

public sealed record ArticleInput(
    [property: Required, StringLength(200)] string Title,
    [property: Required, StringLength(180)] string Slug,
    [property: Required(AllowEmptyStrings = true), StringLength(500)] string Summary,
    [property: Required(AllowEmptyStrings = true), StringLength(200000)] string BodyMarkdown,
    Guid? CategoryId,
    [property: Required, MaxLength(10)] Guid[] TagIds);

public sealed record UpdateArticleRequest(
    Guid Version,
    [property: Required] ArticleInput Article);

public sealed record AutosaveArticleRequest(Guid Version, [property: Required] ArticleInput Article);

public sealed record VersionRequest(Guid Version);
public sealed record ArticleFilter(PageRequest Pagination, Guid? CategoryId = null, Guid? TagId = null, Guid? AuthorId = null,
    DateTimeOffset? PublishedFromUtc = null, DateTimeOffset? PublishedToUtc = null);
public sealed record ArticleSummaryDto(Guid Id, string Title, string Slug, string Summary, Guid AuthorId,
    string AuthorName, ArticleStatus Status, DateTimeOffset? PublishedAtUtc, Guid Version, bool IsFeatured = false,
    int ViewCount = 0, int LikeCount = 0, int CommentCount = 0, int ShareCount = 0);
public sealed record ArticleNotificationTargetDto(Guid Id, Guid AuthorId, string Title, string Slug);
public sealed record ArticleDto(Guid Id, string Title, string Slug, string Summary, string BodyMarkdown,
    Guid AuthorId, string AuthorName, Guid? CategoryId, IReadOnlyList<Guid> TagIds, ArticleStatus Status,
    DateTimeOffset CreatedAtUtc, DateTimeOffset UpdatedAtUtc, DateTimeOffset? PublishedAtUtc, Guid Version,
    int LikeCount, int CommentCount, int ViewCount, bool IsFeatured = false, int ShareCount = 0);
public sealed record ArticleMetadataDto(Guid Id, string Title, string Slug, int ViewCount, int LikeCount,
    int CommentCount, int BookmarkCount, int WordCount, int ReadingTimeMinutes,
    DateTimeOffset UpdatedAtUtc, DateTimeOffset? PublishedAtUtc,
    string? MetaTitle, string? MetaDescription, string? Keywords, string? CanonicalUrl, int ShareCount = 0);
public sealed record ArticleArchiveMonthDto(int Year, int Month, int Count);
public sealed record SlugAvailabilityDto(string Slug, bool Available);
public sealed record ArticleRevisionSummaryDto(Guid Id, Guid ArticleId, ArticleRevisionAction Action, Guid EditorId,
    ArticleStatus Status, string Title, string Slug, Guid ArticleVersion, DateTimeOffset CreatedAtUtc);
public sealed record ArticleRevisionDto(Guid Id, Guid ArticleId, ArticleRevisionAction Action, Guid EditorId,
    ArticleStatus Status, string Title, string Slug, string Summary, string BodyMarkdown, Guid? CategoryId,
    IReadOnlyList<Guid> TagIds, Guid ArticleVersion, DateTimeOffset CreatedAtUtc);
public sealed record ArticleRevisionCompareDto(
    ArticleRevisionDto From,
    ArticleRevisionDto To,
    bool TitleChanged,
    bool SlugChanged,
    bool SummaryChanged,
    bool BodyChanged,
    bool CategoryChanged,
    bool TagsChanged);
public sealed record RestoreArticleRevisionRequest(Guid Version);
public sealed record ArticleSeoRequest(Guid Version,
    [property: StringLength(200)] string? MetaTitle,
    [property: StringLength(500)] string? MetaDescription,
    [property: StringLength(500)] string? Keywords,
    [property: StringLength(2048)] string? CanonicalUrl);
public sealed record ArticleSeoDto(Guid Id, Guid Version, string? MetaTitle, string? MetaDescription,
    string? Keywords, string? CanonicalUrl, DateTimeOffset UpdatedAtUtc);
public sealed record CreatedArticleDto(Guid Id, string Slug, Guid Version);
public sealed record AutosavedArticleDto(Guid Id, Guid Version, DateTimeOffset SavedAtUtc);
