using Microsoft.AspNetCore.Mvc;
using OnTheirFootsteps.Application.DTOs;
using OnTheirFootsteps.Application.Services;
using OnTheirFootsteps.Domain.Entities;
using OnTheirFootsteps.Domain.Interfaces;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoriesController : ControllerBase
{
    private readonly IStoryRepository _storyRepository;

    public StoriesController(IStoryRepository storyRepository)
    {
        _storyRepository = storyRepository;
    }

    [HttpGet("published")]
    public async Task<ActionResult<IEnumerable<StoryDto>>> GetPublishedStories()
    {
        var stories = await _storyRepository.GetPublishedStoriesAsync();
        var storyDtos = stories.Select(MapToDto);
        return Ok(storyDtos);
    }

    [HttpGet("popular")]
    public async Task<ActionResult<IEnumerable<StoryDto>>> GetPopularStories([FromQuery] int limit = 10)
    {
        var stories = await _storyRepository.GetPopularStoriesAsync(limit);
        var storyDtos = stories.Select(MapToDto);
        return Ok(storyDtos);
    }

    [HttpGet("character/{characterId}")]
    public async Task<ActionResult<IEnumerable<StoryDto>>> GetStoriesByCharacter(Guid characterId)
    {
        var stories = await _storyRepository.GetByCharacterIdAsync(characterId);
        var storyDtos = stories.Select(MapToDto);
        return Ok(storyDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StoryDto>> GetStory(Guid id)
    {
        var story = await _storyRepository.GetByIdAsync(id);
        if (story == null)
            return NotFound();

        return Ok(MapToDto(story));
    }

    private static StoryDto MapToDto(Story story)
    {
        return new StoryDto
        {
            Id = story.Id,
            Title = story.Title,
            Content = story.Content,
            Summary = story.Summary,
            PublishedAt = story.PublishedAt,
            IsPublished = story.IsPublished,
            ViewCount = story.ViewCount,
            CharacterId = story.CharacterId,
            Character = story.Character == null ? null : new CharacterDto
            {
                Id = story.Character.Id,
                Name = story.Character.Name,
                Description = story.Character.Description,
                HistoricalPeriod = story.Character.HistoricalPeriod,
                Location = story.Character.Location,
                ImageUrl = story.Character.ImageUrl,
                IsActive = story.Character.IsActive,
                CreatedAt = story.Character.CreatedAt,
                UpdatedAt = story.Character.UpdatedAt
            },
            CreatedAt = story.CreatedAt,
            UpdatedAt = story.UpdatedAt
        };
    }
}
