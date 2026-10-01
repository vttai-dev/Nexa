using NSubstitute;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;
using Nexa.Application.Features.Search;

namespace Nexa.Application.Tests;

public sealed class SearchHandlerTests
{
    [Fact]
    public async Task Invalid_query_does_not_reach_database()
    {
        var queries = Substitute.For<ISearchQueries>();
        var handler = new SearchHandler(queries);

        var result = await handler.ArticlesAsync("x", 1, 20, CancellationToken.None);

        Assert.Equal(ErrorType.Validation, result.Error?.Type);
        await queries.DidNotReceive().ArticlesAsync(Arg.Any<SearchRequest>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task All_searches_every_supported_scope()
    {
        var queries = Substitute.For<ISearchQueries>();
        var handler = new SearchHandler(queries);
        queries.ArticlesAsync(Arg.Any<SearchRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<SearchArticleResultDto>([], 1, 20, 0));
        queries.UsersAsync(Arg.Any<SearchRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<SearchUserResultDto>([], 1, 20, 0));
        queries.TagsAsync(Arg.Any<SearchRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PagedResult<SearchTagResultDto>([], 1, 20, 0));

        var result = await handler.AllAsync("dotnet", 1, 20, CancellationToken.None);

        Assert.True(result.IsSuccess);
        await queries.Received(1).ArticlesAsync(Arg.Is<SearchRequest>(request => request.Query == "dotnet"), Arg.Any<CancellationToken>());
        await queries.Received(1).UsersAsync(Arg.Is<SearchRequest>(request => request.Query == "dotnet"), Arg.Any<CancellationToken>());
        await queries.Received(1).TagsAsync(Arg.Is<SearchRequest>(request => request.Query == "dotnet"), Arg.Any<CancellationToken>());
    }
}
