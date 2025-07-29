using TodoApi.Models;
using System.Collections.Concurrent;

namespace TodoApi.Services;

public class InMemoryTodoService : ITodoService
{
    private readonly ConcurrentDictionary<int, TodoItem> _todos = new();
    private int _nextId = 1;

    public Task<IEnumerable<TodoItem>> GetTodosAsync(string userId)
    {
        var userTodos = _todos.Values.Where(t => t.UserId == userId).OrderByDescending(t => t.CreatedAt);
        return Task.FromResult(userTodos);
    }

    public Task<TodoItem?> GetTodoAsync(int id, string userId)
    {
        _todos.TryGetValue(id, out var todo);
        return Task.FromResult(todo?.UserId == userId ? todo : null);
    }

    public Task<TodoItem> CreateTodoAsync(CreateTodoRequest request, string userId)
    {
        var todo = new TodoItem
        {
            Id = Interlocked.Increment(ref _nextId),
            Title = request.Title,
            Description = request.Description,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _todos.TryAdd(todo.Id, todo);
        return Task.FromResult(todo);
    }

    public Task<TodoItem?> UpdateTodoAsync(int id, UpdateTodoRequest request, string userId)
    {
        if (!_todos.TryGetValue(id, out var todo) || todo.UserId != userId)
        {
            return Task.FromResult<TodoItem?>(null);
        }

        if (!string.IsNullOrEmpty(request.Title))
            todo.Title = request.Title;

        if (!string.IsNullOrEmpty(request.Description))
            todo.Description = request.Description;

        if (request.IsCompleted.HasValue)
            todo.IsCompleted = request.IsCompleted.Value;

        todo.UpdatedAt = DateTime.UtcNow;

        return Task.FromResult<TodoItem?>(todo);
    }

    public Task<bool> DeleteTodoAsync(int id, string userId)
    {
        if (_todos.TryGetValue(id, out var todo) && todo.UserId == userId)
        {
            return Task.FromResult(_todos.TryRemove(id, out _));
        }
        return Task.FromResult(false);
    }
}