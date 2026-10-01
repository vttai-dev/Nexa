using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Accounts;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Accounts;

public sealed class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.ToTable("profiles", "community");
        builder.HasKey(profile => profile.UserId);
        builder.Property(profile => profile.UserId).ValueGeneratedNever();
        builder.Property(profile => profile.DisplayName).HasMaxLength(100);
        builder.Property(profile => profile.Bio).HasMaxLength(2000);
        builder.Property(profile => profile.AvatarUrl).HasMaxLength(2048);
        builder.Property(profile => profile.CoverImageUrl).HasMaxLength(2048);
        builder.Property(profile => profile.WebsiteUrl).HasMaxLength(2048);
        builder.Property(profile => profile.GitHubUrl).HasMaxLength(2048);
        builder.Property(profile => profile.LinkedInUrl).HasMaxLength(2048);
        builder.Property(profile => profile.Company).HasMaxLength(120);
        builder.Property(profile => profile.Skills).HasColumnType("text[]");
        builder.HasOne<User>().WithOne().HasForeignKey<Profile>(profile => profile.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
