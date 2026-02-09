using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Api.Data;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Models.Entities;

namespace OnTheirFootsteps.Api.Services;

public class CharacterService : ICharacterService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CharacterService> _logger;

    public CharacterService(ApplicationDbContext context, ILogger<CharacterService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<CharacterDto>> GetAllCharactersAsync(int page = 1, int limit = 20, string? category = null, string? era = null)
    {
        try
        {
            var query = _context.Characters
                .Include(c => c.Category)
                .Include(c => c.Era)
                .Where(c => c.IsActive);

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(c => c.Category.Slug == category);
            }

            if (!string.IsNullOrEmpty(era))
            {
                query = query.Where(c => c.Era.Slug == era);
            }

            var characters = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return characters.Select(MapToCharacterDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting characters");
            return Enumerable.Empty<CharacterDto>();
        }
    }

    public async Task<CharacterDto?> GetCharacterByIdAsync(int id)
    {
        try
        {
            var character = await _context.Characters
                .Include(c => c.Category)
                .Include(c => c.Era)
                .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

            return character != null ? MapToCharacterDto(character) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting character by ID: {Id}", id);
            return null;
        }
    }

    public async Task<CharacterDto?> GetCharacterBySlugAsync(string slug)
    {
        try
        {
            var character = await _context.Characters
                .Include(c => c.Category)
                .Include(c => c.Era)
                .FirstOrDefaultAsync(c => c.Slug == slug && c.IsActive);

            return character != null ? MapToCharacterDto(character) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting character by slug: {Slug}", slug);
            return null;
        }
    }

    public async Task<CharacterDto> CreateCharacterAsync(CreateCharacterDto request)
    {
        try
        {
            var character = new Character
            {
                Name = request.Name,
                ArabicName = request.ArabicName,
                Slug = request.Slug,
                Description = request.Description,
                ArabicDescription = request.ArabicDescription,
                ImageUrl = request.ImageUrl,
                FullImageUrl = request.FullImageUrl,
                CategoryId = request.CategoryId,
                EraId = request.EraId,
                YearOfBirth = request.YearOfBirth,
                YearOfDeath = request.YearOfDeath,
                PlaceOfBirth = request.PlaceOfBirth,
                PlaceOfDeath = request.PlaceOfDeath,
                IsFeatured = request.IsFeatured,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Characters.Add(character);
            await _context.SaveChangesAsync();

            return MapToCharacterDto(character);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating character");
            throw;
        }
    }

    public async Task<CharacterDto> UpdateCharacterAsync(int id, UpdateCharacterDto request)
    {
        try
        {
            var character = await _context.Characters.FindAsync(id);
            if (character == null)
            {
                throw new KeyNotFoundException($"Character with ID {id} not found");
            }

            character.Name = request.Name;
            character.ArabicName = request.ArabicName;
            character.Slug = request.Slug;
            character.Description = request.Description;
            character.ArabicDescription = request.ArabicDescription;
            character.ImageUrl = request.ImageUrl;
            character.FullImageUrl = request.FullImageUrl;
            character.CategoryId = request.CategoryId;
            character.EraId = request.EraId;
            character.YearOfBirth = request.YearOfBirth;
            character.YearOfDeath = request.YearOfDeath;
            character.PlaceOfBirth = request.PlaceOfBirth;
            character.PlaceOfDeath = request.PlaceOfDeath;
            character.IsFeatured = request.IsFeatured;
            character.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToCharacterDto(character);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating character: {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteCharacterAsync(int id)
    {
        try
        {
            var character = await _context.Characters.FindAsync(id);
            if (character == null)
            {
                return false;
            }

            character.IsActive = false;
            character.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting character: {Id}", id);
            return false;
        }
    }

    public async Task<IEnumerable<CharacterDto>> GetFeaturedCharactersAsync(int limit = 6)
    {
        try
        {
            var characters = await _context.Characters
                .Include(c => c.Category)
                .Include(c => c.Era)
                .Where(c => c.IsActive && c.IsFeatured)
                .OrderByDescending(c => c.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return characters.Select(MapToCharacterDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting featured characters");
            return Enumerable.Empty<CharacterDto>();
        }
    }

    public async Task<IEnumerable<CharacterDto>> SearchCharactersAsync(string query, SearchFiltersDto filters)
    {
        try
        {
            var dbQuery = _context.Characters
                .Include(c => c.Category)
                .Include(c => c.Era)
                .Where(c => c.IsActive);

            // Search by name, description, and Arabic name
            dbQuery = dbQuery.Where(c =>
                c.Name.Contains(query) ||
                c.ArabicName!.Contains(query) ||
                c.Description!.Contains(query) ||
                c.ArabicDescription!.Contains(query));

            // Apply filters
            if (filters.CategoryId.HasValue)
            {
                dbQuery = dbQuery.Where(c => c.CategoryId == filters.CategoryId.Value);
            }

            if (filters.EraId.HasValue)
            {
                dbQuery = dbQuery.Where(c => c.EraId == filters.EraId.Value);
            }

            if (filters.YearFrom.HasValue)
            {
                dbQuery = dbQuery.Where(c => c.YearOfBirth >= filters.YearFrom.Value);
            }

            if (filters.YearTo.HasValue)
            {
                dbQuery = dbQuery.Where(c => c.YearOfDeath <= filters.YearTo.Value);
            }

            var characters = await dbQuery
                .OrderByDescending(c => c.CreatedAt)
                .Take(50)
                .ToListAsync();

            return characters.Select(MapToCharacterDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching characters with query: {Query}", query);
            return Enumerable.Empty<CharacterDto>();
        }
    }

    public async Task<bool> LikeCharacterAsync(int characterId, int userId)
    {
        try
        {
            var existingLike = await _context.CharacterLikes
                .FirstOrDefaultAsync(cl => cl.CharacterId == characterId && cl.UserId == userId);

            if (existingLike != null)
            {
                return false; // Already liked
            }

            var like = new CharacterLike
            {
                CharacterId = characterId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.CharacterLikes.Add(like);

            // Update character likes count
            var character = await _context.Characters.FindAsync(characterId);
            if (character != null)
            {
                character.LikesCount++;
            }

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking character: {CharacterId} by user: {UserId}", characterId, userId);
            return false;
        }
    }

    public async Task<bool> UnlikeCharacterAsync(int characterId, int userId)
    {
        try
        {
            var like = await _context.CharacterLikes
                .FirstOrDefaultAsync(cl => cl.CharacterId == characterId && cl.UserId == userId);

            if (like == null)
            {
                return false; // Not liked
            }

            _context.CharacterLikes.Remove(like);

            // Update character likes count
            var character = await _context.Characters.FindAsync(characterId);
            if (character != null && character.LikesCount > 0)
            {
                character.LikesCount--;
            }

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking character: {CharacterId} by user: {UserId}", characterId, userId);
            return false;
        }
    }

    public async Task<int> IncrementViewsAsync(int characterId, int? userId = null, string? ipAddress = null)
    {
        try
        {
            var view = new CharacterView
            {
                CharacterId = characterId,
                UserId = userId.GetValueOrDefault(),
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            _context.CharacterViews.Add(view);

            // Update character views count
            var character = await _context.Characters.FindAsync(characterId);
            if (character != null)
            {
                character.ViewsCount++;
            }

            await _context.SaveChangesAsync();
            return character?.ViewsCount ?? 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing views for character: {CharacterId}", characterId);
            return 0;
        }
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

    private static CharacterDto MapToCharacterDto(Character character)
    {
        return new CharacterDto
        {
            Id = character.Id,
            Name = character.Name,
            ArabicName = character.ArabicName,
            Slug = character.Slug,
            Description = character.Description,
            ArabicDescription = character.ArabicDescription,
            ImageUrl = character.ImageUrl,
            FullImageUrl = character.FullImageUrl,
            CategoryId = character.CategoryId,
            CategoryName = character.Category?.Name,
            CategoryArabicName = character.Category?.ArabicName,
            EraId = character.EraId,
            EraName = character.Era?.Name,
            EraArabicName = character.Era?.ArabicName,
            YearOfBirth = character.YearOfBirth,
            YearOfDeath = character.YearOfDeath,
            PlaceOfBirth = character.PlaceOfBirth,
            PlaceOfDeath = character.PlaceOfDeath,
            Views = character.ViewsCount,
            Likes = character.LikesCount,
            IsFeatured = character.IsFeatured,
            CreatedAt = character.CreatedAt,
            UpdatedAt = character.UpdatedAt
        };
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
