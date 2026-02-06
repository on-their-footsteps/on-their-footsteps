using System.ComponentModel.DataAnnotations;

namespace OnTheirFootsteps.Api.Models.DTOs;

public class TrackEventDto
{
    [Required]
    [MaxLength(100)]
    public string EventName { get; set; } = string.Empty;

    public object? Data { get; set; }
}

public class TrackPageViewDto
{
    [Required]
    [MaxLength(500)]
    public string Page { get; set; } = string.Empty;

    public object? Data { get; set; }
}
