using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Identity;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users", "identity");
        builder.Property(user => user.Id).ValueGeneratedNever();
        builder.Property(user => user.UserName).IsRequired().HasMaxLength(30);
        builder.Property(user => user.NormalizedUserName).IsRequired().HasMaxLength(30);
        builder.Property(user => user.Email).IsRequired().HasMaxLength(254);
        builder.Property(user => user.NormalizedEmail).IsRequired().HasMaxLength(254);
        builder.HasIndex(user => user.NormalizedEmail).IsUnique().HasDatabaseName("ux_users_normalized_email");
    }
}
