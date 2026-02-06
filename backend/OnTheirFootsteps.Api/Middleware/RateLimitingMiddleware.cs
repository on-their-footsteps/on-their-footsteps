using System.Collections.Concurrent;

namespace OnTheirFootsteps.Api.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly ConcurrentDictionary<string, (DateTime LastAccess, int Count)> _requests;
    private readonly int _maxRequests;
    private readonly TimeSpan _timeWindow;

    public RateLimitingMiddleware(
        RequestDelegate next, 
        ILogger<RateLimitingMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _requests = new ConcurrentDictionary<string, (DateTime, int)>();
        _maxRequests = configuration.GetValue<int>("RateLimit:MaxRequests", 100);
        _timeWindow = TimeSpan.FromMinutes(configuration.GetValue<int>("RateLimit:WindowMinutes", 1));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientIp = GetClientIpAddress(context);
        var key = $"{clientIp}:{DateTime.UtcNow:yyyyMMddHHmm}";

        var now = DateTime.UtcNow;
        var (lastAccess, count) = _requests.GetOrAdd(key, (now, 0));

        if (now - lastAccess > _timeWindow)
        {
            _requests[key] = (now, 1);
        }
        else
        {
            if (count >= _maxRequests)
            {
                _logger.LogWarning("Rate limit exceeded for IP: {Ip}", clientIp);
                context.Response.StatusCode = 429;
                await context.Response.WriteAsync("Rate limit exceeded. Please try again later.");
                return;
            }

            _requests[key] = (lastAccess, count + 1);
        }

        await _next(context);
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        
        if (context.Request.Headers.ContainsKey("X-Forwarded-For"))
        {
            var forwardedIps = context.Request.Headers["X-Forwarded-For"].ToString();
            if (!string.IsNullOrEmpty(forwardedIps))
            {
                ipAddress = forwardedIps.Split(',')[0].Trim();
            }
        }

        return ipAddress ?? "unknown";
    }
}
