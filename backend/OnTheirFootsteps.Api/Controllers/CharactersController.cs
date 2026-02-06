using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Services;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CharactersController : ControllerBase
{
    private readonly ICharacterService _characterService;
    private readonly ILogger<CharactersController> _logger;

    public CharactersController(ICharacterService characterService, ILogger<CharactersController> logger)
    {
        _characterService = characterService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CharacterDto>>> GetAllCharacters(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? category = null,
        [FromQuery] string? era = null)
    {
        try
        {
            var characters = await _characterService.GetAllCharactersAsync(page, limit, category, era);
            return Ok(characters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting characters");
            return StatusCode(500, new { error = "An error occurred while fetching characters" });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CharacterDto>> GetCharacter(int id)
    {
        try
        {
            var character = await _characterService.GetCharacterByIdAsync(id);
            if (character == null)
            {
                return NotFound(new { error = "Character not found" });
            }

            return Ok(character);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting character with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while fetching character" });
        }
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<CharacterDto>> GetCharacterBySlug(string slug)
    {
        try
        {
            var character = await _characterService.GetCharacterBySlugAsync(slug);
            if (character == null)
            {
                return NotFound(new { error = "Character not found" });
            }

            return Ok(character);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting character with slug: {Slug}", slug);
            return StatusCode(500, new { error = "An error occurred while fetching character" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CharacterDto>> CreateCharacter([FromBody] CreateCharacterDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "Invalid request data", details = ModelState });
            }

            var character = await _characterService.CreateCharacterAsync(request);
            return CreatedAtAction(nameof(GetCharacter), new { id = character.Id }, character);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating character");
            return StatusCode(500, new { error = "An error occurred while creating character" });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CharacterDto>> UpdateCharacter(int id, [FromBody] UpdateCharacterDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "Invalid request data", details = ModelState });
            }

            var character = await _characterService.UpdateCharacterAsync(id, request);
            return Ok(character);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating character with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while updating character" });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteCharacter(int id)
    {
        try
        {
            var result = await _characterService.DeleteCharacterAsync(id);
            if (!result)
            {
                return NotFound(new { error = "Character not found" });
            }

            return Ok(new { message = "Character deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting character with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while deleting character" });
        }
    }

    [HttpGet("featured")]
    public async Task<ActionResult<IEnumerable<CharacterDto>>> GetFeaturedCharacters([FromQuery] int limit = 6)
    {
        try
        {
            var characters = await _characterService.GetFeaturedCharactersAsync(limit);
            return Ok(characters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting featured characters");
            return StatusCode(500, new { error = "An error occurred while fetching featured characters" });
        }
    }

    [HttpPost("search")]
    public async Task<ActionResult<IEnumerable<CharacterDto>>> SearchCharacters(
        [FromQuery] string query,
        [FromQuery] SearchFiltersDto filters)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { error = "Search query is required" });
            }

            var characters = await _characterService.SearchCharactersAsync(query, filters);
            return Ok(characters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching characters with query: {Query}", query);
            return StatusCode(500, new { error = "An error occurred while searching characters" });
        }
    }

    [HttpPost("{id:int}/like")]
    [Authorize]
    public async Task<ActionResult> LikeCharacter(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var userId = int.Parse(userIdClaim.Value);
            var result = await _characterService.LikeCharacterAsync(id, userId);
            
            if (!result)
            {
                return BadRequest(new { error = "Already liked or character not found" });
            }

            return Ok(new { message = "Character liked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking character: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while liking character" });
        }
    }

    [HttpDelete("{id:int}/like")]
    [Authorize]
    public async Task<ActionResult> UnlikeCharacter(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var userId = int.Parse(userIdClaim.Value);
            var result = await _characterService.UnlikeCharacterAsync(id, userId);
            
            if (!result)
            {
                return BadRequest(new { error = "Not liked or character not found" });
            }

            return Ok(new { message = "Character unliked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking character: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while unliking character" });
        }
    }

    [HttpPost("{id:int}/view")]
    public async Task<ActionResult<int>> IncrementViews(int id)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim != null ? int.Parse(userIdClaim.Value) : (int?)null;
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            
            var views = await _characterService.IncrementViewsAsync(id, userId, ipAddress);
            return Ok(views);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing views for character: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while incrementing views" });
        }
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        try
        {
            var categories = await _characterService.GetCategoriesAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(500, new { error = "An error occurred while fetching categories" });
        }
    }

    [HttpGet("eras")]
    public async Task<ActionResult<IEnumerable<EraDto>>> GetEras()
    {
        try
        {
            var eras = await _characterService.GetErasAsync();
            return Ok(eras);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting eras");
            return StatusCode(500, new { error = "An error occurred while fetching eras" });
        }
    }
}
