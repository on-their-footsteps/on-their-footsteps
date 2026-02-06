using Microsoft.AspNetCore.Http;
using OnTheirFootsteps.Api.Models.DTOs;

namespace OnTheirFootsteps.Api.Services;

public interface IMediaService
{
    Task<string> UploadImageAsync(IFormFile file, string type = "character");
    Task<bool> DeleteImageAsync(string url);
    Task<IEnumerable<MediaFileDto>> GetMediaFilesAsync(int? characterId = null, int page = 1, int limit = 20);
    Task<MediaFileDto?> GetMediaFileByIdAsync(int id);
}
