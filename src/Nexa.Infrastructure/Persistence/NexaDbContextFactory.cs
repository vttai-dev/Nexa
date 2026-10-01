using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Nexa.Infrastructure.Persistence;

public sealed class NexaDbContextFactory : IDesignTimeDbContextFactory<NexaDbContext>
{
    public NexaDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__NexaDb");
        if (string.IsNullOrWhiteSpace(connection))
            throw new InvalidOperationException("Set ConnectionStrings__NexaDb before running EF commands.");
        return new NexaDbContext(new DbContextOptionsBuilder<NexaDbContext>().UseNpgsql(connection).Options);
    }
}
