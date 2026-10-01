using Nexa.Domain.Articles;
using Nexa.Domain.Common;

namespace Nexa.Domain.Tests;

public sealed class ArticleTests
{
    private static Article Create(string content = "Example content") =>
        new(Guid.NewGuid(), "First article", "first-article", "", content, null, [], DateTimeOffset.UtcNow);

    [Fact]
    public void Publish_requires_content()
    {
        var article = Create("");
        Assert.Throws<DomainException>(() => article.Publish(DateTimeOffset.UtcNow));
        Assert.Equal(ArticleStatus.Draft, article.Status);
    }

    [Fact]
    public void Publish_sets_date_and_changes_version()
    {
        var article = Create();
        var oldVersion = article.Version;
        var now = DateTimeOffset.UtcNow;
        article.Publish(now);
        Assert.Equal(ArticleStatus.Published, article.Status);
        Assert.Equal(now, article.PublishedAtUtc);
        Assert.NotEqual(oldVersion, article.Version);
    }

    [Fact]
    public void Share_count_increments_only_for_published_articles()
    {
        var article = Create();
        Assert.Throws<DomainException>(article.RecordShare);
        Assert.Equal(0, article.ShareCount);

        article.Publish(DateTimeOffset.UtcNow);
        article.RecordShare();
        article.RecordShare();

        Assert.Equal(2, article.ShareCount);
    }

    [Fact]
    public void Published_slug_cannot_change()
    {
        var article = Create();
        article.Publish(DateTimeOffset.UtcNow);
        Assert.Throws<DomainException>(() =>
            article.Update("Title", "different", "", "Content", null, [], DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Archived_article_cannot_be_edited()
    {
        var article = Create();
        article.Archive(DateTimeOffset.UtcNow);
        Assert.Throws<DomainException>(() =>
            article.Update("Title", "first-article", "", "Content", null, [], DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Updating_tags_keeps_only_distinct_selected_tags()
    {
        var article = Create();
        var tagId = Guid.NewGuid();
        article.Update("Title", article.Slug, "", "Content", null, [tagId, tagId], DateTimeOffset.UtcNow);
        Assert.Single(article.Tags);
        article.Update("Title", article.Slug, "", "Content", null, [], DateTimeOffset.UtcNow);
        Assert.Empty(article.Tags);
    }
}
