using System.ComponentModel.DataAnnotations;

namespace OnTheirFootsteps.Api.Models.Entities;

public class UserProgress
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int CharacterId { get; set; }

    public int CurrentStep { get; set; } = 0;

    public int TotalSteps { get; set; } = 1;

    public bool IsCompleted { get; set; } = false;

    public bool IsBookmarked { get; set; } = false;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;

    public virtual Character Character { get; set; } = null!;
}
