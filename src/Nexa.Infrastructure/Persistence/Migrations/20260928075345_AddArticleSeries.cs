using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleSeries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "article_series",
                schema: "content",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_article_series", x => x.id);
                    table.ForeignKey(
                        name: "FK_article_series_users_owner_id",
                        column: x => x.owner_id,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "article_series_articles",
                schema: "content",
                columns: table => new
                {
                    series_id = table.Column<Guid>(type: "uuid", nullable: false),
                    article_id = table.Column<Guid>(type: "uuid", nullable: false),
                    position = table.Column<int>(type: "integer", nullable: false),
                    added_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_article_series_articles", x => new { x.series_id, x.article_id });
                    table.ForeignKey(
                        name: "FK_article_series_articles_article_series_series_id",
                        column: x => x.series_id,
                        principalSchema: "content",
                        principalTable: "article_series",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_article_series_articles_articles_article_id",
                        column: x => x.article_id,
                        principalSchema: "content",
                        principalTable: "articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_article_series_owner_id_updated_at_utc_id",
                schema: "content",
                table: "article_series",
                columns: new[] { "owner_id", "updated_at_utc", "id" });

            migrationBuilder.CreateIndex(
                name: "IX_article_series_slug",
                schema: "content",
                table: "article_series",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_article_series_articles_article_id",
                schema: "content",
                table: "article_series_articles",
                column: "article_id");

            migrationBuilder.CreateIndex(
                name: "IX_article_series_articles_series_id_position",
                schema: "content",
                table: "article_series_articles",
                columns: new[] { "series_id", "position" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "article_series_articles",
                schema: "content");

            migrationBuilder.DropTable(
                name: "article_series",
                schema: "content");
        }
    }
}
