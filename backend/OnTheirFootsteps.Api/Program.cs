using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OnTheirFootsteps.Api.Data;
using OnTheirFootsteps.Api.Extensions;
using OnTheirFootsteps.Api.Middleware;
using OnTheirFootsteps.Api.Services;
using Serilog;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/app-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v2", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Version = "v2",
            Title = "على خطاهم API",
            Description = "Educational platform for Islamic historical figures and characters",
            TermsOfService = new Uri("https://example.com/terms"),
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "Support",
                Email = "support@ontheirfootsteps.com"
            },
            License = new Microsoft.OpenApi.Models.OpenApiLicense
            {
                Name = "MIT",
                Url = new Uri("https://opensource.org/licenses/MIT")
            }
        });
    });

// Configure Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
            ClockSkew = TimeSpan.Zero
        };
    });

// Configure Authorization
builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]?.Split(',') ?? new[] { "http://localhost:3000" })
             .AllowAnyMethod()
             .AllowAnyHeader()
             .AllowCredentials();
    });
});

// Configure Redis Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<string, HttpContext>(options =>
    {
        options.PermitLimit = 100;
        options.Window = TimeSpan.FromSeconds(60);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.SegmentsPerWindow = 1;
    });
});

// Add services to the container
builder.Services.AddApplicationServices(builder.Configuration);

// Configure JSON options
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

var app = builder.Build();

// Configure middleware pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();
app.UseMiddleware<CorsMiddleware>();

// Use CORS
app.UseCors(builder =>
{
    builder.AllowAnyOrigin()
           .AllowAnyMethod()
           .AllowAnyHeader();
});

// Use authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

// Configure Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "OnTheirFootsteps API v2");
        c.RoutePrefix = "swagger";
    });
}

// Serve static files
app.UseStaticFiles();

// Configure routing
app.MapControllers();

// Health check endpoint
app.MapGet("/api/health", () => new
{
    Status = "Healthy",
    Timestamp = DateTime.UtcNow,
    Version = "2.0.0",
    Environment = app.Environment.EnvironmentName
});

// Root endpoint
app.MapGet("/", () => new
{
    Message = "مرحباً بك في تطبيق 'على خُطاهم'",
    Version = "2.0.0",
    Docs = "/api/docs",
    Health = "/api/health"
});

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
}

try
{
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
