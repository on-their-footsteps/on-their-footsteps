using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Models.Entities;
using OnTheirFootsteps.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;

    public AuthController(IAuthService authService, UserManager<User> userManager, IConfiguration configuration)
    {
        _authService = authService;
        _userManager = userManager;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new LoginResponseDto
            {
                Success = false,
                Message = "Invalid request data",
                Errors = ModelState.Values.SelectMany(v => v.Errors.Select(c=>c.ErrorMessage)).ToList()
            });
        }

        try
        {
            var result = await _authService.LoginAsync(request.Email, request.Password);
            
            if (result.Success)
            {
                // Set authentication cookie
                Response.Cookies.Append("auth_token", result.Token!, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Jwt:ExpirationMinutes"))
                });

                return Ok(new LoginResponseDto
                {
                    Success = true,
                    Message = "Login successful",
                    User = result.User,
                    Token = result.Token
                });
            }

            return Unauthorized(new LoginResponseDto
            {
                Success = false,
                Message = result.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new LoginResponseDto
            {
                Success = false,
                Message = "An error occurred during login"
            });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponseDto>> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new RegisterResponseDto
            {
                Success = false,
                Message = "Invalid request data",
                Errors = ModelState.Values.SelectMany(v => v.Errors.Select(c => c.ErrorMessage)).ToList()
            });
        }

        try
        {
            var result = await _authService.RegisterAsync(request);
            
            if (result.Success)
            {
                return CreatedAtAction(nameof(Register), new RegisterResponseDto
                {
                    Success = true,
                    Message = "Registration successful",
                    User = result.User
                });
            }

            return BadRequest(new RegisterResponseDto
            {
                Success = false,
                Message = result.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new RegisterResponseDto
            {
                Success = false,
                Message = "An error occurred during registration"
            });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<LogoutResponseDto>> Logout()
    {
        try
        {
            // Clear authentication cookie
            Response.Cookies.Delete("auth_token");
            
            // Revoke token if needed
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                await _authService.LogoutAsync(userId);
            }

            return Ok(new LogoutResponseDto
            {
                Success = true,
                Message = "Logout successful"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new LogoutResponseDto
            {
                Success = false,
                Message = "An error occurred during logout"
            });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<TokenRefreshResponseDto>> RefreshToken()
    {
        try
        {
            var token = Request.Cookies["auth_token"];
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(new TokenRefreshResponseDto
                {
                    Success = false,
                    Message = "No token provided"
                });
            }

            var result = await _authService.RefreshTokenAsync(token);
            
            if (result.Success)
            {
                // Set new authentication cookie
                Response.Cookies.Append("auth_token", result.Token!, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("Jwt:ExpirationMinutes"))
                });

                return Ok(new TokenRefreshResponseDto
                {
                    Success = true,
                    Message = "Token refreshed successfully",
                    Token = result.Token
                });
            }

            return Unauthorized(new TokenRefreshResponseDto
            {
                Success = false,
                Message = result.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new TokenRefreshResponseDto
            {
                Success = false,
                Message = "An error occurred during token refresh"
            });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileResponseDto>> GetProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new UserProfileResponseDto
                {
                    Success = false,
                    Message = "User not authenticated"
                });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new UserProfileResponseDto
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            return Ok(new UserProfileResponseDto
            {
                Success = true,
                User = new UserDto
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
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new UserProfileResponseDto
            {
                Success = false,
                Message = "An error occurred while fetching profile"
            });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<BaseResponseDto>> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new BaseResponseDto
            {
                Success = false,
                Message = "Invalid request data"
            });
        }

        try
        {
            var result = await _authService.ForgotPasswordAsync(request.Email);
            
            return Ok(new BaseResponseDto
            {
                Success = result.Success,
                Message = result.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new BaseResponseDto
            {
                Success = false,
                Message = "An error occurred while processing forgot password request"
            });
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<BaseResponseDto>> ResetPassword([FromBody] ResetPasswordRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new BaseResponseDto
            {
                Success = false,
                Message = "Invalid request data"
            });
        }

        try
        {
            var result = await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
            
            return Ok(new BaseResponseDto
            {
                Success = result.Success,
                Message = result.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new BaseResponseDto
            {
                Success = false,
                Message = "An error occurred while resetting password"
            });
        }
    }
}
