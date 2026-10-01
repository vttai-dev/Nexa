using Nexa.Domain.Common;

namespace Nexa.Domain.Taxonomy;

public sealed class Category : Entity
{
    private Category() { }
    public Category(string name, string slug, string description) => Update(name, slug, description);
    public string Name { get; private set; } = "";
    public string Slug { get; private set; } = "";
    public string Description { get; private set; } = "";

    public void Update(string name, string slug, string description)
    {
        Name = Guard.Required(name, 100, "Name");
        Slug = Guard.Slug(slug);
        Description = Guard.Text(description, 1000, "Description");
    }
}
