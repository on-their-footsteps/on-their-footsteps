using Microsoft.AspNetCore.Mvc;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Services;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ContentController : ControllerBase
{
    private readonly IContentService _contentService;
    private readonly ILogger<ContentController> _logger;

    public ContentController(IContentService contentService, ILogger<ContentController> logger)
    {
        _contentService = contentService;
        _logger = logger;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        try
        {
            var categories = await _contentService.GetCategoriesAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(500, new { error = "An error occurred while fetching categories" });
        }
    }

    [HttpGet("categories/{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        try
        {
            var category = await _contentService.GetCategoryByIdAsync(id);
            if (category == null)
            {
                return NotFound(new { error = "Category not found" });
            }

            return Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while fetching category" });
        }
    }

    [HttpGet("categories/slug/{slug}")]
    public async Task<ActionResult<CategoryDto>> GetCategoryBySlug(string slug)
    {
        try
        {
            var category = await _contentService.GetCategoryBySlugAsync(slug);
            if (category == null)
            {
                return NotFound(new { error = "Category not found" });
            }

            return Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category with slug: {Slug}", slug);
            return StatusCode(500, new { error = "An error occurred while fetching category" });
        }
    }

    [HttpGet("eras")]
    public async Task<ActionResult<IEnumerable<EraDto>>> GetEras()
    {
        try
        {
            var eras = await _contentService.GetErasAsync();
            return Ok(eras);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting eras");
            return StatusCode(500, new { error = "An error occurred while fetching eras" });
        }
    }

    [HttpGet("eras/{id:int}")]
    public async Task<ActionResult<EraDto>> GetEra(int id)
    {
        try
        {
            var era = await _contentService.GetEraByIdAsync(id);
            if (era == null)
            {
                return NotFound(new { error = "Era not found" });
            }

            return Ok(era);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting era with ID: {Id}", id);
            return StatusCode(500, new { error = "An error occurred while fetching era" });
        }
    }

    [HttpGet("eras/slug/{slug}")]
    public async Task<ActionResult<EraDto>> GetEraBySlug(string slug)
    {
        try
        {
            var era = await _contentService.GetEraBySlugAsync(slug);
            if (era == null)
            {
                return NotFound(new { error = "Era not found" });
            }

            return Ok(era);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting era with slug: {Slug}", slug);
            return StatusCode(500, new { error = "An error occurred while fetching era" });
        }
    }
}
