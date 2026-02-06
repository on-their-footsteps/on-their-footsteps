using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnTheirFootsteps.Api.Models.DTOs;
using OnTheirFootsteps.Api.Services;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(IAnalyticsService analyticsService, ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    [HttpPost("events")]
    public async Task<ActionResult> TrackEvent([FromBody] TrackEventDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "Invalid request data", details = ModelState });
            }

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim?.Value;

            var result = await _analyticsService.TrackEventAsync(request.EventName, userId, request.Data);
            
            if (!result)
            {
                return BadRequest(new { error = "Failed to track event" });
            }

            return Ok(new { message = "Event tracked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking event: {EventName}", request?.EventName);
            return StatusCode(500, new { error = "An error occurred while tracking event" });
        }
    }

    [HttpPost("pageview")]
    public async Task<ActionResult> TrackPageView([FromBody] TrackPageViewDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "Invalid request data", details = ModelState });
            }

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var userId = userIdClaim?.Value;

            var result = await _analyticsService.TrackPageViewAsync(request.Page, userId, request.Data);
            
            if (!result)
            {
                return BadRequest(new { error = "Failed to track page view" });
            }

            return Ok(new { message = "Page view tracked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking page view: {Page}", request?.Page);
            return StatusCode(500, new { error = "An error occurred while tracking page view" });
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AnalyticsDto>> GetAnalytics(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var analytics = await _analyticsService.GetAnalyticsAsync(startDate, endDate);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics data");
            return StatusCode(500, new { error = "An error occurred while fetching analytics" });
        }
    }

    [HttpGet("events")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<EventDto>>> GetEvents(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50)
    {
        try
        {
            var events = await _analyticsService.GetEventsAsync(startDate, endDate, page, limit);
            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events");
            return StatusCode(500, new { error = "An error occurred while fetching events" });
        }
    }
}
