using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Services;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        try
        {
            var users = await _userService.GetUsersAsync(page, limit);
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, new { error = "An error occurred while fetching users" });
        }
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var currentUserId = int.Parse(userIdClaim.Value);
            var isAdmin = User.IsInRole("Admin");

            // Users can only access their own profile unless they're admin
            if (!isAdmin && currentUserId != id)
            {
                return Forbid();
            }

            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while fetching user" });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserDto request)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var currentUserId = int.Parse(userIdClaim.Value);
            var isAdmin = User.IsInRole("Admin");

            // Users can only update their own profile unless they're admin
            if (!isAdmin && currentUserId != id)
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "Invalid request data", details = ModelState });
            }

            var user = await _userService.UpdateUserAsync(id, request);
            return Ok(user);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while updating user" });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        try
        {
            var result = await _userService.DeleteUserAsync(id);
            if (!result)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(new { message = "User deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while deleting user" });
        }
    }

    [HttpPost("{id:int}/change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto request)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var currentUserId = int.Parse(userIdClaim.Value);

            // Users can only change their own password
            if (currentUserId != id)
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "Invalid request data", details = ModelState });
            }

            if (request.NewPassword != request.ConfirmPassword)
            {
                return BadRequest(new { error = "New password and confirmation do not match" });
            }

            var result = await _userService.ChangePasswordAsync(id, request);
            if (!result)
            {
                return BadRequest(new { error = "Current password is incorrect" });
            }

            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while changing password" });
        }
    }
}
