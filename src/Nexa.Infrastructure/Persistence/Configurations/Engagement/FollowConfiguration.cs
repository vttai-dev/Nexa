using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Engagement;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Engagement;

public sealed class FollowConfiguration : IEntityTypeConfiguration<Follow>
{
    public void Configure(EntityTypeBuilder<Follow> builder)
    {
        builder.ToTable("follows", "social", table => table.HasCheckConstraint("ck_follows_not_self", "follower_id <> followee_id"));
        builder.HasKey(follow => new { follow.FollowerId, follow.FolloweeId });
        builder.HasIndex(follow => follow.FolloweeId);
        builder.HasOne<User>().WithMany().HasForeignKey(follow => follow.FollowerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<User>().WithMany().HasForeignKey(follow => follow.FolloweeId).OnDelete(DeleteBehavior.Restrict);
    }
}
