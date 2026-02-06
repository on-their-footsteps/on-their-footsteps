using System.Net;
using System.Text.Json;
using OnTheirFootsteps.Api.Models.DTOs;

namespace OnTheirFootsteps.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = exception switch
        {
            ArgumentException => new BaseResponseDto
            {
                Success = false,
                Message = exception.Message,
                Errors = new List<string> { exception.Message }
            },
            KeyNotFoundException => new BaseResponseDto
            {
                Success = false,
                Message = exception.Message,
                Errors = new List<string> { exception.Message }
            },
            InvalidOperationException => new BaseResponseDto
            {
                Success = false,
                Message = exception.Message,
                Errors = new List<string> { exception.Message }
            },
            UnauthorizedAccessException => new BaseResponseDto
            {
                Success = false,
                Message = "Unauthorized access",
                Errors = new List<string> { exception.Message }
            },
            _ => new BaseResponseDto
            {
                Success = false,
                Message = "An internal server error occurred",
                Errors = new List<string> { exception.Message }
            }
        };

        var statusCode = exception switch
        {
            ArgumentException => 400,
            KeyNotFoundException => 404,
            UnauthorizedAccessException => 401,
            InvalidOperationException => 400,
            _ => 500
        };

        context.Response.StatusCode = statusCode;
        
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var jsonResponse = JsonSerializer.Serialize(response, jsonOptions);
        await context.Response.WriteAsync(jsonResponse);
    }
}
