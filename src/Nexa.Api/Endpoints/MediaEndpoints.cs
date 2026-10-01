using Nexa.Api.Errors;
using Nexa.Application.Common;
using Nexa.Application.Features.Media;

namespace Nexa.Api.Endpoints;

public static class MediaEndpoints
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/gif"
    };

    private static readonly IReadOnlyDictionary<string, string> AllowedDocuments = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf",
        [".txt"] = "text/plain",
        [".csv"] = "text/csv",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };

    public static void MapMediaEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/media/images", (IFormFile file, IWebHostEnvironment environment, MediaHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            UploadImageAsync(file, environment, handler, context, cancellationToken, 5 * 1024 * 1024))
            .RequireAuthorization("Authoring").RequireRateLimiting("content-write").WithTags("Media").WithName("UploadImage")
            .Accepts<IFormFile>("multipart/form-data").Produces<MediaAssetDto>(201);

        api.MapPost("/media/profile-images", (IFormFile file, IWebHostEnvironment environment, MediaHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            UploadImageAsync(file, environment, handler, context, cancellationToken, 2 * 1024 * 1024))
            .RequireAuthorization().RequireRateLimiting("content-write").WithTags("Media").WithName("UploadProfileImage")
            .Accepts<IFormFile>("multipart/form-data").Produces<MediaAssetDto>(201);

        api.MapPost("/media/files", async (IFormFile file, IWebHostEnvironment environment, MediaHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
        {
            const long maxBytes = 25 * 1024 * 1024;
            var extension = Path.GetExtension(file.FileName);
            if (file.Length == 0 || file.Length > maxBytes)
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["file"] = ["File must be between 1 byte and 25 MB."]
                });
            if (!AllowedDocuments.TryGetValue(extension, out var expectedType)
                || !string.Equals(file.ContentType, expectedType, StringComparison.OrdinalIgnoreCase))
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["file"] = ["Only PDF, TXT, CSV, DOCX, XLSX, or PPTX files are allowed."]
                });
            var now = DateTimeOffset.UtcNow;
            var relativeDirectory = Path.Combine("uploads", "files", now.Year.ToString("0000"), now.Month.ToString("00"));
            var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
            var targetDirectory = Path.Combine(webRoot, relativeDirectory);
            Directory.CreateDirectory(targetDirectory);
            var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var targetPath = Path.Combine(targetDirectory, fileName);
            await using (var stream = File.Create(targetPath))
                await file.CopyToAsync(stream, cancellationToken);
            var url = $"/{relativeDirectory.Replace(Path.DirectorySeparatorChar, '/')}/{fileName}";
            var stored = false;
            try
            {
                var result = await handler.CreateAsync(new CreateMediaAssetRequest(url,
                    Path.Combine(relativeDirectory, fileName), Path.GetFileName(file.FileName), expectedType, file.Length),
                    cancellationToken);
                stored = result.IsSuccess;
                return result.ToHttpResult(context, asset => Results.Created(asset.Url, asset));
            }
            finally
            {
                if (!stored && File.Exists(targetPath))
                    File.Delete(targetPath);
            }
        }).RequireAuthorization("Authoring").RequireRateLimiting("content-write").WithTags("Media").WithName("UploadDocument")
            .Accepts<IFormFile>("multipart/form-data").Produces<MediaAssetDto>(201);

        api.MapGet("/me/media", async (int? page, int? pageSize, MediaHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.ListMineAsync(new PageRequest(page ?? 1, pageSize ?? 20), cancellationToken)).ToHttpResult(context))
            .RequireAuthorization().WithTags("Media").WithName("ListMyMedia")
            .Produces<PagedResult<MediaAssetDto>>();

        api.MapDelete("/media/{id:guid}", async (Guid id, IWebHostEnvironment environment, MediaHandler handler,
            HttpContext context, CancellationToken cancellationToken) =>
            (await handler.DeleteAsync(id, cancellationToken)).ToHttpResult(context, storagePath =>
            {
                var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
                var fullRoot = Path.GetFullPath(webRoot).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                var fullPath = Path.GetFullPath(Path.Combine(webRoot, storagePath));
                if (fullPath.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase) && File.Exists(fullPath))
                    File.Delete(fullPath);
                return Results.NoContent();
            }))
            .RequireAuthorization("Authoring").WithTags("Media").WithName("DeleteMyMedia").Produces(204);
    }

    private static async Task<IResult> UploadImageAsync(IFormFile file, IWebHostEnvironment environment,
        MediaHandler handler, HttpContext context, CancellationToken cancellationToken, long maxBytes)
    {
        if (file.Length == 0 || file.Length > maxBytes)
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["file"] = [$"Image must be between 1 byte and {maxBytes / (1024 * 1024)} MB."]
            });
        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension) || !AllowedContentTypes.Contains(file.ContentType))
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["file"] = ["Only JPG, PNG, WEBP, or GIF images are allowed."]
            });
        var now = DateTimeOffset.UtcNow;
        var relativeDirectory = Path.Combine("uploads", "images", now.Year.ToString("0000"), now.Month.ToString("00"));
        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var targetDirectory = Path.Combine(webRoot, relativeDirectory);
        Directory.CreateDirectory(targetDirectory);
        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var targetPath = Path.Combine(targetDirectory, fileName);
        await using (var stream = File.Create(targetPath))
            await file.CopyToAsync(stream, cancellationToken);
        var url = $"/{relativeDirectory.Replace(Path.DirectorySeparatorChar, '/')}/{fileName}";
        var stored = false;
        try
        {
            var result = await handler.CreateAsync(new CreateMediaAssetRequest(url,
                Path.Combine(relativeDirectory, fileName), Path.GetFileName(file.FileName), file.ContentType, file.Length),
                cancellationToken);
            stored = result.IsSuccess;
            return result.ToHttpResult(context, asset => Results.Created(asset.Url, asset));
        }
        finally
        {
            if (!stored && File.Exists(targetPath))
                File.Delete(targetPath);
        }
    }
}
