using Microsoft.AspNetCore.Identity;

namespace Nexa.Identity.Entities;

public sealed class User : IdentityUser<Guid>
{
    public DateTimeOffset CreatedAtUtc { get; set; }
}
