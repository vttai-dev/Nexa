using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Taxonomy;

namespace Nexa.Infrastructure.Persistence.Configurations.Taxonomy;

public sealed class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("tags", "content");
        builder.HasKey(tag => tag.Id);
        builder.Property(tag => tag.Id).ValueGeneratedNever();
        builder.Property(tag => tag.Name).HasMaxLength(50);
        builder.Property(tag => tag.NormalizedName).HasMaxLength(50);
        builder.Property(tag => tag.Slug).HasMaxLength(180);
        builder.HasIndex(tag => tag.Slug).IsUnique();
        builder.HasIndex(tag => tag.NormalizedName).IsUnique();
    }
}
