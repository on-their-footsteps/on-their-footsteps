using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace OnTheirFootsteps.Api.Models.Entities;

public class Character
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? ArabicName { get; set; }

    [Required]
    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(2000)]
    public string? ArabicDescription { get; set; }

    [Url]
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Url]
    [MaxLength(500)]
    public string? FullImageUrl { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [Required]
    public int EraId { get; set; }

    public int? YearOfBirth { get; set; }

    public int? YearOfDeath { get; set; }

    [MaxLength(100)]
    public string? PlaceOfBirth { get; set; }

    [MaxLength(100)]
    public string? PlaceOfDeath { get; set; }

    public int ViewsCount { get; set; } = 0;

    public int LikesCount { get; set; } = 0;

    public bool IsFeatured { get; set; } = false;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Category Category { get; set; } = null!;

    public virtual Era Era { get; set; } = null!;

    public virtual ICollection<CharacterLike> CharacterLikes { get; set; } = new List<CharacterLike>();
    
    public virtual ICollection<CharacterView> CharacterViews { get; set; } = new List<CharacterView>();
    
    public virtual ICollection<UserProgress> UserProgress { get; set; } = new List<UserProgress>();
}
