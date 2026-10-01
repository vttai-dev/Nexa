using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;

namespace Nexa.Infrastructure.Persistence.Configurations.Articles;

public sealed class ArticleSeriesItemConfiguration : IEntityTypeConfiguration<ArticleSeriesItem>
{
    public void Configure(EntityTypeBuilder<ArticleSeriesItem> builder)
    {
        builder.ToTable("article_series_articles", "content");
        builder.HasKey(item => new { item.SeriesId, item.ArticleId });
        builder.Property(item => item.Position).IsRequired();
        builder.HasIndex(item => new { item.SeriesId, item.Position });
        builder.HasOne<Article>().WithMany().HasForeignKey(item => item.ArticleId).OnDelete(DeleteBehavior.Cascade);
    }
}
