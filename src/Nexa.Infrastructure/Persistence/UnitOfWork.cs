using Nexa.Application.Abstractions.Persistence;
using Nexa.Application.Common;

namespace Nexa.Infrastructure.Persistence;

public sealed class UnitOfWork(NexaDbContext database) : IUnitOfWork
{
    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await database.SaveChangesAsync(cancellationToken);

    public async Task<Result<T>> InTransactionAsync<T>(Func<Task<Result<T>>> operation, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var result = await operation();
            if (result.IsSuccess)
                await transaction.CommitAsync(cancellationToken);
            else
            {
                await transaction.RollbackAsync(cancellationToken);
                database.ChangeTracker.Clear();
            }
            return result;
        }
        catch
        {
            await transaction.RollbackAsync(CancellationToken.None);
            database.ChangeTracker.Clear();
            throw;
        }
    }
}
