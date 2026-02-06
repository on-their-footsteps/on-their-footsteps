using System.ComponentModel.DataAnnotations;

namespace OnTheirFootsteps.Api.Models.DTOs;

public class CharacterDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ArabicName { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ArabicDescription { get; set; }
    public string? ImageUrl { get; set; }
    public string? FullImageUrl { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryArabicName { get; set; }
    public int EraId { get; set; }
    public string? EraName { get; set; }
    public string? EraArabicName { get; set; }
    public int? YearOfBirth { get; set; }
    public int? YearOfDeath { get; set; }
    public string? PlaceOfBirth { get; set; }
    public string? PlaceOfDeath { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateCharacterDto
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? ArabicName { get; set; }

    [Required]
    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(2000)]
    public string? ArabicDescription { get; set; }

    [Url]
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Url]
    [MaxLength(500)]
    public string? FullImageUrl { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [Required]
    public int EraId { get; set; }

    public int? YearOfBirth { get; set; }

    public int? YearOfDeath { get; set; }

    [MaxLength(100)]
    public string? PlaceOfBirth { get; set; }

    [MaxLength(100)]
    public string? PlaceOfDeath { get; set; }

    public bool IsFeatured { get; set; } = false;
}

public class UpdateCharacterDto
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? ArabicName { get; set; }

    [Required]
    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(2000)]
    public string? ArabicDescription { get; set; }

    [Url]
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Url]
    [MaxLength(500)]
    public string? FullImageUrl { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [Required]
    public int EraId { get; set; }

    public int? YearOfBirth { get; set; }

    public int? YearOfDeath { get; set; }

    [MaxLength(100)]
    public string? PlaceOfBirth { get; set; }

    [MaxLength(100)]
    public string? PlaceOfDeath { get; set; }

    public bool IsFeatured { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ArabicName { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ArabicDescription { get; set; }
    public string? IconUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EraDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ArabicName { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ArabicDescription { get; set; }
    public int StartYear { get; set; }
    public int? EndYear { get; set; }
    public string? MapImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SearchFiltersDto
{
    public int? CategoryId { get; set; }
    public int? EraId { get; set; }
    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }
    public bool IsFeatured { get; set; }
}
