using Microsoft.AspNetCore.Mvc;

namespace OnTheirFootsteps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { 
            Message = "On Their Footsteps API is running!",
            Version = "1.0.0",
            Framework = ".NET 10",
            Architecture = "N-Tier",
            Timestamp = DateTime.UtcNow
        });
    }
}
