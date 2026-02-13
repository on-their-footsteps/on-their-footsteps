using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Domain.Entities;
using OnTheirFootsteps.Domain.Interfaces;
using OnTheirFootsteps.Infrastructure.Data;

namespace OnTheirFootsteps.Infrastructure.Repositories;

public class StoryRepository : Repository<Story>, IStoryRepository
{
    public StoryRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Story>> GetPublishedStoriesAsync()
    {
        return await _dbSet
            .Include(s => s.Character)
            .Where(s => s.IsPublished)
            .OrderByDescending(s => s.PublishedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Story>> GetByCharacterIdAsync(Guid characterId)
    {
        return await _dbSet
            .Include(s => s.Character)
            .Where(s => s.CharacterId == characterId)
            .OrderByDescending(s => s.PublishedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Story>> GetPopularStoriesAsync(int limit = 10)
    {
        return await _dbSet
            .Include(s => s.Character)
            .Where(s => s.IsPublished)
            .OrderByDescending(s => s.ViewCount)
            .Take(limit)
            .ToListAsync();
    }
}
