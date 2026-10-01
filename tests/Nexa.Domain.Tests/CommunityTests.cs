using Nexa.Domain.Accounts;
using Nexa.Domain.Comments;
using Nexa.Domain.Common;
using Nexa.Domain.Engagement;

namespace Nexa.Domain.Tests;

public sealed class CommunityTests
{
    [Fact]
    public void Cannot_follow_yourself()
    {
        var userId = Guid.NewGuid();
        Assert.Throws<DomainException>(() => new Follow(userId, userId, DateTimeOffset.UtcNow));
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("file:///etc/passwd")]
    public void Profile_rejects_non_web_links(string url)
    {
        var profile = new Profile(Guid.NewGuid(), "Author", DateTimeOffset.UtcNow);
        Assert.Throws<DomainException>(() => profile.Update("Author", "", url, null, DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Deleted_comment_cannot_be_edited()
    {
        var comment = new Comment(Guid.NewGuid(), Guid.NewGuid(), "Comment", DateTimeOffset.UtcNow);
        comment.Delete(DateTimeOffset.UtcNow);
        Assert.Throws<DomainException>(() => comment.Update("Changed", DateTimeOffset.UtcNow));
    }
}
