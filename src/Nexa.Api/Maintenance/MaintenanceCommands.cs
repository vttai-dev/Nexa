using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Nexa.Application.Features.Accounts;
using Nexa.Identity.Authorization;
using Nexa.Identity.Entities;
using Nexa.Infrastructure.Persistence;
using Nexa.Infrastructure.Persistence.Seeding;

namespace Nexa.Api.Maintenance;

public static class MaintenanceCommands
{
    public static async Task RunAsync(WebApplication app, string[] args)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var services = scope.ServiceProvider;
        if (args.Contains("--migrate"))
        {
            await services.GetRequiredService<NexaDbContext>().Database.MigrateAsync();
            app.Logger.LogInformation("Database migrations applied.");
        }
        if (args.Contains("--seed") || args.Contains("--bootstrap-admin"))
        {
            await services.GetRequiredService<RoleSeeder>().SeedAsync();
            app.Logger.LogInformation("Membership roles are ready.");
        }
        if (!args.Contains("--bootstrap-admin"))
            return;

        var email = app.Configuration["BootstrapAdmin:Email"];
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("Set BootstrapAdmin:Email through environment variables or user-secrets.");
        var users = services.GetRequiredService<UserManager<User>>();
        var bootstrapPhone = app.Configuration["BootstrapAdmin:PhoneNumber"];
        var requireVerifiedContacts = app.Configuration.GetValue<bool>("AccountMessages:RequireVerifiedContacts");
        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            var password = app.Configuration["BootstrapAdmin:Password"];
            var userName = app.Configuration["BootstrapAdmin:UserName"];
            if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(userName)
                || (requireVerifiedContacts && string.IsNullOrWhiteSpace(bootstrapPhone)))
                throw new InvalidOperationException("A new administrator requires BootstrapAdmin:UserName and BootstrapAdmin:Password; BootstrapAdmin:PhoneNumber is required only when contact verification is enabled.");
            var result = await services.GetRequiredService<RegisterHandler>().HandleAsync(
                new RegisterRequest(userName, email, password, "Administrator", bootstrapPhone), CancellationToken.None);
            if (!result.IsSuccess)
                throw new InvalidOperationException($"Administrator creation failed: {result.Error!.Code}.");
            user = await users.FindByIdAsync(result.Value!.UserId.ToString())
                ?? throw new InvalidOperationException("Administrator account was not persisted.");
        }
        if (!await users.IsInRoleAsync(user, RoleNames.Admin))
        {
            var promoted = await users.AddToRoleAsync(user, RoleNames.Admin);
            if (!promoted.Succeeded)
                throw new InvalidOperationException("Administrator role assignment failed.");
            await users.UpdateSecurityStampAsync(user);
        }
        var changed = false;
        if (!user.EmailConfirmed)
        {
            user.EmailConfirmed = true;
            changed = true;
        }
        if (requireVerifiedContacts && !user.PhoneNumberConfirmed)
        {
            if (string.IsNullOrWhiteSpace(bootstrapPhone))
                throw new InvalidOperationException("Set BootstrapAdmin:PhoneNumber to confirm the bootstrap administrator phone.");
            user.PhoneNumber = bootstrapPhone;
            user.PhoneNumberConfirmed = true;
            changed = true;
        }
        if (changed)
        {
            var updated = await users.UpdateAsync(user);
            if (!updated.Succeeded)
                throw new InvalidOperationException("Administrator verification state could not be initialized.");
        }
        app.Logger.LogInformation("Administrator role assigned.");
    }
}
