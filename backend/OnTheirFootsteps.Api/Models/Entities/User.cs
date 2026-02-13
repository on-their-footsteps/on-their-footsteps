using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace OnTheirFootsteps.Api.Models.Entities;

public class User : IdentityUser<int>
{
    [Key]
    public override int Id { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public override string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(3)]
    [MaxLength(50)]
    public override string UserName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ArabicName { get; set; } = string.Empty;

    [Url]
    [MaxLength(500)]
    public string? ProfileImage { get; set; }

    [MaxLength(20)]
    public string PreferredLanguage { get; set; } = "en";

    public bool IsActive { get; set; } = true;

    public bool IsVerified { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public virtual ICollection<Character> CreatedCharacters { get; set; } = new List<Character>();
    
    public virtual ICollection<UserProgress> UserProgress { get; set; } = new List<UserProgress>();
    
    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
}
