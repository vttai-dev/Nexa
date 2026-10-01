using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;
using Nexa.Domain.Taxonomy;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Articles;

public sealed class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.ToTable("articles", "content", table =>
        {
            table.HasCheckConstraint("ck_articles_status", "status IN ('Draft', 'Published', 'Archived')");
            table.HasCheckConstraint("ck_articles_published", "status <> 'Published' OR published_at_utc IS NOT NULL");
            table.HasCheckConstraint("ck_articles_featured", "is_featured = false OR status = 'Published'");
        });
        builder.HasKey(article => article.Id);
        builder.Property(article => article.Id).ValueGeneratedNever();
        builder.Property(article => article.Title).HasMaxLength(200);
        builder.Property(article => article.Slug).HasMaxLength(180);
        builder.Property(article => article.Summary).HasMaxLength(500);
        builder.Property(article => article.BodyMarkdown).HasColumnType("text");
        builder.Property(article => article.MetaTitle).HasMaxLength(200);
        builder.Property(article => article.MetaDescription).HasMaxLength(500);
        builder.Property(article => article.Keywords).HasMaxLength(500);
        builder.Property(article => article.CanonicalUrl).HasMaxLength(2048);
        builder.Property(article => article.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(article => article.ViewCount).HasDefaultValue(0);
        builder.Property(article => article.ShareCount).HasDefaultValue(0);
        builder.Property(article => article.IsFeatured).HasDefaultValue(false);
        builder.Property(article => article.Version).IsConcurrencyToken();
        builder.HasIndex(article => article.Slug).IsUnique();
        builder.HasIndex(article => new { article.Status, article.PublishedAtUtc, article.Id });
        builder.HasIndex(article => new { article.AuthorId, article.CreatedAtUtc, article.Id });
        builder.HasIndex(article => new { article.IsFeatured, article.FeaturedAtUtc, article.Id });
        builder.HasIndex(article => new { article.Title, article.Summary, article.BodyMarkdown })
            .HasMethod("GIN").IsTsVectorExpressionIndex("simple");
        builder.HasOne<User>().WithMany().HasForeignKey(article => article.AuthorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Category>().WithMany().HasForeignKey(article => article.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(article => article.Tags).WithOne().HasForeignKey(tag => tag.ArticleId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(article => article.Tags).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
