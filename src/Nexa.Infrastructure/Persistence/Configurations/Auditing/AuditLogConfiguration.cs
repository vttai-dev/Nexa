using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Auditing;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Auditing;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs", "audit");
        builder.HasKey(auditLog => auditLog.Id);
        builder.Property(auditLog => auditLog.Id).ValueGeneratedNever();
        builder.Property(auditLog => auditLog.Action).HasMaxLength(100);
        builder.Property(auditLog => auditLog.TargetType).HasMaxLength(80);
        builder.Property(auditLog => auditLog.Details).HasMaxLength(2000);
        builder.Property(auditLog => auditLog.IpAddress).HasMaxLength(64);
        builder.HasIndex(auditLog => new { auditLog.CreatedAtUtc, auditLog.Id });
        builder.HasIndex(auditLog => new { auditLog.Action, auditLog.CreatedAtUtc });
        builder.HasIndex(auditLog => new { auditLog.TargetType, auditLog.TargetId });
        builder.HasOne<User>().WithMany().HasForeignKey(auditLog => auditLog.ActorId).OnDelete(DeleteBehavior.Restrict);
    }
}
