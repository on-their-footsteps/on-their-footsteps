using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Api.Data;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Models.Entities;

namespace OnTheirFootsteps.Api.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<UserService> _logger;

    public UserService(
        ApplicationDbContext context,
        UserManager<User> userManager,
        ILogger<UserService> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            return user != null ? MapToUserDto(user) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID: {Id}", id);
            return null;
        }
    }

    public async Task<UserDto?> GetUserByEmailAsync(string email)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            return user != null ? MapToUserDto(user) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by email: {Email}", email);
            return null;
        }
    }

    public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {id} not found");
            }

            user.FullName = request.FullName;
            user.ArabicName = request.ArabicName;
            user.ProfileImage = request.ProfileImage;
            user.PreferredLanguage = request.PreferredLanguage;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Failed to update user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            return MapToUserDto(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return false;
            }

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {Id}", id);
            return false;
        }
    }

    public async Task<IEnumerable<UserDto>> GetUsersAsync(int page = 1, int limit = 20)
    {
        try
        {
            var users = await _userManager.Users
                .Where(u => u.IsActive)
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return users.Select(MapToUserDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return Enumerable.Empty<UserDto>();
        }
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return false;
            }

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            return result.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user: {UserId}", userId);
            return false;
        }
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
