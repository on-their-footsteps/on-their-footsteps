using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace OnTheirFootsteps.Api.Models.Entities;

public class AnalyticsEvent
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string EventName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? UserId { get; set; }

    [MaxLength(2000)]
    public string? Data { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User? User { get; set; }
}
