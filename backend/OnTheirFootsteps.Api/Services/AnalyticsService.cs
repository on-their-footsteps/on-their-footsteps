using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Api.Data;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Models.Entities;
using System.Text.Json;

namespace OnTheirFootsteps.Api.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AnalyticsService> _logger;

    public AnalyticsService(ApplicationDbContext context, ILogger<AnalyticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> TrackEventAsync(string eventName, string? userId = null, object? data = null)
    {
        try
        {
            var analyticsEvent = new AnalyticsEvent
            {
                EventName = eventName,
                UserId = userId,
                Data = data != null ? JsonSerializer.Serialize(data) : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.AnalyticsEvents.Add(analyticsEvent);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking event: {EventName}", eventName);
            return false;
        }
    }

    public async Task<bool> TrackPageViewAsync(string page, string? userId = null, object? data = null)
    {
        try
        {
            var pageView = new PageView
            {
                Page = page,
                UserId = userId,
                Data = data != null ? JsonSerializer.Serialize(data) : null,
                CreatedAt = DateTime.UtcNow
            };

            _context.PageViews.Add(pageView);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking page view: {Page}", page);
            return false;
        }
    }

    public async Task<AnalyticsDto> GetAnalyticsAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var totalEvents = await _context.AnalyticsEvents
                .Where(e => e.CreatedAt >= start && e.CreatedAt <= end)
                .CountAsync();

            var totalPageViews = await _context.PageViews
                .Where(pv => pv.CreatedAt >= start && pv.CreatedAt <= end)
                .CountAsync();

            var uniqueUsers = await _context.AnalyticsEvents
                .Where(e => e.CreatedAt >= start && e.CreatedAt <= end && e.UserId != null)
                .Select(e => e.UserId)
                .Distinct()
                .CountAsync();

            var topEvents = await _context.AnalyticsEvents
                .Where(e => e.CreatedAt >= start && e.CreatedAt <= end)
                .GroupBy(e => e.EventName)
                .Select(g => new { EventName = g.Key, Count = g.Count() })
                .OrderByDescending(g => g.Count)
                .Take(10)
                .ToListAsync();

            var topPages = await _context.PageViews
                .Where(pv => pv.CreatedAt >= start && pv.CreatedAt <= end)
                .GroupBy(pv => pv.Page)
                .Select(g => new { Page = g.Key, Count = g.Count() })
                .OrderByDescending(g => g.Count)
                .Take(10)
                .ToListAsync();

            return new AnalyticsDto
            {
                TotalEvents = totalEvents,
                TotalPageViews = totalPageViews,
                UniqueUsers = uniqueUsers,
                TopEvents = topEvents.Select(e => new EventCountDto { EventName = e.EventName, Count = e.Count }),
                TopPages = topPages.Select(p => new PageCountDto { Page = p.Page, Count = p.Count }),
                StartDate = start,
                EndDate = end
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics data");
            return new AnalyticsDto();
        }
    }

    public async Task<IEnumerable<EventDto>> GetEventsAsync(DateTime? startDate = null, DateTime? endDate = null, int page = 1, int limit = 50)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var events = await _context.AnalyticsEvents
                .Where(e => e.CreatedAt >= start && e.CreatedAt <= end)
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return events.Select(MapToEventDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events");
            return Enumerable.Empty<EventDto>();
        }
    }

    private static EventDto MapToEventDto(AnalyticsEvent analyticsEvent)
    {
        return new EventDto
        {
            Id = analyticsEvent.Id,
            EventName = analyticsEvent.EventName,
            UserId = analyticsEvent.UserId,
            Data = analyticsEvent.Data,
            CreatedAt = analyticsEvent.CreatedAt
        };
    }
}
