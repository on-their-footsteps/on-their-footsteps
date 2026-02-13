using Microsoft.EntityFrameworkCore;
using OnTheirFootsteps.Application.Interfaces;
using OnTheirFootsteps.Application.Services;
using OnTheirFootsteps.Domain.Interfaces;
using OnTheirFootsteps.Infrastructure.Data;
using OnTheirFootsteps.Infrastructure;
using OnTheirFootsteps.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ICharacterRepository, CharacterRepository>();
builder.Services.AddScoped<IStoryRepository, StoryRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddScoped<ICharacterService, CharacterService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
