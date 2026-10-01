using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;
using Nexa.Domain.Engagement;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Engagement;

public sealed class BookmarkConfiguration : IEntityTypeConfiguration<Bookmark>
{
    public void Configure(EntityTypeBuilder<Bookmark> builder)
    {
        builder.ToTable("bookmarks", "social");
        builder.HasKey(relation => new { relation.UserId, relation.ArticleId });
        builder.HasIndex(relation => relation.ArticleId);
        builder.HasOne<User>().WithMany().HasForeignKey(relation => relation.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Article>().WithMany().HasForeignKey(relation => relation.ArticleId).OnDelete(DeleteBehavior.Cascade);
    }
}
