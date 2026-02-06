using System.ComponentModel.DataAnnotations;

namespace OnTheirFootsteps.Api.Models.DTOs;

public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto : BaseResponseDto
{
    public UserDto? User { get; set; }
    public string? Token { get; set; }
}

public class RegisterRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(3)]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ArabicName { get; set; } = string.Empty;
}

public class RegisterResponseDto : BaseResponseDto
{
    public UserDto? User { get; set; }
}

public class LogoutResponseDto : BaseResponseDto
{
}

public class TokenRefreshResponseDto : BaseResponseDto
{
    public string? Token { get; set; }
}

public class UserProfileResponseDto : BaseResponseDto
{
    public UserDto? User { get; set; }
}

public class ForgotPasswordRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequestDto
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}
