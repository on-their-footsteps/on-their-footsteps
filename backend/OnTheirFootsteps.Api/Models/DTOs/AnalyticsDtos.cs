namespace OnTheirFootsteps.Api.Models.DTOs;

public class AnalyticsDto
{
    public int TotalEvents { get; set; }
    public int TotalPageViews { get; set; }
    public int UniqueUsers { get; set; }
    public IEnumerable<EventCountDto> TopEvents { get; set; } = new List<EventCountDto>();
    public IEnumerable<PageCountDto> TopPages { get; set; } = new List<PageCountDto>();
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class EventDto
{
    public int Id { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? Data { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EventCountDto
{
    public string EventName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class PageCountDto
{
    public string Page { get; set; } = string.Empty;
    public int Count { get; set; }
}
