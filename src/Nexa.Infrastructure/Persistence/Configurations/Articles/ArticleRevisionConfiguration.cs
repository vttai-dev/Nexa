using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Articles;

public sealed class ArticleRevisionConfiguration : IEntityTypeConfiguration<ArticleRevision>
{
    public void Configure(EntityTypeBuilder<ArticleRevision> builder)
    {
        builder.ToTable("article_revisions", "content", table =>
        {
            table.HasCheckConstraint("ck_article_revisions_action",
                "action IN ('Created', 'Updated', 'Published', 'Archived', 'Restored')");
            table.HasCheckConstraint("ck_article_revisions_status", "status IN ('Draft', 'Published', 'Archived')");
        });
        builder.HasKey(revision => revision.Id);
        builder.Property(revision => revision.Id).ValueGeneratedNever();
        builder.Property(revision => revision.Action).HasConversion<string>().HasMaxLength(20);
        builder.Property(revision => revision.Title).HasMaxLength(200);
        builder.Property(revision => revision.Slug).HasMaxLength(180);
        builder.Property(revision => revision.Summary).HasMaxLength(500);
        builder.Property(revision => revision.BodyMarkdown).HasColumnType("text");
        builder.Property(revision => revision.TagIds).HasColumnType("uuid[]");
        builder.Property(revision => revision.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(revision => new { revision.ArticleId, revision.CreatedAtUtc, revision.Id });
        builder.HasOne<Article>().WithMany().HasForeignKey(revision => revision.ArticleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<User>().WithMany().HasForeignKey(revision => revision.EditorId).OnDelete(DeleteBehavior.Restrict);
    }
}
