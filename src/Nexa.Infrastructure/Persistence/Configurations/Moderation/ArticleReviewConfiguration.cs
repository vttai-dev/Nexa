using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Moderation;

public sealed class ArticleReviewConfiguration : IEntityTypeConfiguration<ArticleReview>
{
    public void Configure(EntityTypeBuilder<ArticleReview> builder)
    {
        builder.ToTable("article_reviews", "moderation", table =>
            table.HasCheckConstraint("ck_article_reviews_status", "status IN ('Pending', 'Approved', 'Rejected', 'Withdrawn')"));
        builder.HasKey(review => review.Id);
        builder.Property(review => review.Id).ValueGeneratedNever();
        builder.Property(review => review.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(review => review.SubmissionNote).HasMaxLength(2000);
        builder.Property(review => review.ReviewNote).HasMaxLength(2000);
        builder.HasIndex(review => new { review.Status, review.SubmittedAtUtc, review.Id });
        builder.HasIndex(review => new { review.ArticleId, review.SubmittedAtUtc });
        builder.HasIndex(review => review.ArticleId).IsUnique().HasFilter("status = 'Pending'");
        builder.HasOne<Article>().WithMany().HasForeignKey(review => review.ArticleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<User>().WithMany().HasForeignKey(review => review.AuthorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<User>().WithMany().HasForeignKey(review => review.ReviewerId).OnDelete(DeleteBehavior.Restrict);
    }
}
