using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OnTheirFootsteps.Api.Data;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Models.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OnTheirFootsteps.Api.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        ApplicationDbContext context,
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _context = context;
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponseDto> LoginAsync(string email, string password)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }

            if (!await _userManager.CheckPasswordAsync(user, password))
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password"
                };
            }

            if (!user.IsActive)
            {
                return new LoginResponseDto
                {
                    Success = false,
                    Message = "Account is deactivated"
                };
            }

            var token = await GenerateJwtToken(user);
            var userDto = MapToUserDto(user);

            return new LoginResponseDto
            {
                Success = true,
                Message = "Login successful",
                User = userDto,
                Token = token
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", email);
            return new LoginResponseDto
            {
                Success = false,
                Message = "An error occurred during login"
            };
        }
    }

    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return new RegisterResponseDto
                {
                    Success = false,
                    Message = "Email already registered"
                };
            }

            var existingUsername = await _userManager.FindByNameAsync(request.Username);
            if (existingUsername != null)
            {
                return new RegisterResponseDto
                {
                    Success = false,
                    Message = "Username already taken"
                };
            }

            var user = new User
            {
                Email = request.Email,
                UserName = request.Username,
                FullName = request.FullName,
                ArabicName = request.ArabicName,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                IsVerified = false
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return new RegisterResponseDto
                {
                    Success = false,
                    Message = "Registration failed",
                    Errors = errors
                };
            }

            var userDto = MapToUserDto(user);
            return new RegisterResponseDto
            {
                Success = true,
                Message = "Registration successful",
                User = userDto
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for email: {Email}", request.Email);
            return new RegisterResponseDto
            {
                Success = false,
                Message = "An error occurred during registration"
            };
        }
    }

    public async Task<BaseResponseDto> LogoutAsync(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                user.LastLoginAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);
            }

            return new BaseResponseDto
            {
                Success = true,
                Message = "Logout successful"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout for user: {UserId}", userId);
            return new BaseResponseDto
            {
                Success = false,
                Message = "An error occurred during logout"
            };
        }
    }

    public async Task<TokenRefreshResponseDto> RefreshTokenAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return new TokenRefreshResponseDto
                {
                    Success = false,
                    Message = "Invalid token"
                };
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.IsActive)
            {
                return new TokenRefreshResponseDto
                {
                    Success = false,
                    Message = "User not found or inactive"
                };
            }

            var newToken = await GenerateJwtToken(user);

            return new TokenRefreshResponseDto
            {
                Success = true,
                Message = "Token refreshed successfully",
                Token = newToken
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return new TokenRefreshResponseDto
            {
                Success = false,
                Message = "Invalid token"
            };
        }
    }

    public async Task<BaseResponseDto> ForgotPasswordAsync(string email)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return new BaseResponseDto
                {
                    Success = true,
                    Message = "If an account with this email exists, a password reset link has been sent"
                };
            }

            // TODO: Implement actual email sending logic
            _logger.LogInformation("Password reset requested for email: {Email}", email);

            return new BaseResponseDto
            {
                Success = true,
                Message = "If an account with this email exists, a password reset link has been sent"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password for email: {Email}", email);
            return new BaseResponseDto
            {
                Success = false,
                Message = "An error occurred while processing forgot password request"
            };
        }
    }

    public async Task<BaseResponseDto> ResetPasswordAsync(string token, string newPassword)
    {
        try
        {
            // TODO: Implement actual token validation and password reset logic
            _logger.LogInformation("Password reset attempted with token: {Token}", token);

            return new BaseResponseDto
            {
                Success = true,
                Message = "Password reset successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset");
            return new BaseResponseDto
            {
                Success = false,
                Message = "An error occurred while resetting password"
            };
        }
    }

    private async Task<string> GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim("FullName", user.FullName),
            new Claim("ArabicName", user.ArabicName ?? string.Empty)
        };

        var roles = await _userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Jwt:ExpirationMinutes", 60)),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            Username = user.UserName!,
            FullName = user.FullName,
            ArabicName = user.ArabicName,
            ProfileImage = user.ProfileImage,
            PreferredLanguage = user.PreferredLanguage,
            IsActive = user.IsActive,
            IsVerified = user.IsVerified,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }
}
