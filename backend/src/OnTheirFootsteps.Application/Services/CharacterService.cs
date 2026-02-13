using OnTheirFootsteps.Application.DTOs;
using OnTheirFootsteps.Application.Interfaces;
using OnTheirFootsteps.Domain.Entities;
using OnTheirFootsteps.Domain.Interfaces;

namespace OnTheirFootsteps.Application.Services;

public class CharacterService : ICharacterService
{
    private readonly ICharacterRepository _characterRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CharacterService(ICharacterRepository characterRepository, IUnitOfWork unitOfWork)
    {
        _characterRepository = characterRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<CharacterDto>> GetAllCharactersAsync()
    {
        var characters = await _characterRepository.GetAllAsync();
        return characters.Select(MapToDto);
    }

    public async Task<CharacterDto?> GetCharacterByIdAsync(Guid id)
    {
        var character = await _characterRepository.GetByIdAsync(id);
        return character == null ? null : MapToDto(character);
    }

    public async Task<CharacterDto> CreateCharacterAsync(CreateCharacterDto createCharacterDto)
    {
        var character = new Character
        {
            Id = Guid.NewGuid(),
            Name = createCharacterDto.Name,
            Description = createCharacterDto.Description,
            HistoricalPeriod = createCharacterDto.HistoricalPeriod,
            Location = createCharacterDto.Location,
            ImageUrl = createCharacterDto.ImageUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdCharacter = await _characterRepository.AddAsync(character);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(createdCharacter);
    }

    public async Task<CharacterDto> UpdateCharacterAsync(Guid id, UpdateCharacterDto updateCharacterDto)
    {
        var existingCharacter = await _characterRepository.GetByIdAsync(id);
        if (existingCharacter == null)
            throw new KeyNotFoundException($"Character with ID {id} not found.");

        existingCharacter.Name = updateCharacterDto.Name;
        existingCharacter.Description = updateCharacterDto.Description;
        existingCharacter.HistoricalPeriod = updateCharacterDto.HistoricalPeriod;
        existingCharacter.Location = updateCharacterDto.Location;
        existingCharacter.ImageUrl = updateCharacterDto.ImageUrl;
        existingCharacter.IsActive = updateCharacterDto.IsActive;
        existingCharacter.UpdatedAt = DateTime.UtcNow;

        var updatedCharacter = await _characterRepository.UpdateAsync(existingCharacter);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(updatedCharacter);
    }

    public async Task<bool> DeleteCharacterAsync(Guid id)
    {
        var character = await _characterRepository.GetByIdAsync(id);
        if (character == null)
            return false;

        await _characterRepository.DeleteAsync(character);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<CharacterDto>> GetActiveCharactersAsync()
    {
        var characters = await _characterRepository.GetActiveCharactersAsync();
        return characters.Select(MapToDto);
    }

    public async Task<IEnumerable<CharacterDto>> GetByHistoricalPeriodAsync(string period)
    {
        var characters = await _characterRepository.GetByHistoricalPeriodAsync(period);
        return characters.Select(MapToDto);
    }

    private static CharacterDto MapToDto(Character character)
    {
        return new CharacterDto
        {
            Id = character.Id,
            Name = character.Name,
            Description = character.Description,
            HistoricalPeriod = character.HistoricalPeriod,
            Location = character.Location,
            ImageUrl = character.ImageUrl,
            IsActive = character.IsActive,
            CreatedAt = character.CreatedAt,
            UpdatedAt = character.UpdatedAt
        };
    }
}
