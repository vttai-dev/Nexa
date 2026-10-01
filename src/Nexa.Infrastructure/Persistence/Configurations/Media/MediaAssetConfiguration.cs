using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Media;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Media;

public sealed class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> builder)
    {
        builder.ToTable("media_assets", "content");
        builder.HasKey(asset => asset.Id);
        builder.Property(asset => asset.Id).ValueGeneratedNever();
        builder.Property(asset => asset.Url).HasMaxLength(500);
        builder.Property(asset => asset.StoragePath).HasMaxLength(500);
        builder.Property(asset => asset.FileName).HasMaxLength(255);
        builder.Property(asset => asset.ContentType).HasMaxLength(100);
        builder.HasIndex(asset => new { asset.OwnerId, asset.CreatedAtUtc, asset.Id });
        builder.HasOne<User>().WithMany().HasForeignKey(asset => asset.OwnerId).OnDelete(DeleteBehavior.Cascade);
    }
}
