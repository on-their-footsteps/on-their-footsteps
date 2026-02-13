namespace OnTheirFootsteps.Application.DTOs;

public class CharacterDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HistoricalPeriod { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateCharacterDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HistoricalPeriod { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
}

public class UpdateCharacterDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HistoricalPeriod { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
