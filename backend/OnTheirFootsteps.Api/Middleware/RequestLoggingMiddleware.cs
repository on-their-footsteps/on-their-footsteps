using System.Diagnostics;

namespace OnTheirFootsteps.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var elapsed = stopwatch.ElapsedMilliseconds;
            
            var logData = new
            {
                Method = context.Request.Method,
                Path = context.Request.Path,
                QueryString = context.Request.QueryString.ToString(),
                StatusCode = context.Response.StatusCode,
                ElapsedMs = elapsed,
                UserAgent = context.Request.Headers["User-Agent"].ToString(),
                IpAddress = context.Connection.RemoteIpAddress?.ToString()
            };

            if (context.Response.StatusCode >= 400)
            {
                _logger.LogWarning("HTTP {Method} {Path} {StatusCode} - {ElapsedMs}ms - {IpAddress}", 
                    logData.Method, logData.Path, logData.StatusCode, logData.ElapsedMs, logData.IpAddress);
            }
            else
            {
                _logger.LogInformation("HTTP {Method} {Path} {StatusCode} - {ElapsedMs}ms - {IpAddress}", 
                    logData.Method, logData.Path, logData.StatusCode, logData.ElapsedMs, logData.IpAddress);
            }
        }
    }
}
