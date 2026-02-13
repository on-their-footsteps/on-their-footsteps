namespace OnTheirFootsteps.Domain.Entities;

public class Comment : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = false;
    
    public Guid StoryId { get; set; }
    public virtual Story Story { get; set; } = null!;
}
