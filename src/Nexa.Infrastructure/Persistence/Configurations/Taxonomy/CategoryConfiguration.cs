using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Taxonomy;

namespace Nexa.Infrastructure.Persistence.Configurations.Taxonomy;

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories", "content");
        builder.HasKey(category => category.Id);
        builder.Property(category => category.Id).ValueGeneratedNever();
        builder.Property(category => category.Name).HasMaxLength(100);
        builder.Property(category => category.Slug).HasMaxLength(180);
        builder.Property(category => category.Description).HasMaxLength(1000);
        builder.HasIndex(category => category.Slug).IsUnique();
    }
}
