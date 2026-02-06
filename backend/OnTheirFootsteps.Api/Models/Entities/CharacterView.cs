using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace OnTheirFootsteps.Api.Models.Entities;

public class CharacterView
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CharacterId { get; set; }

    [Required]
    public int UserId { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Character Character { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
