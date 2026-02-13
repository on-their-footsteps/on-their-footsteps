namespace OnTheirFootsteps.Application.DTOs;

public class StoryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public bool IsPublished { get; set; }
    public int ViewCount { get; set; }
    public Guid CharacterId { get; set; }
    public CharacterDto? Character { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateStoryDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public Guid CharacterId { get; set; }
    public bool IsPublished { get; set; } = false;
}

public class UpdateStoryDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
}
