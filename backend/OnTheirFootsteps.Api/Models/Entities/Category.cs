using System.ComponentModel.DataAnnotations;

namespace OnTheirFootsteps.Api.Models.Entities;

public class Category
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
    public string? IconUrl { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Character> Characters { get; set; } = new List<Character>();
}
