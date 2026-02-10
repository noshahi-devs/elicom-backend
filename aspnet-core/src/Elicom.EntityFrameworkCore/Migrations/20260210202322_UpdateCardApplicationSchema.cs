using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Elicom.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCardApplicationSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailReason",
                table: "AbpUserLoginAttempts");

            migrationBuilder.RenameColumn(
                name: "DecisionDate",
                table: "CardApplications",
                newName: "ReviewedDate");

            migrationBuilder.RenameColumn(
                name: "AdminRemarks",
                table: "CardApplications",
                newName: "ReviewNotes");

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "CardApplications",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<DateTime>(
                name: "AppliedDate",
                table: "CardApplications",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DocumentType",
                table: "CardApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "GeneratedCardId",
                table: "CardApplications",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ReviewedBy",
                table: "CardApplications",
                type: "bigint",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Parameters",
                table: "AbpAuditLogs",
                type: "nvarchar(1024)",
                maxLength: 1024,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldMaxLength: 4096,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CardApplications_UserId",
                table: "CardApplications",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CardApplications_AbpUsers_UserId",
                table: "CardApplications",
                column: "UserId",
                principalTable: "AbpUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CardApplications_AbpUsers_UserId",
                table: "CardApplications");

            migrationBuilder.DropIndex(
                name: "IX_CardApplications_UserId",
                table: "CardApplications");

            migrationBuilder.DropColumn(
                name: "AppliedDate",
                table: "CardApplications");

            migrationBuilder.DropColumn(
                name: "DocumentType",
                table: "CardApplications");

            migrationBuilder.DropColumn(
                name: "GeneratedCardId",
                table: "CardApplications");

            migrationBuilder.DropColumn(
                name: "ReviewedBy",
                table: "CardApplications");

            migrationBuilder.RenameColumn(
                name: "ReviewedDate",
                table: "CardApplications",
                newName: "DecisionDate");

            migrationBuilder.RenameColumn(
                name: "ReviewNotes",
                table: "CardApplications",
                newName: "AdminRemarks");

            migrationBuilder.AlterColumn<long>(
                name: "Id",
                table: "CardApplications",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "FailReason",
                table: "AbpUserLoginAttempts",
                type: "nvarchar(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Parameters",
                table: "AbpAuditLogs",
                type: "nvarchar(max)",
                maxLength: 4096,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1024)",
                oldMaxLength: 1024,
                oldNullable: true);
        }
    }
}
