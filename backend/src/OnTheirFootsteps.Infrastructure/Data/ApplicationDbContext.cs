using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Domain.Entities;

namespace OnTheirFootsteps.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Character> Characters { get; set; }
    public DbSet<Story> Stories { get; set; }
    public DbSet<Comment> Comments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Character>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.HistoricalPeriod).HasMaxLength(100);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedBy).HasMaxLength(100);
            entity.Property(e => e.UpdatedBy).HasMaxLength(100);
        });

        modelBuilder.Entity<Story>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.Summary).HasMaxLength(500);
            entity.Property(e => e.CreatedBy).HasMaxLength(100);
            entity.Property(e => e.UpdatedBy).HasMaxLength(100);
            
            entity.HasOne(e => e.Character)
                  .WithMany(c => c.Stories)
                  .HasForeignKey(e => e.CharacterId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.AuthorName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.AuthorEmail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedBy).HasMaxLength(100);
            entity.Property(e => e.UpdatedBy).HasMaxLength(100);
            
            entity.HasOne(e => e.Story)
                  .WithMany(s => s.Comments)
                  .HasForeignKey(e => e.StoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
