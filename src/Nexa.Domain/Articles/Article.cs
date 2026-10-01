using Nexa.Domain.Common;

namespace Nexa.Domain.Articles;

public sealed class Article : Entity
{
    private readonly List<ArticleTag> _tags = [];
    private Article() { }

    public Article(Guid authorId, string title, string slug, string summary, string bodyMarkdown,
        Guid? categoryId, IEnumerable<Guid> tagIds, DateTimeOffset now)
    {
        AuthorId = Guard.Identifier(authorId, "Author");
        CreatedAtUtc = now;
        Update(title, slug, summary, bodyMarkdown, categoryId, tagIds, now);
    }

    public Guid AuthorId { get; private set; }
    public Guid? CategoryId { get; private set; }
    public string Title { get; private set; } = "";
    public string Slug { get; private set; } = "";
    public string Summary { get; private set; } = "";
    public string BodyMarkdown { get; private set; } = "";
    public string? MetaTitle { get; private set; }
    public string? MetaDescription { get; private set; }
    public string? Keywords { get; private set; }
    public string? CanonicalUrl { get; private set; }
    public ArticleStatus Status { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }
    public DateTimeOffset? PublishedAtUtc { get; private set; }
    public bool IsFeatured { get; private set; }
    public DateTimeOffset? FeaturedAtUtc { get; private set; }
    public int ViewCount { get; private set; }
    public int ShareCount { get; private set; }
    public Guid Version { get; private set; }
    public IReadOnlyCollection<ArticleTag> Tags => _tags.AsReadOnly();

    public void Update(string title, string slug, string summary, string bodyMarkdown,
        Guid? categoryId, IEnumerable<Guid> tagIds, DateTimeOffset now)
    {
        if (Status == ArticleStatus.Archived)
            throw new DomainException("An archived article cannot be edited.");
        var normalizedSlug = Guard.Slug(slug);
        if (Status == ArticleStatus.Published && Slug != normalizedSlug)
            throw new DomainException("The slug of a published article cannot change.");
        if (Status == ArticleStatus.Published && string.IsNullOrWhiteSpace(bodyMarkdown))
            throw new DomainException("A published article requires content.");
        Title = Guard.Required(title, 200, "Title");
        Slug = normalizedSlug;
        Summary = Guard.Text(summary, 500, "Summary");
        BodyMarkdown = Guard.Text(bodyMarkdown, 200_000, "Content");
        CategoryId = categoryId.HasValue ? Guard.Identifier(categoryId.Value, "Category") : null;
        var selectedTags = tagIds.Select(tagId => Guard.Identifier(tagId, "Tag")).Distinct().ToHashSet();
        if (selectedTags.Count > 10)
            throw new DomainException("An article can have at most 10 tags.");
        _tags.RemoveAll(tag => !selectedTags.Contains(tag.TagId));
        foreach (var tagId in selectedTags.Where(tagId => _tags.All(tag => tag.TagId != tagId)))
            _tags.Add(new ArticleTag(Id, tagId));
        Touch(now);
    }

    public void Publish(DateTimeOffset now)
    {
        if (Status != ArticleStatus.Draft)
            throw new DomainException("Only draft articles can be published.");
        Guard.Required(BodyMarkdown, 200_000, "Content");
        Status = ArticleStatus.Published;
        PublishedAtUtc = now;
        Touch(now);
    }

    public void Archive(DateTimeOffset now)
    {
        Status = ArticleStatus.Archived;
        Touch(now);
    }

    public void SetFeatured(bool featured, DateTimeOffset now)
    {
        if (Status != ArticleStatus.Published)
            throw new DomainException("Only published articles can be featured.");
        if (IsFeatured == featured)
            return;
        IsFeatured = featured;
        FeaturedAtUtc = featured ? now : null;
        Touch(now);
    }

    public void RecordView()
    {
        if (Status != ArticleStatus.Published)
            throw new DomainException("Only published articles can record views.");
        ViewCount++;
    }

    public void RecordShare()
    {
        if (Status != ArticleStatus.Published)
            throw new DomainException("Only published articles can record shares.");
        ShareCount++;
    }

    public void UpdateSeo(string? metaTitle, string? metaDescription, string? keywords, string? canonicalUrl,
        DateTimeOffset now)
    {
        if (Status == ArticleStatus.Archived)
            throw new DomainException("An archived article cannot be edited.");
        MetaTitle = string.IsNullOrWhiteSpace(metaTitle) ? null : Guard.Required(metaTitle, 200, "Meta title");
        MetaDescription = string.IsNullOrWhiteSpace(metaDescription) ? null : Guard.Required(metaDescription, 500, "Meta description");
        Keywords = string.IsNullOrWhiteSpace(keywords) ? null : Guard.Required(keywords, 500, "Keywords");
        CanonicalUrl = Guard.WebUrl(canonicalUrl, "Canonical URL");
        Touch(now);
    }

    private void Touch(DateTimeOffset now)
    {
        UpdatedAtUtc = now;
        Version = Guid.NewGuid();
    }
}
