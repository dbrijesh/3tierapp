using TodoApi.Models;
using TodoApi.Services;
using Xunit;
using FluentAssertions;

namespace TodoApi.Tests.Services;

public class InMemoryTodoServiceTests
{
    private readonly InMemoryTodoService _service;
    private readonly string _testUserId = "test-user-123";
    private readonly string _otherUserId = "other-user-456";

    public InMemoryTodoServiceTests()
    {
        _service = new InMemoryTodoService();
    }

    [Fact]
    public async Task GetTodosAsync_WithNoTodos_ReturnsEmptyList()
    {
        // Act
        var result = await _service.GetTodosAsync(_testUserId);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateTodoAsync_WithValidRequest_CreatesTodo()
    {
        // Arrange
        var request = new CreateTodoRequest
        {
            Title = "Test Todo",
            Description = "Test Description"
        };

        // Act
        var result = await _service.CreateTodoAsync(request, _testUserId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.Title.Should().Be("Test Todo");
        result.Description.Should().Be("Test Description");
        result.UserId.Should().Be(_testUserId);
        result.IsCompleted.Should().BeFalse();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        result.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public async Task GetTodosAsync_WithExistingTodos_ReturnsUserTodosOnly()
    {
        // Arrange
        var request1 = new CreateTodoRequest { Title = "User 1 Todo 1", Description = "Description 1" };
        var request2 = new CreateTodoRequest { Title = "User 1 Todo 2", Description = "Description 2" };
        var request3 = new CreateTodoRequest { Title = "User 2 Todo 1", Description = "Description 3" };

        await _service.CreateTodoAsync(request1, _testUserId);
        await _service.CreateTodoAsync(request2, _testUserId);
        await _service.CreateTodoAsync(request3, _otherUserId);

        // Act
        var result = await _service.GetTodosAsync(_testUserId);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(t => t.UserId == _testUserId);
        result.Should().BeInDescendingOrder(t => t.CreatedAt);
    }

    [Fact]
    public async Task GetTodoAsync_WithValidIdAndUser_ReturnsTodo()
    {
        // Arrange
        var request = new CreateTodoRequest { Title = "Test Todo", Description = "Test Description" };
        var createdTodo = await _service.CreateTodoAsync(request, _testUserId);

        // Act
        var result = await _service.GetTodoAsync(createdTodo.Id, _testUserId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(createdTodo.Id);
        result.Title.Should().Be("Test Todo");
        result.UserId.Should().Be(_testUserId);
    }

    [Fact]
    public async Task GetTodoAsync_WithInvalidId_ReturnsNull()
    {
        // Act
        var result = await _service.GetTodoAsync(999, _testUserId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetTodoAsync_WithValidIdButWrongUser_ReturnsNull()
    {
        // Arrange
        var request = new CreateTodoRequest { Title = "Test Todo", Description = "Test Description" };
        var createdTodo = await _service.CreateTodoAsync(request, _testUserId);

        // Act
        var result = await _service.GetTodoAsync(createdTodo.Id, _otherUserId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateTodoAsync_WithValidRequest_UpdatesTodo()
    {
        // Arrange
        var createRequest = new CreateTodoRequest { Title = "Original Title", Description = "Original Description" };
        var createdTodo = await _service.CreateTodoAsync(createRequest, _testUserId);

        var updateRequest = new UpdateTodoRequest
        {
            Title = "Updated Title",
            Description = "Updated Description",
            IsCompleted = true
        };

        // Act
        var result = await _service.UpdateTodoAsync(createdTodo.Id, updateRequest, _testUserId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(createdTodo.Id);
        result.Title.Should().Be("Updated Title");
        result.Description.Should().Be("Updated Description");
        result.IsCompleted.Should().BeTrue();
        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        result.CreatedAt.Should().Be(createdTodo.CreatedAt);
    }

    [Fact]
    public async Task UpdateTodoAsync_WithPartialUpdate_UpdatesOnlyProvidedFields()
    {
        // Arrange
        var createRequest = new CreateTodoRequest { Title = "Original Title", Description = "Original Description" };
        var createdTodo = await _service.CreateTodoAsync(createRequest, _testUserId);

        var updateRequest = new UpdateTodoRequest
        {
            Title = "Updated Title"
            // Description and IsCompleted not provided
        };

        // Act
        var result = await _service.UpdateTodoAsync(createdTodo.Id, updateRequest, _testUserId);

        // Assert
        result.Should().NotBeNull();
        result!.Title.Should().Be("Updated Title");
        result.Description.Should().Be("Original Description"); // Unchanged
        result.IsCompleted.Should().BeFalse(); // Unchanged
    }

    [Fact]
    public async Task UpdateTodoAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        var updateRequest = new UpdateTodoRequest { Title = "Updated Title" };

        // Act
        var result = await _service.UpdateTodoAsync(999, updateRequest, _testUserId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateTodoAsync_WithWrongUser_ReturnsNull()
    {
        // Arrange
        var createRequest = new CreateTodoRequest { Title = "Test Todo", Description = "Test Description" };
        var createdTodo = await _service.CreateTodoAsync(createRequest, _testUserId);

        var updateRequest = new UpdateTodoRequest { Title = "Updated Title" };

        // Act
        var result = await _service.UpdateTodoAsync(createdTodo.Id, updateRequest, _otherUserId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteTodoAsync_WithValidIdAndUser_DeletesTodo()
    {
        // Arrange
        var request = new CreateTodoRequest { Title = "Test Todo", Description = "Test Description" };
        var createdTodo = await _service.CreateTodoAsync(request, _testUserId);

        // Act
        var result = await _service.DeleteTodoAsync(createdTodo.Id, _testUserId);
        var getTodoResult = await _service.GetTodoAsync(createdTodo.Id, _testUserId);

        // Assert
        result.Should().BeTrue();
        getTodoResult.Should().BeNull();
    }

    [Fact]
    public async Task DeleteTodoAsync_WithInvalidId_ReturnsFalse()
    {
        // Act
        var result = await _service.DeleteTodoAsync(999, _testUserId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteTodoAsync_WithWrongUser_ReturnsFalse()
    {
        // Arrange
        var request = new CreateTodoRequest { Title = "Test Todo", Description = "Test Description" };
        var createdTodo = await _service.CreateTodoAsync(request, _testUserId);

        // Act
        var result = await _service.DeleteTodoAsync(createdTodo.Id, _otherUserId);
        var getTodoResult = await _service.GetTodoAsync(createdTodo.Id, _testUserId);

        // Assert
        result.Should().BeFalse();
        getTodoResult.Should().NotBeNull(); // Todo should still exist
    }

    [Fact]
    public async Task ConcurrentOperations_ShouldBeThreadSafe()
    {
        // Arrange
        var tasks = new List<Task<TodoItem>>();
        var numberOfTasks = 10;

        // Act - Create multiple todos concurrently
        for (int i = 0; i < numberOfTasks; i++)
        {
            var request = new CreateTodoRequest 
            { 
                Title = $"Concurrent Todo {i}", 
                Description = $"Description {i}" 
            };
            tasks.Add(_service.CreateTodoAsync(request, _testUserId));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        results.Should().HaveCount(numberOfTasks);
        results.Select(r => r.Id).Should().OnlyHaveUniqueItems();
        results.Should().OnlyContain(r => r.UserId == _testUserId);
        
        var allTodos = await _service.GetTodosAsync(_testUserId);
        allTodos.Should().HaveCount(numberOfTasks);
    }
}