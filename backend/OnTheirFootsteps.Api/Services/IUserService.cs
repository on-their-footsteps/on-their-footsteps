using OnTheirFootsteps.Api.Models.DTOs;

namespace OnTheirFootsteps.Api.Services;

public interface IUserService
{
    Task<UserDto?> GetUserByIdAsync(int id);
    Task<UserDto?> GetUserByEmailAsync(string email);
    Task<UserDto> UpdateUserAsync(int id, UpdateUserDto request);
    Task<bool> DeleteUserAsync(int id);
    Task<IEnumerable<UserDto>> GetUsersAsync(int page = 1, int limit = 20);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto request);
}
