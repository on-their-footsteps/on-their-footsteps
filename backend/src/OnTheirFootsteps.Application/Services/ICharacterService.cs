using OnTheirFootsteps.Application.DTOs;

namespace OnTheirFootsteps.Application.Services;

public interface ICharacterService
{
    Task<IEnumerable<CharacterDto>> GetAllCharactersAsync();
    Task<CharacterDto?> GetCharacterByIdAsync(Guid id);
    Task<CharacterDto> CreateCharacterAsync(CreateCharacterDto createCharacterDto);
    Task<CharacterDto> UpdateCharacterAsync(Guid id, UpdateCharacterDto updateCharacterDto);
    Task<bool> DeleteCharacterAsync(Guid id);
    Task<IEnumerable<CharacterDto>> GetActiveCharactersAsync();
    Task<IEnumerable<CharacterDto>> GetByHistoricalPeriodAsync(string period);
}
