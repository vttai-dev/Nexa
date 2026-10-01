using System.ComponentModel.DataAnnotations;

namespace Nexa.Application.Features.Taxonomy;

public sealed record CategoryInput(
    [property: Required, StringLength(100)] string Name,
    [property: Required, StringLength(180)] string Slug,
    [property: Required(AllowEmptyStrings = true), StringLength(1000)] string Description);

public sealed record TagInput(
    [property: Required, StringLength(50)] string Name,
    [property: Required, StringLength(180)] string Slug);

public sealed record CategoryDto(Guid Id, string Name, string Slug, string Description);
public sealed record CategoryStatsDto(Guid Id, string Name, string Slug, string Description, int PublishedArticleCount);
public sealed record TagDto(Guid Id, string Name, string Slug);
public sealed record TagStatsDto(Guid Id, string Name, string Slug, int PublishedArticleCount, int FollowerCount);
public sealed record TagTrendDto(Guid Id, string Name, string Slug, int PublishedArticleCount,
    int FollowerCount, int PeriodDays);
public sealed record TaxonomySlugAvailabilityDto(string Slug, bool Available);
public sealed record CreatedIdDto(Guid Id);
