using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Domain.Entities;
using OnTheirFootsteps.Domain.Interfaces;
using OnTheirFootsteps.Infrastructure.Data;

namespace OnTheirFootsteps.Infrastructure.Repositories;

public class CharacterRepository : Repository<Character>, ICharacterRepository
{
    public CharacterRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Character>> GetActiveCharactersAsync()
    {
        return await _dbSet
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Character>> GetByHistoricalPeriodAsync(string period)
    {
        return await _dbSet
            .Where(c => c.HistoricalPeriod.ToLower().Contains(period.ToLower()))
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Character?> GetByNameAsync(string name)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
    }
}
