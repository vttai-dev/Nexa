using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicationNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_notifications_type",
                schema: "community",
                table: "notifications");

            migrationBuilder.AddCheckConstraint(
                name: "ck_notifications_type",
                schema: "community",
                table: "notifications",
                sql: "type IN ('ArticleLiked', 'ArticleCommented', 'UserFollowed', 'Mentioned', 'TagPublished', 'CommentReplied', 'ArticlePublished')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_notifications_type",
                schema: "community",
                table: "notifications");

            migrationBuilder.AddCheckConstraint(
                name: "ck_notifications_type",
                schema: "community",
                table: "notifications",
                sql: "type IN ('ArticleLiked', 'ArticleCommented', 'UserFollowed', 'Mentioned', 'TagPublished')");
        }
    }
}
