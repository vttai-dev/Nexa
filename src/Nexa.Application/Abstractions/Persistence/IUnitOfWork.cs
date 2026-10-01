using Nexa.Application.Common;

namespace Nexa.Application.Abstractions.Persistence;

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken cancellationToken);
    Task<Result<T>> InTransactionAsync<T>(Func<Task<Result<T>>> operation, CancellationToken cancellationToken);
}
