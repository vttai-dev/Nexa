using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "audit");

            migrationBuilder.CreateTable(
                name: "audit_logs",
                schema: "audit",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    target_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    target_id = table.Column<Guid>(type: "uuid", nullable: true),
                    details = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_audit_logs_users_actor_id",
                        column: x => x.actor_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_action_created_at_utc",
                schema: "audit",
                table: "audit_logs",
                columns: new[] { "action", "created_at_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_actor_id",
                schema: "audit",
                table: "audit_logs",
                column: "actor_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_created_at_utc_id",
                schema: "audit",
                table: "audit_logs",
                columns: new[] { "created_at_utc", "id" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_target_type_target_id",
                schema: "audit",
                table: "audit_logs",
                columns: new[] { "target_type", "target_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs",
                schema: "audit");
        }
    }
}
