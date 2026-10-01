using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleSeoMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "canonical_url",
                schema: "content",
                table: "articles",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "keywords",
                schema: "content",
                table: "articles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "meta_description",
                schema: "content",
                table: "articles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "meta_title",
                schema: "content",
                table: "articles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "canonical_url",
                schema: "content",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "keywords",
                schema: "content",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "meta_description",
                schema: "content",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "meta_title",
                schema: "content",
                table: "articles");
        }
    }
}
