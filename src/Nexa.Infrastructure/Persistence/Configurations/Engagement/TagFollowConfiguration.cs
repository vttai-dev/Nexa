using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Engagement;
using Nexa.Domain.Taxonomy;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Engagement;

public sealed class TagFollowConfiguration : IEntityTypeConfiguration<TagFollow>
{
    public void Configure(EntityTypeBuilder<TagFollow> builder)
    {
        builder.ToTable("tag_follows", "social");
        builder.HasKey(follow => new { follow.UserId, follow.TagId });
        builder.HasIndex(follow => follow.TagId);
        builder.HasOne<User>().WithMany().HasForeignKey(follow => follow.UserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Tag>().WithMany().HasForeignKey(follow => follow.TagId).OnDelete(DeleteBehavior.Restrict);
    }
}
