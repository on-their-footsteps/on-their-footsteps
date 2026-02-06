using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Api.Data;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Models.Entities;

namespace OnTheirFootsteps.Api.Services;

public class ContentService : IContentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ContentService> _logger;

    public ContentService(ApplicationDbContext context, ILogger<ContentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        try
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            return categories.Select(MapToCategoryDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return Enumerable.Empty<CategoryDto>();
        }
    }

    public async Task<IEnumerable<EraDto>> GetErasAsync()
    {
        try
        {
            var eras = await _context.Eras
                .Where(e => e.IsActive)
                .OrderBy(e => e.DisplayOrder)
                .ToListAsync();

            return eras.Select(MapToEraDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting eras");
            return Enumerable.Empty<EraDto>();
        }
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
    {
        try
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

            return category != null ? MapToCategoryDto(category) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category by ID: {Id}", id);
            return null;
        }
    }

    public async Task<CategoryDto?> GetCategoryBySlugAsync(string slug)
    {
        try
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Slug == slug && c.IsActive);

            return category != null ? MapToCategoryDto(category) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category by slug: {Slug}", slug);
            return null;
        }
    }

    public async Task<EraDto?> GetEraByIdAsync(int id)
    {
        try
        {
            var era = await _context.Eras
                .FirstOrDefaultAsync(e => e.Id == id && e.IsActive);

            return era != null ? MapToEraDto(era) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting era by ID: {Id}", id);
            return null;
        }
    }

    public async Task<EraDto?> GetEraBySlugAsync(string slug)
    {
        try
        {
            var era = await _context.Eras
                .FirstOrDefaultAsync(e => e.Slug == slug && e.IsActive);

            return era != null ? MapToEraDto(era) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting era by slug: {Slug}", slug);
            return null;
        }
    }

    private static CategoryDto MapToCategoryDto(Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            ArabicName = category.ArabicName,
            Slug = category.Slug,
            Description = category.Description,
            ArabicDescription = category.ArabicDescription,
            IconUrl = category.IconUrl,
            DisplayOrder = category.DisplayOrder,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt
        };
    }

    private static EraDto MapToEraDto(Era era)
    {
        return new EraDto
        {
            Id = era.Id,
            Name = era.Name,
            ArabicName = era.ArabicName,
            Slug = era.Slug,
            Description = era.Description,
            ArabicDescription = era.ArabicDescription,
            StartYear = era.StartYear,
            EndYear = era.EndYear,
            MapImageUrl = era.MapImageUrl,
            DisplayOrder = era.DisplayOrder,
            IsActive = era.IsActive,
            CreatedAt = era.CreatedAt
        };
    }
}
