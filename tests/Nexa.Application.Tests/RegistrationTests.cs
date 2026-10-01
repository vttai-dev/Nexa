using NSubstitute;
using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Accounts;
using Nexa.Domain.Accounts;

namespace Nexa.Application.Tests;

public sealed class RegistrationTests
{
    [Fact]
    public async Task Rejected_identity_does_not_create_a_profile()
    {
        var identity = Substitute.For<IIdentityService>();
        var profiles = Substitute.For<IProfileRepository>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var rejected = new Error(ErrorType.Conflict, "duplicate", "Account unavailable.");
        identity.CreateUserAsync(Arg.Any<RegisterRequest>(), Arg.Any<CancellationToken>()).Returns(Result<Guid>.Failure(rejected));
        unitOfWork.InTransactionAsync(Arg.Any<Func<Task<Result<RegisteredDto>>>>(), Arg.Any<CancellationToken>())
            .Returns(call => call.Arg<Func<Task<Result<RegisteredDto>>>>()());
        var handler = new RegisterHandler(identity, profiles, unitOfWork, TimeProvider.System);

        var result = await handler.HandleAsync(new RegisterRequest("tester", "tester@example.com", "Test-Password-123!", "Tester", "+12025550123"), CancellationToken.None);

        Assert.Equal(rejected, result.Error);
        profiles.DidNotReceive().Add(Arg.Any<Profile>());
    }

    [Fact]
    public async Task Invalid_registration_never_reaches_identity()
    {
        var identity = Substitute.For<IIdentityService>();
        var handler = new RegisterHandler(identity, Substitute.For<IProfileRepository>(), Substitute.For<IUnitOfWork>(), TimeProvider.System);

        var result = await handler.HandleAsync(new RegisterRequest("!", "invalid", "short", "", "+12025550123"), CancellationToken.None);

        Assert.Equal(ErrorType.Validation, result.Error?.Type);
        await identity.DidNotReceive().CreateUserAsync(Arg.Any<RegisterRequest>(), Arg.Any<CancellationToken>());
    }
}
