using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Nexa.Application.Abstractions.Notifications;
using Nexa.Domain.Auditing;
using Nexa.Domain.Accounts;
using Nexa.Domain.Articles;
using Nexa.Domain.Comments;
using Nexa.Domain.Engagement;
using Nexa.Domain.Moderation;
using Nexa.Domain.Media;
using Nexa.Domain.Notifications;
using Nexa.Domain.Taxonomy;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence;

public sealed class NexaDbContext(DbContextOptions<NexaDbContext> options,
    INotificationRealtimePublisher? notificationRealtimePublisher = null) : IdentityDbContext<User, Role, Guid>(options)
{
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<ArticleRevision> ArticleRevisions => Set<ArticleRevision>();
    public DbSet<ArticleSeries> ArticleSeries => Set<ArticleSeries>();
    public DbSet<ArticleTag> ArticleTags => Set<ArticleTag>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<Follow> Follows => Set<Follow>();
    public DbSet<TagFollow> TagFollows => Set<TagFollow>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<ArticleReview> ArticleReviews => Set<ArticleReview>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        SaveChangesAndPublishAsync(true, cancellationToken);

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default) =>
        SaveChangesAndPublishAsync(acceptAllChangesOnSuccess, cancellationToken);

    private async Task<int> SaveChangesAndPublishAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken)
    {
        var recipients = ChangeTracker.Entries<Notification>()
            .Where(entry => entry.State == EntityState.Added)
            .Select(entry => entry.Entity.RecipientId)
            .Distinct()
            .ToArray();
        var saved = await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        if (notificationRealtimePublisher is not null)
            foreach (var recipientId in recipients)
                await notificationRealtimePublisher.PublishAsync(recipientId);
        return saved;
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles", "identity");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims", "identity");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims", "identity");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins", "identity");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens", "identity");
        builder.ApplyConfigurationsFromAssembly(typeof(NexaDbContext).Assembly);

        foreach (var entity in builder.Model.GetEntityTypes())
            foreach (var property in entity.GetProperties())
                property.SetColumnName(JsonNamingPolicy.SnakeCaseLower.ConvertName(property.Name));
    }
}
