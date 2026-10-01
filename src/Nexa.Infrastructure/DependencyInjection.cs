using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Abstractions.Persistence;
using Nexa.Identity;
using Nexa.Infrastructure.Persistence;
using Nexa.Infrastructure.Persistence.Queries;
using Nexa.Infrastructure.Persistence.Repositories;
using Nexa.Infrastructure.Persistence.Seeding;

namespace Nexa.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<NexaDbContext>(options => options.UseNpgsql(connectionString));
        services.AddNexaIdentity().AddEntityFrameworkStores<NexaDbContext>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IProfileRepository, ProfileRepository>();
        services.AddScoped<IArticleRepository, ArticleRepository>();
        services.AddScoped<IArticleSeriesRepository, ArticleSeriesRepository>();
        services.AddScoped<IArticleReviewRepository, ArticleReviewRepository>();
        services.AddScoped<IArticleQueries, ArticleQueries>();
        services.AddScoped<IStatsQueries, StatsQueries>();
        services.AddScoped<ISearchQueries, SearchQueries>();
        services.AddScoped<ITaxonomyRepository, TaxonomyRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        services.AddScoped<IEngagementRepository, EngagementRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();
        services.AddScoped<IMediaAssetRepository, MediaAssetRepository>();
        services.AddScoped<RoleSeeder>();
        return services;
    }
}
