using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTagFollowsAndReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "moderation");

            migrationBuilder.CreateTable(
                name: "reports",
                schema: "moderation",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    reporter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    target_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    details = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    resolved_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    resolved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    resolution_note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reports", x => x.id);
                    table.CheckConstraint("ck_reports_reason", "reason IN ('Spam', 'Inappropriate', 'Plagiarism', 'PolicyViolation', 'Other')");
                    table.CheckConstraint("ck_reports_resolution", "status = 'Pending' OR resolved_at_utc IS NOT NULL");
                    table.CheckConstraint("ck_reports_status", "status IN ('Pending', 'Accepted', 'Rejected')");
                    table.CheckConstraint("ck_reports_target_type", "target_type IN ('Article', 'Comment', 'User')");
                    table.ForeignKey(
                        name: "FK_reports_users_reporter_id",
                        column: x => x.reporter_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_reports_users_resolved_by_id",
                        column: x => x.resolved_by_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tag_follows",
                schema: "social",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tag_follows", x => new { x.user_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_tag_follows_tags_tag_id",
                        column: x => x.tag_id,
                        principalSchema: "content",
                        principalTable: "tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tag_follows_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_reports_reporter_id_created_at_utc",
                schema: "moderation",
                table: "reports",
                columns: new[] { "reporter_id", "created_at_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_reports_resolved_by_id",
                schema: "moderation",
                table: "reports",
                column: "resolved_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_reports_status_created_at_utc_id",
                schema: "moderation",
                table: "reports",
                columns: new[] { "status", "created_at_utc", "id" });

            migrationBuilder.CreateIndex(
                name: "IX_reports_target_type_target_id",
                schema: "moderation",
                table: "reports",
                columns: new[] { "target_type", "target_id" });

            migrationBuilder.CreateIndex(
                name: "IX_tag_follows_tag_id",
                schema: "social",
                table: "tag_follows",
                column: "tag_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reports",
                schema: "moderation");

            migrationBuilder.DropTable(
                name: "tag_follows",
                schema: "social");
        }
    }
}
