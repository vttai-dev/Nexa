using Microsoft.Extensions.DependencyInjection;
using Nexa.Application.Features.Audit;
using Nexa.Application.Features.Admin;
using Nexa.Application.Features.Accounts;
using Nexa.Application.Features.Articles;
using Nexa.Application.Features.Comments;
using Nexa.Application.Features.Engagement;
using Nexa.Application.Features.Notifications;
using Nexa.Application.Features.Reports;
using Nexa.Application.Features.Search;
using Nexa.Application.Features.Stats;
using Nexa.Application.Features.Taxonomy;
using Nexa.Application.Features.Media;

namespace Nexa.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<AuditHandler>();
        services.AddScoped<AdminHandler>();
        services.AddScoped<RegisterHandler>();
        services.AddScoped<VerificationHandler>();
        services.AddScoped<AccountHandler>();
        services.AddScoped<ArticleHandler>();
        services.AddScoped<ArticleSeriesHandler>();
        services.AddScoped<ArticleReviewHandler>();
        services.AddScoped<CommentHandler>();
        services.AddScoped<TaxonomyHandler>();
        services.AddScoped<EngagementHandler>();
        services.AddScoped<ReportHandler>();
        services.AddScoped<SearchHandler>();
        services.AddScoped<NotificationHandler>();
        services.AddScoped<StatsHandler>();
        services.AddScoped<MediaHandler>();
        return services;
    }
}
