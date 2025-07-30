using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using TodoApi.Controllers;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;
using FluentAssertions;

namespace TodoApi.Tests.Controllers;

public class TodoControllerTests
{
    private readonly Mock<ITodoService> _mockTodoService;
    private readonly TodoController _controller;
    private readonly string _testUserId = "test-user-123";

    public TodoControllerTests()
    {
        _mockTodoService = new Mock<ITodoService>();
        _controller = new TodoController(_mockTodoService.Object);
        SetupUserContext();
    }

    private void SetupUserContext()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, _testUserId),
            new("sub", _testUserId)
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
    }

    [Fact]
    public async Task GetTodos_WithValidUser_ReturnsOkWithTodos()
    {
        // Arrange
        var todos = new List<TodoItem>
        {
            new() { Id = 1, Title = "Test Todo 1", Description = "Description 1", UserId = _testUserId },
            new() { Id = 2, Title = "Test Todo 2", Description = "Description 2", UserId = _testUserId }
        };

        _mockTodoService.Setup(s => s.GetTodosAsync(_testUserId))
            .ReturnsAsync(todos);

        // Act
        var result = await _controller.GetTodos();

        // Assert
        result.Should().BeOfType<ActionResult<IEnumerable<TodoResponse>>>();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedTodos = okResult.Value.Should().BeAssignableTo<IEnumerable<TodoResponse>>().Subject;
        returnedTodos.Should().HaveCount(2);
        returnedTodos.First().Title.Should().Be("Test Todo 1");
    }

    [Fact]
    public async Task GetTodos_WithInvalidUser_ReturnsUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetTodos();

        // Assert
        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task GetTodo_WithValidIdAndUser_ReturnsOkWithTodo()
    {
        // Arrange
        var todoId = 1;
        var todo = new TodoItem 
        { 
            Id = todoId, 
            Title = "Test Todo", 
            Description = "Description", 
            UserId = _testUserId 
        };

        _mockTodoService.Setup(s => s.GetTodoAsync(todoId, _testUserId))
            .ReturnsAsync(todo);

        // Act
        var result = await _controller.GetTodo(todoId);

        // Assert
        result.Should().BeOfType<ActionResult<TodoResponse>>();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedTodo = okResult.Value.Should().BeOfType<TodoResponse>().Subject;
        returnedTodo.Title.Should().Be("Test Todo");
        returnedTodo.Id.Should().Be(todoId);
    }

    [Fact]
    public async Task GetTodo_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var todoId = 999;
        _mockTodoService.Setup(s => s.GetTodoAsync(todoId, _testUserId))
            .ReturnsAsync((TodoItem?)null);

        // Act
        var result = await _controller.GetTodo(todoId);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateTodo_WithValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateTodoRequest
        {
            Title = "New Todo",
            Description = "New Description"
        };

        var createdTodo = new TodoItem
        {
            Id = 1,
            Title = request.Title,
            Description = request.Description,
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow
        };

        _mockTodoService.Setup(s => s.CreateTodoAsync(request, _testUserId))
            .ReturnsAsync(createdTodo);

        // Act
        var result = await _controller.CreateTodo(request);

        // Assert
        result.Should().BeOfType<ActionResult<TodoResponse>>();
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var returnedTodo = createdResult.Value.Should().BeOfType<TodoResponse>().Subject;
        returnedTodo.Title.Should().Be("New Todo");
        returnedTodo.Description.Should().Be("New Description");
    }

    [Fact]
    public async Task CreateTodo_WithEmptyTitle_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateTodoRequest
        {
            Title = "",
            Description = "Description"
        };

        // Act
        var result = await _controller.CreateTodo(request);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
        _mockTodoService.Verify(s => s.CreateTodoAsync(It.IsAny<CreateTodoRequest>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UpdateTodo_WithValidRequest_ReturnsOkWithUpdatedTodo()
    {
        // Arrange
        var todoId = 1;
        var request = new UpdateTodoRequest
        {
            Title = "Updated Title",
            Description = "Updated Description",
            IsCompleted = true
        };

        var updatedTodo = new TodoItem
        {
            Id = todoId,
            Title = request.Title!,
            Description = request.Description!,
            IsCompleted = request.IsCompleted!.Value,
            UserId = _testUserId,
            UpdatedAt = DateTime.UtcNow
        };

        _mockTodoService.Setup(s => s.UpdateTodoAsync(todoId, request, _testUserId))
            .ReturnsAsync(updatedTodo);

        // Act
        var result = await _controller.UpdateTodo(todoId, request);

        // Assert
        result.Should().BeOfType<ActionResult<TodoResponse>>();
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedTodo = okResult.Value.Should().BeOfType<TodoResponse>().Subject;
        returnedTodo.Title.Should().Be("Updated Title");
        returnedTodo.IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateTodo_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var todoId = 999;
        var request = new UpdateTodoRequest { Title = "Updated Title" };

        _mockTodoService.Setup(s => s.UpdateTodoAsync(todoId, request, _testUserId))
            .ReturnsAsync((TodoItem?)null);

        // Act
        var result = await _controller.UpdateTodo(todoId, request);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeleteTodo_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var todoId = 1;
        _mockTodoService.Setup(s => s.DeleteTodoAsync(todoId, _testUserId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteTodo(todoId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteTodo_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var todoId = 999;
        _mockTodoService.Setup(s => s.DeleteTodoAsync(todoId, _testUserId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteTodo(todoId);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }
}