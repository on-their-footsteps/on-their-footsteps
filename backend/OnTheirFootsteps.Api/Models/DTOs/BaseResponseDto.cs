namespace OnTheirFootsteps.Api.Models.DTOs;

public class BaseResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? Errors { get; set; }
}
