using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentReplies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "parent_comment_id",
                schema: "content",
                table: "comments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_comments_parent_comment_id_created_at_utc_id",
                schema: "content",
                table: "comments",
                columns: new[] { "parent_comment_id", "created_at_utc", "id" });

            migrationBuilder.AddForeignKey(
                name: "FK_comments_comments_parent_comment_id",
                schema: "content",
                table: "comments",
                column: "parent_comment_id",
                principalSchema: "content",
                principalTable: "comments",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_comments_comments_parent_comment_id",
                schema: "content",
                table: "comments");

            migrationBuilder.DropIndex(
                name: "IX_comments_parent_comment_id_created_at_utc_id",
                schema: "content",
                table: "comments");

            migrationBuilder.DropColumn(
                name: "parent_comment_id",
                schema: "content",
                table: "comments");
        }
    }
}
