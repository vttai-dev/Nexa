using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Articles;
using Nexa.Domain.Comments;
using Nexa.Domain.Notifications;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Notifications;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications", "community", table =>
            table.HasCheckConstraint("ck_notifications_type",
                "type IN ('ArticleLiked', 'ArticleCommented', 'UserFollowed', 'Mentioned', 'TagPublished', 'CommentReplied', 'ArticlePublished')"));
        builder.HasKey(notification => notification.Id);
        builder.Property(notification => notification.Id).ValueGeneratedNever();
        builder.Property(notification => notification.Type).HasConversion<string>().HasMaxLength(40);
        builder.Property(notification => notification.Message).HasMaxLength(500);
        builder.Ignore(notification => notification.IsRead);
        builder.HasIndex(notification => new { notification.RecipientId, notification.ReadAtUtc, notification.CreatedAtUtc });
        builder.HasIndex(notification => new { notification.RecipientId, notification.CreatedAtUtc, notification.Id });
        builder.HasOne<User>().WithMany().HasForeignKey(notification => notification.RecipientId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<User>().WithMany().HasForeignKey(notification => notification.ActorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Article>().WithMany().HasForeignKey(notification => notification.ArticleId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne<Comment>().WithMany().HasForeignKey(notification => notification.CommentId).OnDelete(DeleteBehavior.SetNull);
    }
}
