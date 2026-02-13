namespace OnTheirFootsteps.Domain.Entities;

public class Story : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public bool IsPublished { get; set; } = false;
    public int ViewCount { get; set; } = 0;
    
    public Guid CharacterId { get; set; }
    public virtual Character Character { get; set; } = null!;
    
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
