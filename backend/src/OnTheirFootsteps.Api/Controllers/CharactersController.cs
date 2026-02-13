using Microsoft.AspNetCore.Mvc;
using OnTheirFootsteps.Application.DTOs;
using OnTheirFootsteps.Application.Services;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CharactersController : ControllerBase
{
    private readonly ICharacterService _characterService;

    public CharactersController(ICharacterService characterService)
    {
        _characterService = characterService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CharacterDto>>> GetAllCharacters()
    {
        var characters = await _characterService.GetAllCharactersAsync();
        return Ok(characters);
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<CharacterDto>>> GetActiveCharacters()
    {
        var characters = await _characterService.GetActiveCharactersAsync();
        return Ok(characters);
    }

    [HttpGet("period/{period}")]
    public async Task<ActionResult<IEnumerable<CharacterDto>>> GetByHistoricalPeriod(string period)
    {
        var characters = await _characterService.GetByHistoricalPeriodAsync(period);
        return Ok(characters);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CharacterDto>> GetCharacter(Guid id)
    {
        var character = await _characterService.GetCharacterByIdAsync(id);
        if (character == null)
            return NotFound();

        return Ok(character);
    }

    [HttpPost]
    public async Task<ActionResult<CharacterDto>> CreateCharacter(CreateCharacterDto createCharacterDto)
    {
        var character = await _characterService.CreateCharacterAsync(createCharacterDto);
        return CreatedAtAction(nameof(GetCharacter), new { id = character.Id }, character);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CharacterDto>> UpdateCharacter(Guid id, UpdateCharacterDto updateCharacterDto)
    {
        try
        {
            var character = await _characterService.UpdateCharacterAsync(id, updateCharacterDto);
            return Ok(character);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCharacter(Guid id)
    {
        var result = await _characterService.DeleteCharacterAsync(id);
        if (!result)
            return NotFound();

        return NoContent();
    }
}
