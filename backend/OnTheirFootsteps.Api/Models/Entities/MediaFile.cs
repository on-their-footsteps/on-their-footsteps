using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace OnTheirFootsteps.Api.Models.Entities;

public class MediaFile
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string FileType { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string MimeType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public int? CharacterId { get; set; }

    public int? UserId { get; set; }

    [MaxLength(100)]
    public string? AltText { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Character? Character { get; set; }

    public virtual User? User { get; set; }
}
