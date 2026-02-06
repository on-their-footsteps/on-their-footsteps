using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace OnTheirFootsteps.Api.Models.Entities;

public class PageView
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Page { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? UserId { get; set; }

    [MaxLength(2000)]
    public string? Data { get; set; }

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User? User { get; set; }
}
