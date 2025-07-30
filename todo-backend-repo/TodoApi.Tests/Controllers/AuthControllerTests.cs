using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Controllers;
using TodoApi.Models;
using Xunit;
using FluentAssertions;

namespace TodoApi.Tests.Controllers;

public class AuthControllerTests
{
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _controller = new AuthController();
    }

    [Fact]
    public void GetUserInfo_WithCognitoUser_ReturnsUserInfo()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new("sub", "cognito-user-123"),
            new("name", "John Doe"),
            new("email", "john@example.com"),
            new("iss", "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };

        // Act
        var result = _controller.GetUserInfo();

        // Assert
        result.Should().BeOfType<ActionResult<UserInfo>>();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var userInfo = okResult.Value.Should().BeOfType<UserInfo>().Subject;

        userInfo.Id.Should().Be("cognito-user-123");
        userInfo.Name.Should().Be("John Doe");
        userInfo.Email.Should().Be("john@example.com");
        userInfo.Provider.Should().Be("Cognito");
    }

    [Fact]
    public void GetUserInfo_WithAzureADUser_ReturnsUserInfo()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new("oid", "azure-user-456"),
            new("name", "Jane Smith"),
            new("email", "jane@company.com"),
            new("iss", "https://login.microsoftonline.com/tenant-id/v2.0")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };

        // Act
        var result = _controller.GetUserInfo();

        // Assert
        result.Should().BeOfType<ActionResult<UserInfo>>();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var userInfo = okResult.Value.Should().BeOfType<UserInfo>().Subject;

        userInfo.Id.Should().Be("azure-user-456");
        userInfo.Name.Should().Be("Jane Smith");
        userInfo.Email.Should().Be("jane@company.com");
        userInfo.Provider.Should().Be("AzureAD");
    }

    [Fact]
    public void GetUserInfo_WithFallbackClaims_ReturnsUserInfo()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "fallback-user-789"),
            new(ClaimTypes.Name, "Bob Johnson"),
            new(ClaimTypes.Email, "bob@test.com"),
            new("iss", "https://some-other-provider.com")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };

        // Act
        var result = _controller.GetUserInfo();

        // Assert
        result.Should().BeOfType<ActionResult<UserInfo>>();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var userInfo = okResult.Value.Should().BeOfType<UserInfo>().Subject;

        userInfo.Id.Should().Be("fallback-user-789");
        userInfo.Name.Should().Be("Bob Johnson");
        userInfo.Email.Should().Be("bob@test.com");
        userInfo.Provider.Should().Be("AzureAD"); // Default when not cognito
    }

    [Fact]
    public void GetUserInfo_WithMissingClaims_ReturnsEmptyStrings()
    {
        // Arrange
        var claims = new List<Claim>(); // Empty claims
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };

        // Act
        var result = _controller.GetUserInfo();

        // Assert
        result.Should().BeOfType<ActionResult<UserInfo>>();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var userInfo = okResult.Value.Should().BeOfType<UserInfo>().Subject;

        userInfo.Id.Should().Be(string.Empty);
        userInfo.Name.Should().Be(string.Empty);
        userInfo.Email.Should().Be(string.Empty);
        userInfo.Provider.Should().Be("AzureAD");
    }

    [Fact]
    public void Health_ReturnsOkWithHealthStatus()
    {
        // Act
        var result = _controller.Health();

        // Assert
        result.Should().BeOfType<ActionResult<object>>();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var healthStatus = okResult.Value;

        healthStatus.Should().NotBeNull();
        var healthObject = healthStatus!.GetType().GetProperty("status")?.GetValue(healthStatus);
        healthObject.Should().Be("healthy");
    }
}