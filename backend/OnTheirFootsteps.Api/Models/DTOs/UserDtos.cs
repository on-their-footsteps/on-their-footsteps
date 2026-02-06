using System.ComponentModel.DataAnnotations;

namespace OnTheirFootsteps.Api.Models.DTOs;

public class UpdateUserDto
{
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ArabicName { get; set; } = string.Empty;

    [Url]
    [MaxLength(500)]
    public string? ProfileImage { get; set; }

    [MaxLength(20)]
    public string PreferredLanguage { get; set; } = "en";
}

public class ChangePasswordDto
{
    [Required]
    [MinLength(6)]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string ConfirmPassword { get; set; } = string.Empty;
}
