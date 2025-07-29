import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TodoService } from '../../services/todo.service';
import { AuthService } from '../../services/auth.service';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../models/todo.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header">
      <div class="header-content">
        <h1>My Todos</h1>
        <div class="user-info" *ngIf="user">
          <span>{{ user.name }}</span>
          <button class="btn btn-secondary" (click)="goToDashboard()">Dashboard</button>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- Add New Todo -->
      <div class="card">
        <h3>Add New Todo</h3>
        <form (ngSubmit)="createTodo()" #todoForm="ngForm">
          <div class="form-group">
            <label for="title">Title *</label>
            <input
              type="text"
              id="title"
              class="form-control"
              [(ngModel)]="newTodo.title"
              name="title"
              required
              placeholder="Enter todo title">
          </div>
          
          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              class="form-control"
              [(ngModel)]="newTodo.description"
              name="description"
              rows="3"
              placeholder="Enter todo description"></textarea>
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary"
            [disabled]="!todoForm.valid || isLoading">
            {{ isLoading ? 'Creating...' : 'Create Todo' }}
          </button>
        </form>
      </div>

      <!-- Error Message -->
      <div class="error" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="isLoading && todos.length === 0">
        <div class="spinner"></div>
        <div style="margin-left: 15px;">Loading todos...</div>
      </div>

      <!-- Todos List -->
      <div class="card" *ngIf="todos.length > 0">
        <h3>Your Todos ({{ todos.length }})</h3>
        
        <div class="todo-item" *ngFor="let todo of todos; trackBy: trackByTodoId">
          <div class="todo-content" *ngIf="editingTodoId !== todo.id">
            <div class="todo-header">
              <h4 [class.completed]="todo.isCompleted">{{ todo.title }}</h4>
              <div class="todo-actions">
                <button 
                  class="btn btn-sm"
                  [class.btn-primary]="!todo.isCompleted"
                  [class.btn-secondary]="todo.isCompleted"
                  (click)="toggleComplete(todo)">
                  {{ todo.isCompleted ? 'Mark Incomplete' : 'Mark Complete' }}
                </button>
                <button class="btn btn-sm btn-secondary" (click)="startEdit(todo)">
                  Edit
                </button>
                <button class="btn btn-sm btn-danger" (click)="deleteTodo(todo.id)">
                  Delete
                </button>
              </div>
            </div>
            
            <p *ngIf="todo.description" [class.completed]="todo.isCompleted">
              {{ todo.description }}
            </p>
            
            <div class="todo-meta">
              <small>
                Created: {{ formatDate(todo.createdAt) }}
                <span *ngIf="todo.updatedAt"> | Updated: {{ formatDate(todo.updatedAt) }}</span>
              </small>
            </div>
          </div>

          <!-- Edit Form -->
          <div class="todo-edit" *ngIf="editingTodoId === todo.id">
            <form (ngSubmit)="updateTodo()" #editForm="ngForm">
              <div class="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="editingTodo.title"
                  name="editTitle"
                  required>
              </div>
              
              <div class="form-group">
                <label>Description</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="editingTodo.description"
                  name="editDescription"
                  rows="3"></textarea>
              </div>
              
              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  [disabled]="!editForm.valid">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  class="btn btn-secondary"
                  (click)="cancelEdit()">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="card" *ngIf="todos.length === 0 && !isLoading">
        <div style="text-align: center; padding: 40px;">
          <h3>No todos yet!</h3>
          <p>Create your first todo using the form above.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .todo-item {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 15px;
      background: #fafafa;
    }

    .todo-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .todo-actions {
      display: flex;
      gap: 5px;
    }

    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
    }

    .completed {
      text-decoration: line-through;
      color: #666;
    }

    .todo-meta {
      margin-top: 10px;
      color: #888;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .todo-content h4 {
      margin: 0;
      flex: 1;
    }

    @media (max-width: 768px) {
      .todo-header {
        flex-direction: column;
        align-items: stretch;
      }
      
      .todo-actions {
        margin-top: 10px;
        justify-content: flex-start;
      }
    }
  `]
})
export class TodoListComponent implements OnInit {
  todos: Todo[] = [];
  user: User | null = null;
  isLoading = false;
  errorMessage = '';
  
  newTodo: CreateTodoRequest = {
    title: '',
    description: ''
  };
  
  editingTodoId: number | null = null;
  editingTodo: UpdateTodoRequest = {};

  constructor(
    private todoService: TodoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
    
    this.loadTodos();
  }

  loadTodos(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.todoService.getTodos().subscribe({
      next: (todos) => {
        this.todos = todos;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading todos:', error);
        this.errorMessage = 'Failed to load todos. Please try again.';
        this.isLoading = false;
      }
    });
  }

  createTodo(): void {
    if (!this.newTodo.title.trim()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.todoService.createTodo(this.newTodo).subscribe({
      next: (todo) => {
        this.todos.unshift(todo);
        this.newTodo = { title: '', description: '' };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating todo:', error);
        this.errorMessage = 'Failed to create todo. Please try again.';
        this.isLoading = false;
      }
    });
  }

  startEdit(todo: Todo): void {
    this.editingTodoId = todo.id;
    this.editingTodo = {
      title: todo.title,
      description: todo.description,
      isCompleted: todo.isCompleted
    };
  }

  updateTodo(): void {
    if (!this.editingTodoId || !this.editingTodo.title?.trim()) {
      return;
    }

    this.todoService.updateTodo(this.editingTodoId, this.editingTodo).subscribe({
      next: (updatedTodo) => {
        const index = this.todos.findIndex(t => t.id === this.editingTodoId);
        if (index !== -1) {
          this.todos[index] = updatedTodo;
        }
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error updating todo:', error);
        this.errorMessage = 'Failed to update todo. Please try again.';
      }
    });
  }

  cancelEdit(): void {
    this.editingTodoId = null;
    this.editingTodo = {};
  }

  toggleComplete(todo: Todo): void {
    const updateRequest: UpdateTodoRequest = {
      isCompleted: !todo.isCompleted
    };

    this.todoService.updateTodo(todo.id, updateRequest).subscribe({
      next: (updatedTodo) => {
        const index = this.todos.findIndex(t => t.id === todo.id);
        if (index !== -1) {
          this.todos[index] = updatedTodo;
        }
      },
      error: (error) => {
        console.error('Error toggling todo:', error);
        this.errorMessage = 'Failed to update todo status. Please try again.';
      }
    });
  }

  deleteTodo(todoId: number): void {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    this.todoService.deleteTodo(todoId).subscribe({
      next: () => {
        this.todos = this.todos.filter(t => t.id !== todoId);
      },
      error: (error) => {
        console.error('Error deleting todo:', error);
        this.errorMessage = 'Failed to delete todo. Please try again.';
      }
    });
  }

  trackByTodoId(index: number, todo: Todo): number {
    return todo.id;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}