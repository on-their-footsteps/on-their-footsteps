using Microsoft.AspNetCore.Mvc;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SampleDataController : ControllerBase
{
    [HttpGet("characters")]
    public IActionResult GetSampleCharacters()
    {
        var sampleCharacters = new[]
        {
            new
            {
                Id = Guid.NewGuid(),
                Name = "Prophet Muhammad (PBUH)",
                Description = "The final prophet of Islam, born in Mecca in 570 CE.",
                HistoricalPeriod = "7th Century",
                Location = "Mecca, Saudi Arabia",
                ImageUrl = "/images/prophet-muhammad.jpg",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new
            {
                Id = Guid.NewGuid(),
                Name = "Abu Bakr As-Siddiq",
                Description = "The first Caliph of Islam and closest companion of Prophet Muhammad.",
                HistoricalPeriod = "7th Century",
                Location = "Mecca, Saudi Arabia",
                ImageUrl = "/images/abu-bakr.jpg",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new
            {
                Id = Guid.NewGuid(),
                Name = "Umar ibn Al-Khattab",
                Description = "The second Caliph of Islam, known for his justice and administrative skills.",
                HistoricalPeriod = "7th Century",
                Location = "Mecca, Saudi Arabia",
                ImageUrl = "/images/umar.jpg",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new
            {
                Id = Guid.NewGuid(),
                Name = "Aisha bint Abu Bakr",
                Description = "Wife of Prophet Muhammad and scholar of Islam, known for her knowledge and teachings.",
                HistoricalPeriod = "7th Century",
                Location = "Mecca, Saudi Arabia",
                ImageUrl = "/images/aisha.jpg",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        return Ok(sampleCharacters);
    }

    [HttpGet("stories")]
    public IActionResult GetSampleStories()
    {
        var sampleStories = new[]
        {
            new
            {
                Id = Guid.NewGuid(),
                Title = "The Life of Prophet Muhammad",
                Content = "A comprehensive story about the life, teachings, and legacy of Prophet Muhammad (PBUH).",
                Summary = "Learn about the final prophet of Islam and his impact on humanity.",
                PublishedAt = DateTime.UtcNow.AddDays(-7),
                IsPublished = true,
                ViewCount = 1250,
                CharacterId = Guid.NewGuid(),
                Character = new
                {
                    Id = Guid.NewGuid(),
                    Name = "Prophet Muhammad (PBUH)",
                    Description = "The final prophet of Islam",
                    HistoricalPeriod = "7th Century",
                    Location = "Mecca, Saudi Arabia",
                    ImageUrl = "/images/prophet-muhammad.jpg",
                    IsActive = true
                },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new
            {
                Id = Guid.NewGuid(),
                Title = "The Golden Age of Islam",
                Content = "Exploring the scientific, cultural, and intellectual achievements during the Abbasid Caliphate.",
                Summary = "Discover how Islamic civilization advanced science, mathematics, and philosophy.",
                PublishedAt = DateTime.UtcNow.AddDays(-3),
                IsPublished = true,
                ViewCount = 890,
                CharacterId = Guid.NewGuid(),
                Character = new
                {
                    Id = Guid.NewGuid(),
                    Name = "Harun al-Rashid",
                    Description = "Fifth Abbasid Caliph",
                    HistoricalPeriod = "8th Century",
                    Location = "Baghdad, Iraq",
                    ImageUrl = "/images/harun.jpg",
                    IsActive = true
                },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        return Ok(sampleStories);
    }
}
