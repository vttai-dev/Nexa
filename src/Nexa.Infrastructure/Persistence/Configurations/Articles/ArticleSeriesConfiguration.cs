using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Articles;

public sealed class ArticleSeriesConfiguration : IEntityTypeConfiguration<ArticleSeries>
{
    public void Configure(EntityTypeBuilder<ArticleSeries> builder)
    {
        builder.ToTable("article_series", "content");
        builder.HasKey(series => series.Id);
        builder.Property(series => series.Id).ValueGeneratedNever();
        builder.Property(series => series.Title).HasMaxLength(200);
        builder.Property(series => series.Slug).HasMaxLength(180);
        builder.Property(series => series.Description).HasMaxLength(2000);
        builder.HasIndex(series => series.Slug).IsUnique();
        builder.HasIndex(series => new { series.OwnerId, series.UpdatedAtUtc, series.Id });
        builder.HasOne<User>().WithMany().HasForeignKey(series => series.OwnerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(series => series.Articles).WithOne().HasForeignKey(item => item.SeriesId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(series => series.Articles).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
