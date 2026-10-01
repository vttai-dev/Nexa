namespace Nexa.Application.Abstractions.Identity;

public interface ICurrentUser
{
    Guid? Id { get; }
    bool IsAdmin { get; }
    bool CanAuthor { get; }
    bool CanModerate { get; }
    string IpAddress { get; }
}
