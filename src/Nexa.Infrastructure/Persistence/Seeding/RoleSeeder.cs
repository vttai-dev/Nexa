using Microsoft.AspNetCore.Identity;
using Nexa.Identity.Authorization;
using Nexa.Identity.Entities;

namespace Nexa.Infrastructure.Persistence.Seeding;

public sealed class RoleSeeder(RoleManager<Role> roles)
{
    public async Task SeedAsync()
    {
        foreach (var name in RoleNames.All)
        {
            if (await roles.RoleExistsAsync(name))
                continue;
            var result = await roles.CreateAsync(new Role { Id = Guid.CreateVersion7(), Name = name });
            if (!result.Succeeded)
                throw new InvalidOperationException($"Could not seed role {name}.");
        }
    }
}
