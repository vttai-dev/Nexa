using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "article_reviews",
                schema: "moderation",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    article_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_id = table.Column<Guid>(type: "uuid", nullable: false),
                    article_version = table.Column<Guid>(type: "uuid", nullable: false),
                    submission_note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    reviewer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    review_note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    submitted_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    reviewed_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_article_reviews", x => x.id);
                    table.CheckConstraint("ck_article_reviews_status", "status IN ('Pending', 'Approved', 'Rejected', 'Withdrawn')");
                    table.ForeignKey(
                        name: "FK_article_reviews_articles_article_id",
                        column: x => x.article_id,
                        principalSchema: "content",
                        principalTable: "articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_article_reviews_users_author_id",
                        column: x => x.author_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_article_reviews_users_reviewer_id",
                        column: x => x.reviewer_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_article_reviews_article_id",
                schema: "moderation",
                table: "article_reviews",
                column: "article_id",
                unique: true,
                filter: "status = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "IX_article_reviews_article_id_submitted_at_utc",
                schema: "moderation",
                table: "article_reviews",
                columns: new[] { "article_id", "submitted_at_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_article_reviews_author_id",
                schema: "moderation",
                table: "article_reviews",
                column: "author_id");

            migrationBuilder.CreateIndex(
                name: "IX_article_reviews_reviewer_id",
                schema: "moderation",
                table: "article_reviews",
                column: "reviewer_id");

            migrationBuilder.CreateIndex(
                name: "IX_article_reviews_status_submitted_at_utc_id",
                schema: "moderation",
                table: "article_reviews",
                columns: new[] { "status", "submitted_at_utc", "id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "article_reviews",
                schema: "moderation");
        }
    }
}
