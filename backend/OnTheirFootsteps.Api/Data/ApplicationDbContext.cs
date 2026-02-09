using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Api.Models.Entities;
using OnTheirFootsteps.Api.Models;

namespace OnTheirFootsteps.Api.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // DbSets for entities
    public DbSet<Character> Characters { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Era> Eras { get; set; } = null!;
    public DbSet<CharacterLike> CharacterLikes { get; set; } = null!;
    public DbSet<CharacterView> CharacterViews { get; set; } = null!;
    public DbSet<UserProgress> UserProgress { get; set; } = null!;
    public DbSet<UserSession> UserSessions { get; set; } = null!;
    public DbSet<MediaFile> MediaFiles { get; set; } = null!;
    public DbSet<AnalyticsEvent> AnalyticsEvents { get; set; } = null!;
    public DbSet<PageView> PageViews { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Character entity
        modelBuilder.Entity<Character>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ArabicName).HasMaxLength(255);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ArabicDescription).HasMaxLength(2000);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.FullImageUrl).HasMaxLength(500);
            entity.Property(e => e.PlaceOfBirth).HasMaxLength(100);
            entity.Property(e => e.PlaceOfDeath).HasMaxLength(100);
            entity.Property(e => e.ViewsCount).HasDefaultValue(0);
            entity.Property(e => e.LikesCount).HasDefaultValue(0);
            entity.Property(e => e.IsFeatured).HasDefaultValue(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(c => c.Category)
                  .WithMany()
                  .HasForeignKey(c => c.CategoryId);
            entity.HasOne(c => c.Era)
                  .WithMany()
                  .HasForeignKey(c => c.EraId);
        });

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.UserName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.ArabicName).HasMaxLength(100);
            entity.Property(e => e.ProfileImage).HasMaxLength(500);
            entity.Property(e => e.PreferredLanguage).HasMaxLength(20).HasDefaultValue("en");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsVerified).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure indexes
        modelBuilder.Entity<Character>()
            .HasIndex(c => c.Slug)
            .IsUnique()
            .HasDatabaseName("ix_characters_slug");

        modelBuilder.Entity<Character>()
            .HasIndex(c => c.CategoryId)
            .HasDatabaseName("ix_characters_category");

        modelBuilder.Entity<Character>()
            .HasIndex(c => c.EraId)
            .HasDatabaseName("ix_characters_era");

        modelBuilder.Entity<Character>()
            .HasIndex(c => c.IsFeatured)
            .HasDatabaseName("ix_characters_featured");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("ix_users_email");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.UserName)
            .IsUnique()
            .HasDatabaseName("ix_users_username");
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // Handle concurrency conflicts
            throw new InvalidOperationException("Concurrency conflict detected. Please refresh and try again.", ex);
        }
        catch (DbUpdateException ex)
        {
            // Handle database update exceptions
            throw new InvalidOperationException("Database update failed. Please try again.", ex);
        }
    }
}
