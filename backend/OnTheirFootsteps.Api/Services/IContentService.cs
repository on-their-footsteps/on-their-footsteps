using OnTheirFootsteps.Api.Models.DTOs;

namespace OnTheirFootsteps.Api.Services;

public interface IContentService
{
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
    Task<IEnumerable<EraDto>> GetErasAsync();
    Task<CategoryDto?> GetCategoryByIdAsync(int id);
    Task<CategoryDto?> GetCategoryBySlugAsync(string slug);
    Task<EraDto?> GetEraByIdAsync(int id);
    Task<EraDto?> GetEraBySlugAsync(string slug);
}
