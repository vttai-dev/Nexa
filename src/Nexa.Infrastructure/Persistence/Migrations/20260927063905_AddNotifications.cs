using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "notifications",
                schema: "community",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    article_id = table.Column<Guid>(type: "uuid", nullable: true),
                    comment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    read_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.CheckConstraint("ck_notifications_type", "type IN ('ArticleLiked', 'ArticleCommented', 'UserFollowed', 'Mentioned', 'TagPublished')");
                    table.ForeignKey(
                        name: "FK_notifications_articles_article_id",
                        column: x => x.article_id,
                        principalSchema: "content",
                        principalTable: "articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_notifications_comments_comment_id",
                        column: x => x.comment_id,
                        principalSchema: "content",
                        principalTable: "comments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_notifications_users_actor_id",
                        column: x => x.actor_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_notifications_users_recipient_id",
                        column: x => x.recipient_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_actor_id",
                schema: "community",
                table: "notifications",
                column: "actor_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_article_id",
                schema: "community",
                table: "notifications",
                column: "article_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_comment_id",
                schema: "community",
                table: "notifications",
                column: "comment_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_recipient_id_created_at_utc_id",
                schema: "community",
                table: "notifications",
                columns: new[] { "recipient_id", "created_at_utc", "id" });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_recipient_id_read_at_utc_created_at_utc",
                schema: "community",
                table: "notifications",
                columns: new[] { "recipient_id", "read_at_utc", "created_at_utc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "notifications",
                schema: "community");
        }
    }
}
