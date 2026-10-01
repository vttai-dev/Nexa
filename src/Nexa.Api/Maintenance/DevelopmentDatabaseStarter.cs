using System.Data.Common;
using System.Diagnostics;
using System.Net.Sockets;

namespace Nexa.Api.Maintenance;

public static class DevelopmentDatabaseStarter
{
    public static async Task EnsureStartedAsync(IConfiguration configuration, string connectionString,
        CancellationToken cancellationToken = default)
    {
        if (!OperatingSystem.IsWindows() || !configuration.GetValue("DevDatabase:AutoStart", false))
            return;

        var endpoint = ParseEndpoint(connectionString);
        if (endpoint is null || !IsLocalHost(endpoint.Value.Host) || await CanConnectAsync(endpoint.Value, cancellationToken))
            return;

        var serviceName = configuration.GetValue<string>("DevDatabase:ServiceName");
        if (string.IsNullOrWhiteSpace(serviceName))
            throw new InvalidOperationException("PostgreSQL is not reachable and DevDatabase:ServiceName is not configured.");

        Console.WriteLine($"PostgreSQL is not reachable at {endpoint.Value.Host}:{endpoint.Value.Port}. Starting Windows service '{serviceName}'...");
        await RunScAsync("start", serviceName, cancellationToken);

        var waitSeconds = configuration.GetValue("DevDatabase:WaitSeconds", 30);
        var deadline = DateTimeOffset.UtcNow.AddSeconds(waitSeconds);
        while (DateTimeOffset.UtcNow < deadline)
        {
            if (await CanConnectAsync(endpoint.Value, cancellationToken))
            {
                Console.WriteLine("PostgreSQL is ready.");
                return;
            }
            await Task.Delay(TimeSpan.FromMilliseconds(500), cancellationToken);
        }

        throw new InvalidOperationException($"PostgreSQL service '{serviceName}' was started but {endpoint.Value.Host}:{endpoint.Value.Port} is still not reachable.");
    }

    private static (string Host, int Port)? ParseEndpoint(string connectionString)
    {
        var builder = new DbConnectionStringBuilder { ConnectionString = connectionString };
        var host = Read(builder, "Host") ?? Read(builder, "Server") ?? "localhost";
        var portText = Read(builder, "Port");
        return (host, int.TryParse(portText, out var port) ? port : 5432);
    }

    private static string? Read(DbConnectionStringBuilder builder, string key) =>
        builder.TryGetValue(key, out var value) ? value?.ToString() : null;

    private static bool IsLocalHost(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
        host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
        host.Equals("::1", StringComparison.OrdinalIgnoreCase);

    private static async Task<bool> CanConnectAsync((string Host, int Port) endpoint, CancellationToken cancellationToken)
    {
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(endpoint.Host, endpoint.Port, cancellationToken);
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
        catch (TimeoutException)
        {
            return false;
        }
    }

    private static async Task RunScAsync(string command, string serviceName, CancellationToken cancellationToken)
    {
        using var process = Process.Start(new ProcessStartInfo
        {
            FileName = "sc.exe",
            ArgumentList = { command, serviceName },
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        }) ?? throw new InvalidOperationException("Could not start sc.exe.");

        var output = await process.StandardOutput.ReadToEndAsync(cancellationToken);
        var error = await process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);

        if (process.ExitCode != 0 && !output.Contains("already been started", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Could not start PostgreSQL service '{serviceName}'. Run PowerShell as Administrator and execute: Start-Service {serviceName}. {output} {error}".Trim());
    }
}
