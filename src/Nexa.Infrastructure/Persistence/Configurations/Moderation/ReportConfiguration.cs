using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Nexa.Domain.Moderation;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Configurations.Moderation;

public sealed class ReportConfiguration : IEntityTypeConfiguration<Report>
{
    public void Configure(EntityTypeBuilder<Report> builder)
    {
        builder.ToTable("reports", "moderation", table =>
        {
            table.HasCheckConstraint("ck_reports_status", "status IN ('Pending', 'Accepted', 'Rejected')");
            table.HasCheckConstraint("ck_reports_target_type", "target_type IN ('Article', 'Comment', 'User')");
            table.HasCheckConstraint("ck_reports_reason", "reason IN ('Spam', 'Inappropriate', 'Plagiarism', 'PolicyViolation', 'Other')");
            table.HasCheckConstraint("ck_reports_resolution", "status = 'Pending' OR resolved_at_utc IS NOT NULL");
        });
        builder.HasKey(report => report.Id);
        builder.Property(report => report.Id).ValueGeneratedNever();
        builder.Property(report => report.TargetType).HasConversion<string>().HasMaxLength(20);
        builder.Property(report => report.Reason).HasConversion<string>().HasMaxLength(30);
        builder.Property(report => report.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(report => report.Details).HasMaxLength(2000);
        builder.Property(report => report.ResolutionNote).HasMaxLength(2000);
        builder.HasIndex(report => new { report.Status, report.CreatedAtUtc, report.Id });
        builder.HasIndex(report => new { report.TargetType, report.TargetId });
        builder.HasIndex(report => new { report.ReporterId, report.CreatedAtUtc });
        builder.HasOne<User>().WithMany().HasForeignKey(report => report.ReporterId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<User>().WithMany().HasForeignKey(report => report.ResolvedById).OnDelete(DeleteBehavior.Restrict);
    }
}
