namespace OnTheirFootsteps.Domain.Entities;

public class Character : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HistoricalPeriod { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    
    public virtual ICollection<Story> Stories { get; set; } = new List<Story>();
}
