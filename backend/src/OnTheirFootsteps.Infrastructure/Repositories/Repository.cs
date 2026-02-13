using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Domain.Interfaces;
using OnTheirFootsteps.Infrastructure.Data;

namespace OnTheirFootsteps.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<IEnumerable<T>> FindAsync(System.Linq.Expressions.Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public async Task<T> UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task<T> DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        return await Task.FromResult(entity);
    }

    public async Task<int> CountAsync()
    {
        return await _dbSet.CountAsync();
    }
}
