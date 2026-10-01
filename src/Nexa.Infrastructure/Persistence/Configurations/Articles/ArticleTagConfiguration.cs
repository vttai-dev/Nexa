using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;
using Nexa.Domain.Taxonomy;

namespace Nexa.Infrastructure.Persistence.Configurations.Articles;

public sealed class ArticleTagConfiguration : IEntityTypeConfiguration<ArticleTag>
{
    public void Configure(EntityTypeBuilder<ArticleTag> builder)
    {
        builder.ToTable("article_tags", "content");
        builder.HasKey(tag => new { tag.ArticleId, tag.TagId });
        builder.HasOne<Tag>().WithMany().HasForeignKey(tag => tag.TagId).OnDelete(DeleteBehavior.Restrict);
    }
}
