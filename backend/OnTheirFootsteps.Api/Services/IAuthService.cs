using OnTheirFootsteps.Api.Models.DTOs;

namespace OnTheirFootsteps.Api.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(string email, string password);
    Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<BaseResponseDto> LogoutAsync(string userId);
    Task<TokenRefreshResponseDto> RefreshTokenAsync(string token);
    Task<BaseResponseDto> ForgotPasswordAsync(string email);
    Task<BaseResponseDto> ResetPasswordAsync(string token, string newPassword);
}
