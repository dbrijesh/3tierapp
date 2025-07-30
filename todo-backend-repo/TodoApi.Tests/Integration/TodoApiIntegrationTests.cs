using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using TodoApi.Models;
using Xunit;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace TodoApi.Tests.Integration;

public class TodoApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _testUserId = "integration-test-user";

    public TodoApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    private string GenerateJwtToken(string userId, string issuer = "test-issuer")
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("this-is-a-test-key-that-is-long-enough-for-security"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("sub", userId),
            new Claim("name", "Test User"),
            new Claim("email", "test@example.com"),
            new Claim("iss", issuer)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: "test-audience",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void SetAuthorizationHeader()
    {
        var token = GenerateJwtToken(_testUserId);
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
    }

    [Fact]
    public async Task GetTodos_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/todo");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTodos_WithAuth_ReturnsEmptyList()
    {
        // Arrange
        SetAuthorizationHeader();

        // Act
        var response = await _client.GetAsync("/api/todo");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var todos = await response.Content.ReadFromJsonAsync<TodoResponse[]>();
        todos.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateTodo_WithValidData_ReturnsCreated()
    {
        // Arrange
        SetAuthorizationHeader();
        var request = new CreateTodoRequest
        {
            Title = "Integration Test Todo",
            Description = "This is a test todo"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/todo", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var todo = await response.Content.ReadFromJsonAsync<TodoResponse>();
        todo.Should().NotBeNull();
        todo!.Title.Should().Be("Integration Test Todo");
        todo.Description.Should().Be("This is a test todo");
        todo.IsCompleted.Should().BeFalse();
        todo.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreateTodo_WithEmptyTitle_ReturnsBadRequest()
    {
        // Arrange
        SetAuthorizationHeader();
        var request = new CreateTodoRequest
        {
            Title = "",
            Description = "This should fail"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/todo", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetTodo_WithValidId_ReturnsTodo()
    {
        // Arrange
        SetAuthorizationHeader();
        var createRequest = new CreateTodoRequest
        {
            Title = "Test Todo for Get",
            Description = "Description for get test"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/todo", createRequest);
        var createdTodo = await createResponse.Content.ReadFromJsonAsync<TodoResponse>();

        // Act
        var response = await _client.GetAsync($"/api/todo/{createdTodo!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var todo = await response.Content.ReadFromJsonAsync<TodoResponse>();
        todo.Should().NotBeNull();
        todo!.Id.Should().Be(createdTodo.Id);
        todo.Title.Should().Be("Test Todo for Get");
    }

    [Fact]
    public async Task GetTodo_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        SetAuthorizationHeader();

        // Act
        var response = await _client.GetAsync("/api/todo/999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateTodo_WithValidData_ReturnsUpdatedTodo()
    {
        // Arrange
        SetAuthorizationHeader();
        var createRequest = new CreateTodoRequest
        {
            Title = "Original Title",
            Description = "Original Description"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/todo", createRequest);
        var createdTodo = await createResponse.Content.ReadFromJsonAsync<TodoResponse>();

        var updateRequest = new UpdateTodoRequest
        {
            Title = "Updated Title",
            Description = "Updated Description",
            IsCompleted = true
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/todo/{createdTodo!.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedTodo = await response.Content.ReadFromJsonAsync<TodoResponse>();
        updatedTodo.Should().NotBeNull();
        updatedTodo!.Title.Should().Be("Updated Title");
        updatedTodo.Description.Should().Be("Updated Description");
        updatedTodo.IsCompleted.Should().BeTrue();
        updatedTodo.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateTodo_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        SetAuthorizationHeader();
        var updateRequest = new UpdateTodoRequest
        {
            Title = "Updated Title"
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/todo/999", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteTodo_WithValidId_ReturnsNoContent()
    {
        // Arrange
        SetAuthorizationHeader();
        var createRequest = new CreateTodoRequest
        {
            Title = "Todo to Delete",
            Description = "This will be deleted"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/todo", createRequest);
        var createdTodo = await createResponse.Content.ReadFromJsonAsync<TodoResponse>();

        // Act
        var response = await _client.DeleteAsync($"/api/todo/{createdTodo!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify todo is deleted
        var getResponse = await _client.GetAsync($"/api/todo/{createdTodo.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteTodo_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        SetAuthorizationHeader();

        // Act
        var response = await _client.DeleteAsync("/api/todo/999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task FullTodoLifecycle_WorksCorrectly()
    {
        // Arrange
        SetAuthorizationHeader();

        // Create
        var createRequest = new CreateTodoRequest
        {
            Title = "Lifecycle Test Todo",
            Description = "Testing full lifecycle"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/todo", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdTodo = await createResponse.Content.ReadFromJsonAsync<TodoResponse>();

        // Read
        var getResponse = await _client.GetAsync($"/api/todo/{createdTodo!.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Update
        var updateRequest = new UpdateTodoRequest
        {
            Title = "Updated Lifecycle Todo",
            IsCompleted = true
        };

        var updateResponse = await _client.PutAsJsonAsync($"/api/todo/{createdTodo.Id}", updateRequest);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedTodo = await updateResponse.Content.ReadFromJsonAsync<TodoResponse>();
        updatedTodo!.IsCompleted.Should().BeTrue();

        // List
        var listResponse = await _client.GetAsync("/api/todo");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var todos = await listResponse.Content.ReadFromJsonAsync<TodoResponse[]>();
        todos.Should().Contain(t => t.Id == createdTodo.Id);

        // Delete
        var deleteResponse = await _client.DeleteAsync($"/api/todo/{createdTodo.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify deletion
        var getAfterDeleteResponse = await _client.GetAsync($"/api/todo/{createdTodo.Id}");
        getAfterDeleteResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UserIsolation_TodosAreUserSpecific()
    {
        // Arrange - User 1
        var token1 = GenerateJwtToken("user-1");
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token1);

        var request1 = new CreateTodoRequest { Title = "User 1 Todo", Description = "User 1 Description" };
        var createResponse1 = await _client.PostAsJsonAsync("/api/todo", request1);
        var todo1 = await createResponse1.Content.ReadFromJsonAsync<TodoResponse>();

        // Arrange - User 2
        var token2 = GenerateJwtToken("user-2");
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token2);

        var request2 = new CreateTodoRequest { Title = "User 2 Todo", Description = "User 2 Description" };
        var createResponse2 = await _client.PostAsJsonAsync("/api/todo", request2);

        // Act - User 2 tries to access User 1's todo
        var getResponse = await _client.GetAsync($"/api/todo/{todo1!.Id}");

        // Assert
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Act - User 2 gets their own todos
        var listResponse = await _client.GetAsync("/api/todo");
        var todos = await listResponse.Content.ReadFromJsonAsync<TodoResponse[]>();

        // Assert
        todos.Should().HaveCount(1);
        todos![0].Title.Should().Be("User 2 Todo");
    }
}