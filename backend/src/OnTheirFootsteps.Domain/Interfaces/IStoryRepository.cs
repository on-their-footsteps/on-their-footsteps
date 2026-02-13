using OnTheirFootsteps.Domain.Entities;

namespace OnTheirFootsteps.Domain.Interfaces;

public interface IStoryRepository : IRepository<Story>
{
    Task<IEnumerable<Story>> GetPublishedStoriesAsync();
    Task<IEnumerable<Story>> GetByCharacterIdAsync(Guid characterId);
    Task<IEnumerable<Story>> GetPopularStoriesAsync(int limit = 10);
}
