using OnTheirFootsteps.Api.Models.DTOs;

namespace OnTheirFootsteps.Api.Services;

public interface ICharacterService
{
    // Basic CRUD operations
    Task<IEnumerable<CharacterDto>> GetAllCharactersAsync(int page = 1, int limit = 20, string? category = null, string? era = null);
    Task<CharacterDto?> GetCharacterByIdAsync(int id);
    Task<CharacterDto?> GetCharacterBySlugAsync(string slug);
    Task<CharacterDto> CreateCharacterAsync(CreateCharacterDto request);
    Task<CharacterDto> UpdateCharacterAsync(int id, UpdateCharacterDto request);
    Task<bool> DeleteCharacterAsync(int id);

    // Special operations
    Task<IEnumerable<CharacterDto>> GetFeaturedCharactersAsync(int limit = 6);
    Task<IEnumerable<CharacterDto>> SearchCharactersAsync(string query, SearchFiltersDto filters);
    Task<bool> LikeCharacterAsync(int characterId, int userId);
    Task<bool> UnlikeCharacterAsync(int characterId, int userId);
    Task<int> IncrementViewsAsync(int characterId, int? userId = null, string? ipAddress = null);

    // Categories and Eras
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
    Task<IEnumerable<EraDto>> GetErasAsync();
}
