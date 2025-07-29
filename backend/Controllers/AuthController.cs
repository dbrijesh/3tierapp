using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Models;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpGet("user")]
    [Authorize(Policy = "AuthenticatedUser")]
    public ActionResult<UserInfo> GetUserInfo()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                    User.FindFirst("sub")?.Value ?? 
                    User.FindFirst("oid")?.Value ?? string.Empty;

        var name = User.FindFirst(ClaimTypes.Name)?.Value ?? 
                  User.FindFirst("name")?.Value ?? 
                  User.FindFirst("preferred_username")?.Value ?? string.Empty;

        var email = User.FindFirst(ClaimTypes.Email)?.Value ?? 
                   User.FindFirst("email")?.Value ?? string.Empty;

        var provider = User.FindFirst("iss")?.Value?.Contains("cognito") == true ? "Cognito" : "AzureAD";

        return Ok(new UserInfo
        {
            Id = userId,
            Name = name,
            Email = email,
            Provider = provider
        });
    }

    [HttpGet("health")]
    public ActionResult<object> Health()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }
}