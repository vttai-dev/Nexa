using System.Security.Claims;
using Nexa.Application.Abstractions.Identity;
using Nexa.Identity.Authorization;

namespace Nexa.Api.Security;

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid? Id => Guid.TryParse(accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)
        ? userId : null;
    public bool IsAdmin => accessor.HttpContext?.User.IsInRole(RoleNames.Admin) == true;
    public bool CanAuthor => IsAdmin || accessor.HttpContext?.User.IsInRole(RoleNames.Author) == true;
    public bool CanModerate => IsAdmin || accessor.HttpContext?.User.IsInRole(RoleNames.Moderator) == true;
    public string IpAddress => accessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
