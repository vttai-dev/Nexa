using NSubstitute;
using Nexa.Application.Abstractions.Identity;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Articles;
using Nexa.Domain.Articles;

namespace Nexa.Application.Tests;

public sealed class ArticleAuthorizationTests
{
    [Fact]
    public async Task Another_author_cannot_publish_a_draft()
    {
        var repository = Substitute.For<IArticleRepository>();
        var queries = Substitute.For<IArticleQueries>();
        var currentUser = Substitute.For<ICurrentUser>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var article = new Article(Guid.NewGuid(), "Title", "title", "", "Content", null, [], DateTimeOffset.UtcNow);
        currentUser.Id.Returns(Guid.NewGuid());
        repository.FindAsync(article.Id, Arg.Any<CancellationToken>()).Returns(article);
        var handler = new ArticleHandler(repository, queries, currentUser, unitOfWork, TimeProvider.System);

        var result = await handler.PublishAsync(article.Id, article.Version, CancellationToken.None);

        Assert.Equal(ErrorType.NotFound, result.Error?.Type);
        Assert.Equal(ArticleStatus.Draft, article.Status);
        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Stale_version_does_not_mutate_an_article()
    {
        var repository = Substitute.For<IArticleRepository>();
        var currentUser = Substitute.For<ICurrentUser>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var article = new Article(Guid.NewGuid(), "Title", "title", "", "Content", null, [], DateTimeOffset.UtcNow);
        currentUser.Id.Returns(article.AuthorId);
        repository.FindAsync(article.Id, Arg.Any<CancellationToken>()).Returns(article);
        var handler = new ArticleHandler(repository, Substitute.For<IArticleQueries>(), currentUser, unitOfWork, TimeProvider.System);

        var result = await handler.PublishAsync(article.Id, Guid.NewGuid(), CancellationToken.None);

        Assert.Equal(Error.StaleVersion, result.Error);
        Assert.Equal(ArticleStatus.Draft, article.Status);
        await unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Moderator_can_archive_but_cannot_edit_someone_elses_article()
    {
        var repository = Substitute.For<IArticleRepository>();
        var currentUser = Substitute.For<ICurrentUser>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var article = new Article(Guid.NewGuid(), "Title", "title", "", "Content", null, [], DateTimeOffset.UtcNow);
        article.Publish(DateTimeOffset.UtcNow);
        currentUser.Id.Returns(Guid.NewGuid());
        currentUser.CanModerate.Returns(true);
        repository.FindAsync(article.Id, Arg.Any<CancellationToken>()).Returns(article);
        var handler = new ArticleHandler(repository, Substitute.For<IArticleQueries>(), currentUser, unitOfWork, TimeProvider.System);

        var edit = await handler.UpdateAsync(article.Id,
            new UpdateArticleRequest(article.Version, new ArticleInput("Changed", "title", "", "Content", null, [])), CancellationToken.None);
        var archive = await handler.ArchiveAsync(article.Id, article.Version, CancellationToken.None);

        Assert.Equal(ErrorType.Forbidden, edit.Error?.Type);
        Assert.True(archive.IsSuccess);
        Assert.Equal(ArticleStatus.Archived, article.Status);
    }
}
