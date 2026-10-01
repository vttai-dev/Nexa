using System.Xml.Linq;

namespace Nexa.ArchitectureTests;

public sealed class DependencyTests
{
    [Theory]
    [InlineData("Nexa.Domain")]
    [InlineData("Nexa.Application", "Nexa.Domain")]
    [InlineData("Nexa.Identity", "Nexa.Application")]
    [InlineData("Nexa.Infrastructure", "Nexa.Application", "Nexa.Domain", "Nexa.Identity")]
    [InlineData("Nexa.Api", "Nexa.Application", "Nexa.Infrastructure", "Nexa.Identity")]
    public void Project_references_follow_approved_boundaries(string project, params string[] expected)
    {
        var document = XDocument.Load(Path.Combine(FindRoot(), "src", project, $"{project}.csproj"));
        var actual = document.Descendants("ProjectReference")
            .Select(reference => Path.GetFileNameWithoutExtension(reference.Attribute("Include")!.Value)).Order().ToArray();
        Assert.Equal(expected.Order(), actual);
        if (project is "Nexa.Domain" or "Nexa.Application")
        {
            Assert.Empty(document.Descendants("FrameworkReference"));
            Assert.DoesNotContain(document.Descendants("PackageReference"),
                reference => reference.Attribute("Include")!.Value.Contains("EntityFramework", StringComparison.Ordinal)
                    || reference.Attribute("Include")!.Value.Contains("AspNetCore", StringComparison.Ordinal));
        }
    }

    private static string FindRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "Nexa.Platform.slnx")))
            directory = directory.Parent;
        return directory?.FullName ?? throw new DirectoryNotFoundException("Solution root was not found.");
    }
}
