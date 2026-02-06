using OnTheirFootsteps.Api.Models.DTOs;

namespace OnTheirFootsteps.Api.Services;

public interface IAnalyticsService
{
    Task<bool> TrackEventAsync(string eventName, string? userId = null, object? data = null);
    Task<bool> TrackPageViewAsync(string page, string? userId = null, object? data = null);
    Task<AnalyticsDto> GetAnalyticsAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<IEnumerable<EventDto>> GetEventsAsync(DateTime? startDate = null, DateTime? endDate = null, int page = 1, int limit = 50);
}
