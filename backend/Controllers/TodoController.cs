using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Models;
using TodoApi.Services;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AuthenticatedUser")]
public class TodoController : ControllerBase
{
    private readonly ITodoService _todoService;

    public TodoController(ITodoService todoService)
    {
        _todoService = todoService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
               User.FindFirst("sub")?.Value ?? 
               User.FindFirst("oid")?.Value ?? string.Empty;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TodoResponse>>> GetTodos()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found");
        }

        var todos = await _todoService.GetTodosAsync(userId);
        var response = todos.Select(t => new TodoResponse
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            IsCompleted = t.IsCompleted,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        });

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TodoResponse>> GetTodo(int id)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found");
        }

        var todo = await _todoService.GetTodoAsync(id, userId);
        if (todo == null)
        {
            return NotFound();
        }

        var response = new TodoResponse
        {
            Id = todo.Id,
            Title = todo.Title,
            Description = todo.Description,
            IsCompleted = todo.IsCompleted,
            CreatedAt = todo.CreatedAt,
            UpdatedAt = todo.UpdatedAt
        };

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<TodoResponse>> CreateTodo(CreateTodoRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required");
        }

        var todo = await _todoService.CreateTodoAsync(request, userId);
        var response = new TodoResponse
        {
            Id = todo.Id,
            Title = todo.Title,
            Description = todo.Description,
            IsCompleted = todo.IsCompleted,
            CreatedAt = todo.CreatedAt,
            UpdatedAt = todo.UpdatedAt
        };

        return CreatedAtAction(nameof(GetTodo), new { id = todo.Id }, response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TodoResponse>> UpdateTodo(int id, UpdateTodoRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found");
        }

        var todo = await _todoService.UpdateTodoAsync(id, request, userId);
        if (todo == null)
        {
            return NotFound();
        }

        var response = new TodoResponse
        {
            Id = todo.Id,
            Title = todo.Title,
            Description = todo.Description,
            IsCompleted = todo.IsCompleted,
            CreatedAt = todo.CreatedAt,
            UpdatedAt = todo.UpdatedAt
        };

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTodo(int id)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User ID not found");
        }

        var deleted = await _todoService.DeleteTodoAsync(id, userId);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}