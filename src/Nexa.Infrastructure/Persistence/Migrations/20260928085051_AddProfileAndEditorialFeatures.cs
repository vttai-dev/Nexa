using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexa.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileAndEditorialFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "company",
                schema: "community",
                table: "profiles",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "cover_image_url",
                schema: "community",
                table: "profiles",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "git_hub_url",
                schema: "community",
                table: "profiles",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "linked_in_url",
                schema: "community",
                table: "profiles",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string[]>(
                name: "skills",
                schema: "community",
                table: "profiles",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "featured_at_utc",
                schema: "content",
                table: "articles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_featured",
                schema: "content",
                table: "articles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_articles_is_featured_featured_at_utc_id",
                schema: "content",
                table: "articles",
                columns: new[] { "is_featured", "featured_at_utc", "id" });

            migrationBuilder.AddCheckConstraint(
                name: "ck_articles_featured",
                schema: "content",
                table: "articles",
                sql: "is_featured = false OR status = 'Published'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_articles_is_featured_featured_at_utc_id",
                schema: "content",
                table: "articles");

            migrationBuilder.DropCheckConstraint(
                name: "ck_articles_featured",
                schema: "content",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "company",
                schema: "community",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "cover_image_url",
                schema: "community",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "git_hub_url",
                schema: "community",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "linked_in_url",
                schema: "community",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "skills",
                schema: "community",
                table: "profiles");

            migrationBuilder.DropColumn(
                name: "featured_at_utc",
                schema: "content",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "is_featured",
                schema: "content",
                table: "articles");
        }
    }
}
