namespace OnTheirFootsteps.Api.Models.DTOs;

public class MediaFileDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int? CharacterId { get; set; }
    public int? UserId { get; set; }
    public string? AltText { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
