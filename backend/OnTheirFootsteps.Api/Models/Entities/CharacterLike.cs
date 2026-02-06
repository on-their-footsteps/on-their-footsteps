using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace OnTheirFootsteps.Api.Models.Entities;

public class CharacterLike
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int CharacterId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;

    public virtual Character Character { get; set; } = null!;
}
