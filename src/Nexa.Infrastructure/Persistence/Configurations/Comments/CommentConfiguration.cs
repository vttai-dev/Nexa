using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;
using Nexa.Domain.Comments;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Comments;

public sealed class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("comments", "content");
        builder.HasKey(comment => comment.Id);
        builder.Property(comment => comment.Id).ValueGeneratedNever();
        builder.Property(comment => comment.Body).HasMaxLength(5000);
        builder.Property(comment => comment.Version).IsConcurrencyToken();
        builder.HasQueryFilter(comment => comment.DeletedAtUtc == null);
        builder.HasIndex(comment => new { comment.ArticleId, comment.CreatedAtUtc, comment.Id });
        builder.HasIndex(comment => new { comment.ParentCommentId, comment.CreatedAtUtc, comment.Id });
        builder.HasOne<Article>().WithMany().HasForeignKey(comment => comment.ArticleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<User>().WithMany().HasForeignKey(comment => comment.AuthorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Comment>().WithMany().HasForeignKey(comment => comment.ParentCommentId).OnDelete(DeleteBehavior.Restrict);
    }
}
