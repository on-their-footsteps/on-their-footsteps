using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Api.Data;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Models.Entities;

namespace OnTheirFootsteps.Api.Services;

public class MediaService : IMediaService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MediaService> _logger;
    private readonly string _uploadPath;

    public MediaService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<MediaService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _uploadPath = configuration["FileUpload:UploadPath"] ?? "wwwroot/uploads";
        
        // Ensure upload directory exists
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<string> UploadImageAsync(IFormFile file, string type = "character")
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("No file provided");
            }

            // Validate file
            var allowedExtensions = _configuration.GetSection("FileUpload:AllowedExtensions").Get<string[]>() 
                ?? new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg" };
            
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                throw new ArgumentException($"File extension {fileExtension} is not allowed");
            }

            var maxFileSize = _configuration.GetValue<long>("FileUpload:MaxFileSize", 10485760); // 10MB default
            if (file.Length > maxFileSize)
            {
                throw new ArgumentException($"File size exceeds maximum allowed size of {maxFileSize} bytes");
            }

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(_uploadPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create database record
            var mediaFile = new MediaFile
            {
                FileName = file.FileName,
                FilePath = filePath,
                Url = $"/uploads/{fileName}",
                FileType = type,
                MimeType = file.ContentType,
                FileSize = file.Length,
                CreatedAt = DateTime.UtcNow
            };

            _context.MediaFiles.Add(mediaFile);
            await _context.SaveChangesAsync();

            return mediaFile.Url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file: {FileName}", file?.FileName);
            throw;
        }
    }

    public async Task<bool> DeleteImageAsync(string url)
    {
        try
        {
            if (string.IsNullOrEmpty(url))
            {
                return false;
            }

            var mediaFile = await _context.MediaFiles
                .FirstOrDefaultAsync(mf => mf.Url == url);

            if (mediaFile == null)
            {
                return false;
            }

            // Delete physical file
            if (File.Exists(mediaFile.FilePath))
            {
                File.Delete(mediaFile.FilePath);
            }

            // Delete database record
            _context.MediaFiles.Remove(mediaFile);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image: {Url}", url);
            return false;
        }
    }

    public async Task<IEnumerable<MediaFileDto>> GetMediaFilesAsync(int? characterId = null, int page = 1, int limit = 20)
    {
        try
        {
            var query = _context.MediaFiles.Where(mf => mf.IsActive);

            if (characterId.HasValue)
            {
                query = query.Where(mf => mf.CharacterId == characterId.Value);
            }

            var mediaFiles = await query
                .OrderByDescending(mf => mf.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return mediaFiles.Select(MapToMediaFileDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting media files");
            return Enumerable.Empty<MediaFileDto>();
        }
    }

    public async Task<MediaFileDto?> GetMediaFileByIdAsync(int id)
    {
        try
        {
            var mediaFile = await _context.MediaFiles
                .FirstOrDefaultAsync(mf => mf.Id == id && mf.IsActive);

            return mediaFile != null ? MapToMediaFileDto(mediaFile) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting media file by ID: {Id}", id);
            return null;
        }
    }

    private static MediaFileDto MapToMediaFileDto(MediaFile mediaFile)
    {
        return new MediaFileDto
        {
            Id = mediaFile.Id,
            FileName = mediaFile.FileName,
            Url = mediaFile.Url,
            FileType = mediaFile.FileType,
            MimeType = mediaFile.MimeType,
            FileSize = mediaFile.FileSize,
            CharacterId = mediaFile.CharacterId,
            UserId = mediaFile.UserId,
            AltText = mediaFile.AltText,
            CreatedAt = mediaFile.CreatedAt,
            UpdatedAt = mediaFile.UpdatedAt
        };
    }
}
