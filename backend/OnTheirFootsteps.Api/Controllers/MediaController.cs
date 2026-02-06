using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Services;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;
    private readonly ILogger<MediaController> _logger;

    public MediaController(IMediaService mediaService, ILogger<MediaController> logger)
    {
        _mediaService = mediaService;
        _logger = logger;
    }

    [HttpPost("upload")]
    [Authorize]
    public async Task<ActionResult<string>> UploadImage([FromForm] IFormFile file, [FromForm] string type = "character")
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { error = "No file provided" });
            }

            var url = await _mediaService.UploadImageAsync(file, type);
            return Ok(new { url, message = "File uploaded successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file: {FileName}", file?.FileName);
            return StatusCode(500, new { error = "An error occurred while uploading file" });
        }
    }

    [HttpDelete("{url}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteImage(string url)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return BadRequest(new { error = "URL is required" });
            }

            var result = await _mediaService.DeleteImageAsync(url);
            if (!result)
            {
                return NotFound(new { error = "Image not found" });
            }

            return Ok(new { message = "Image deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image: {Url}", url);
            return StatusCode(500, new { error = "An error occurred while deleting image" });
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<MediaFileDto>>> GetMediaFiles(
        [FromQuery] int? characterId = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        try
        {
            var mediaFiles = await _mediaService.GetMediaFilesAsync(characterId, page, limit);
            return Ok(mediaFiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting media files");
            return StatusCode(500, new { error = "An error occurred while fetching media files" });
        }
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MediaFileDto>> GetMediaFile(int id)
    {
        try
        {
            var mediaFile = await _mediaService.GetMediaFileByIdAsync(id);
            if (mediaFile == null)
            {
                return NotFound(new { error = "Media file not found" });
            }

            return Ok(mediaFile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting media file with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while fetching media file" });
        }
    }
}
