using OnTheirFootsteps.Domain.Entities;

namespace OnTheirFootsteps.Domain.Interfaces;

public interface ICharacterRepository : IRepository<Character>
{
    Task<IEnumerable<Character>> GetActiveCharactersAsync();
    Task<IEnumerable<Character>> GetByHistoricalPeriodAsync(string period);
    Task<Character?> GetByNameAsync(string name);
}
