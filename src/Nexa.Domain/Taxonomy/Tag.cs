using Nexa.Domain.Common;

namespace Nexa.Domain.Taxonomy;

public sealed class Tag : Entity
{
    private Tag() { }
    public Tag(string name, string slug) => Update(name, slug);
    public string Name { get; private set; } = "";
    public string NormalizedName { get; private set; } = "";
    public string Slug { get; private set; } = "";

    public void Update(string name, string slug)
    {
        Name = Guard.Required(name, 50, "Name");
        NormalizedName = Name.ToUpperInvariant();
        Slug = Guard.Slug(slug);
    }
}
